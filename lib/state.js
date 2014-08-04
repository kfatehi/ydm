var dockerConnect = require('./docker_connect')
  , Promise = require('bluebird')
  , rm_rf = require('rimraf')
  , _ = require('lodash')

function State(scope) {
  var dockerConnection = dockerConnect.connect()
    , docker = dockerConnection.docker
    , state = null

  var config = scope.localStorage.getItem('_config');
  if ( ! config) {
    scope.localStorage.setItem('_config', JSON.stringify({
      volumes: {}
    }));
  }

  if ( ! dockerConnection.local) {
    throw new Error('Only local docker connections are supported at this time.')
  }

  state = {
    getContainer: function () {
      return docker.getContainer(scope.localStorage.getItem('_id'))
    },
    prepareConfig: function (config) {
      // Support passing in the Env as an object
      if (config.create && config.create.Env) {
        if (_.isObject(config.create.Env)) {
          config.create.Env = _.map(config.create.Env, function (value, key) {
            return key+"="+value
          })
        }
      }

      config.createOpts = _.assign({
        name: scope.name,
        Env: []
      }, config.create);

      config.startOpts = _.assign({
        Binds: [],
        Links: [],
      }, config.start);

      scope.localStorage.setItem('_numVolumes', config.startOpts.Binds.length);
      scope.localStorage.setItem('_numLinks', config.startOpts.Links.length);
      scope.localStorage.setItem('_config', JSON.stringify(config));
      return config;
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
            scope.localStorage.setItem('_id', container.id);
            container.start(config.startOpts, function (err) {
              if (err) cb(err);
              else state.apply(scope, config, cb);
            });
          }
        });
      } else {
        if (err.code === "EACCES" && err.syscall === "connect" && local && dockerOpts.socketPath) {
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
            var numVolumes = scope.localStorage.getItem('_numVolumes')
            if (numVolumes > 0) {
              this.ensureVolumesBound(liveInfo.HostConfig.Binds, cb)  
            } else cb(err)
          }
        }
      }.bind(this));
    },
    ensureVolumesBound: function (liveBinds, cb) {
      var volumes = JSON.parse(scope.localStorage.getItem('_config')).volumes
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
        if (removeVolumes) promises.push(promiseVolumeRemoval());
        if (removeLinks) promises.push(promiseLinkRemoval());
        promises.push(promiseScopeRemoval());
        Promise.all(promises).finally(cb);
      })
    }
  } 

  var promiseVolumeRemoval = function () {
    return new Promise(function (resolve, reject) {
      console.log("Checking for volumes to remove");
      var numVolumes = scope.localStorage.getItem('_numVolumes')
      if (numVolumes > 0) {
        var done = _.after(numVolumes, function () {
          console.log("Destroyed container "+scope.name);
          resolve()
        });
        var volumes = JSON.parse(scope.localStorage.getItem('_config')).volumes
        _.each(volumes, function (c, name) {
          rm_rf(scope.getVolumePath(name), function (err) {
            if (err) reject(err);
            else done();
          })
        })
      } else resolve()
    })
  }

  var promiseLinkRemoval = function() {
    return new Promise(function (resolve, reject) {
      console.log("Checking for links to remove");
      var numLinks = scope.localStorage.getItem('_numLinks')
      if (numLinks > 0) {
        reject(new Error("not yet implemented!"))
      } else resolve()
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
