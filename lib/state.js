var dockerConnect = require('./docker_connect');

module.exports = function (scope) {
  var dockerConnection = dockerConnect()
    , docker = dockerConnection.docker
    , container = docker.getContainer(scope.localStorage.getItem('id'))

  if ( ! dockerConnection.local) {
    throw new Error('Only local docker connections are supported at this time.')
  }

  return {
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
            scope.data.id = container.id;
            save();
            container.start(config.options.start, function (err) {
              if (err) {
                cb(new Error(err));
              } else {
                save();
                apply(scope, config, cb);
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
    }
  } 
}
