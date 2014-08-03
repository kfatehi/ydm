var dockerConnect = require('./docker_connect')
  , rm_rf = require('rimraf')
  , _ = require('lodash')

function State(scope) {
  var dockerConnection = dockerConnect()
    , docker = dockerConnection.docker
    , state = null

  if ( ! dockerConnection.local) {
    throw new Error('Only local docker connections are supported at this time.')
  }

  state = {
    getContainer: function () {
      return docker.getContainer(scope.localStorage.getItem('_id'))
    },
    apply: function (scope, config, cb) {
      this.getContainer().inspect(function (err, res) {
        if (err) {
          this.handleInspectError(err, config, cb)
        } else state.ensure(cb);
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
              if (err) {
                cb(new Error(err));
              } else {
                state.apply(scope, config, cb);
              }
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
          var numVolumes = scope.localStorage.getItem('_numVolumes')
          if (numVolumes > 0) {
            this.ensureVolumesBound(liveInfo.HostConfig.Binds, cb)  
          } else cb(err)
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
      var removeVolumes = true; // on by default
      this.getContainer().remove({
        force: true, // Stop container and remove
        v: removeVolumes // Remove volumes
      }, function (err) {
        var numVolumes = scope.localStorage.getItem('_numVolumes')
        if (err) {
          cb(new Error(err));
        } else if (numVolumes > 0) {
          var done = _.after(numVolumes, function () {
            console.log("Destroyed container "+scope.name);
            cb(null);
          });
          var volumes = JSON.parse(scope.localStorage.getItem('_config')).volumes
          _.each(volumes, function (c, name) {
            rm_rf(scope.getVolumePath(name), done)
          })
        } else cb(null)
      })
    }
  } 
  return state;
}

module.exports = State;
