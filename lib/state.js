var dockerConnect = require('./docker_connect')
  , rm_rf = require('rimraf')
  , _ = require('lodash')

function State(scope) {
  var dockerConnection = dockerConnect()
    , docker = dockerConnection.docker
    , container = docker.getContainer(scope.localStorage.getItem('id'))
    , state = null

  if ( ! dockerConnection.local) {
    throw new Error('Only local docker connections are supported at this time.')
  }

  state = {
    container: container,
    apply: function (scope, config, cb) {
      container.inspect(function (err, res) {
        if (err) {
          this.handleInspectError(err, config, cb)
        } else ensure(scope, config, cb);
      }.bind(this));
    },
    handleInspectError: function (err, config, cb) {
      if (err.statusCode === 404) {
        var createOpts = {
          name: scope.name,
          Image: config.image,
        };
        docker.createContainer(createOpts, function (err, container) {
          if (err) {
            if (err.statusCode === 404) {
              pull(config.image, function (err, res) {
                if (err) {
                  cb(new Error(err))
                } else {
                  apply(scope, config, cb);
                }
              });
            } else cb(new Error(err))
          } else {
            scope.localStorage.setItem('id', container.id);
            container.start(config.options.start, function (err) {
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
    destroy: function (cb) {
      var removeVolumes = true; // on by default
      console.log("Removing container")
      container.remove({
        force: true, // Stop container and remove
        v: removeVolumes // Remove volumes
      }, function (err) {
        var volumes = JSON.parse(scope.localStorage.getItem('config')).volumes
          , numVolumes = scope.localStorage.getItem('numVolumes')
        if (err) {
          cb(new Error(err));
        } else if (numVolumes > 0) {
          var done = _.after(numVolumes, function () {
            cb(null);
          });
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
