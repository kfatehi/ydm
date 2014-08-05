/*
 * This is primarly where dew talks to docker for you.
 * Of course you can always just take control
 * with `scope.state.getContainer()`
 */
var dockerConnect = require('./docker_connect')
  , Promise = require('bluebird')
  , rm_rf = require('rimraf')
  , _ = require('lodash')

function State(scope) {
  var dockerConnection = dockerConnect.connect()
    , docker = dockerConnection.docker
    , state = null

  var config = scope.storage.getItem('_config');
  if ( ! config) {
    scope.storage.setItem('_config', JSON.stringify({
      volumes: {}
    }));
  }

  state = {
    getContainer: function () {
      return docker.getContainer(scope.storage.getItem('_id'))
    },
    apply: function (scope, config, cb) {
      this.getContainer().inspect(function (err, res) {
        if (err) {
          this.handleInspectError(err, config, cb)
        } else {
          if (config.removeContainerIfExists) {
            this.destroy(function () {
              config.removeContainerIfExists = false;
              state.apply(scope, config, cb)
            })
          } else state.ensure(cb);
        }
      }.bind(this));
    },
    handleInspectError: function (err, config, cb) {
      if (err.statusCode === 404) {
        if (! config.createOpts.Image) {
          return cb(new Error("Missing create option 'Image'"));
        }
        console.log("Creating container "+scope.name);
        docker.createContainer(config.createOpts, function (err, container) {
          if (err) {
            if (err.statusCode === 404) {
              pull(config.create.Image, function (err, res) {
                if (err) {
                  cb(new Error(err))
                } else {
                  state.apply(scope, config, cb);
                }
              });
            } else cb(new Error(err))
          } else {
            scope.storage.setItem('_id', container.id);
            container.start(config.startOpts, function (err) {
              if (err) cb(err);
              else state.apply(scope, config, cb);
            });
          }
        });
      } else {
        if (err.code === "EACCES" && err.syscall === "connect" && dockerOpts.socketPath) {
          console.error("Permission to access socket "+dockerOpts.socketPath+" was denied. You may want to use sudo.");
          cb(null);
        } else {
          cb(new Error(err));
        }
      }
    },
    ensure: function (cb) {
      this.getContainer().inspect(function (err, liveInfo) {
        if (err) { cb(new Error(err)) }
        else {
          // First of all, make sure it's running ...
          if ( ! liveInfo.State.Running ) {
            this.getContainer().start(function () {
              console.log("Started "+scope.name);
              state.ensure(cb)
            });
          } else {
            // Now check verything else...
            // Make sure volumes are bound
            var numVolumes = scope.storage.getItem('_numVolumes')
            if (numVolumes > 0) {
              this.ensureVolumesBound(liveInfo.HostConfig.Binds, cb)  
            } else cb(err)
          }
        }
      }.bind(this));
    },
    ensureVolumesBound: function (liveBinds, cb) {
      var volumes = JSON.parse(scope.storage.getItem('_config')).volumes
      var binds = {}
      var err = null
      _.each(liveBinds, function (pair) {
        var parts = pair.split(':')
        binds[parts[1]] = parts[0]
      });
      var done = _.after(liveBinds.length, function () {
        cb(err);
      });
      _.each(volumes, function (containerPath, volName) {
        var volPath = scope.getVolumePath(volName);
        if (binds[containerPath] !== volPath) {
          err = new Error("Volume mounted incorrectly!");
        }
        done()
      });
    },
    destroy: function (cb) {
      var removeVolumes = false; // on by default
      var removeLinks = false; // on by default
      this.getContainer().remove({
        force: true, // Stop container and remove
        v: removeVolumes // Remove volumes
      }, function (err) {
        if (err) {
          if (err.statusCode === 404) {
            console.error("Container not found -- nothing to destroy");
          } else {
            console.error(err);
          }
        }
        var promises = [];
        if (removeVolumes) promises.push(promiseManagedVolumeRemoval());
        if (removeLinks) promises.push(promiseManagedLinkRemoval());
        promises.push(promiseScopeRemoval());
        Promise.all(promises).finally(cb);
      })
    }
  } 

  var promiseManagedVolumeRemoval = function () {
    return new Promise(function (resolve, reject) {
      console.log("Checking for volumes to remove");
      var volumesJSON = scope.storage.getItem('_managedVolumes')
      if (!volumesJSON) return resolve();
      var volumes = JSON.parse(volumesJSON).Binds;
      if (volumes.length === 0) return resolve();
      var done = _.after(volumes.length, resolve)
      _.each(volumes, function (pair) {
        rm_rf(pair.split(':')[0], function (err) {
          if (err) reject(err);
          else done();
        })
      })
    })
  }

  var promiseManagedLinkRemoval = function() {
    return new Promise(function (resolve, reject) {
      console.log("Checking for links to remove");
      var linksJSON = scope.storage.getItem('_managedLinks')
      if (!linksJSON) return resolve();
      var links = JSON.parse(linksJSON).Links;
      if (links.length === 0) return resolve();
      var done = _.after(links.length, resolve)
      _.each(links, function (pair) {
        // destroy the linked containers
        // you'll need to query them by name, etc
        // here's the name you query for:
        var namespacedName = pair.split(':')[0]
        // do the logic to get the container based on this
        // actually it's impossible, you need to save aux data
        // such as the the container id inside _managedLinks
        reject(new Error('link removal not implemented yet'))
      })
    })
  }

  var promiseScopeRemoval = function () {
    return new Promise(function (resolve, reject) {
      rm_rf(scope.home, resolve);
      // TODO empty namespace? remove it.
    });
  }

  return state;
}

module.exports = State;
