var dataFile = null
  , dockerHost = process.env.DOCKER_HOST
  , Docker = require('dockerode')
  , URI = require("uri-js")
  , path = require('path')
  , _ = require('lodash')
  , fs = require('fs')
  , container = null
  , docker = null
  , scope = null

function save() {
  fs.writeFileSync(dataFile, JSON.stringify(scope.data, null, 4));
};

function load() {
  try {
    scope.data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));  
  } catch (e) {
    save();
  }
};

function Scope(home, name) {
  scope = this
  scope.data = { name: name }
  dataFile = path.join(home, 'data.json')
  if (dockerHost) {
    docker = new Docker(URI.parse(dockerHost));
  } else if (fs.existsSync('/var/run/docker.sock')) {
    docker = new Docker({socketPath: '/var/run/docker.sock'})
  } else {
    throw new Error("Failed to setup docker client");
  }
  if ( fs.existsSync(dataFile) ) {
    load();
  } else {
    save();
  }
  container = docker.getContainer(this.id);
};

Scope.prototype = {
  applyConfig: function (config, cb) {
    this.data.config = config;
    apply(this, config, cb);
  }
};

function handleInspectError(err, config, cb) {
  if (err.statusCode === 404) {
    docker.createContainer({
      Image: config.image,
      name: scope.data.name,
    }, function (err, container) {
      if (err) {
        if (err.statusCode === 404) {
          pull(config.image, function (err, res) {
            if (err) {
              cb(err)
            } else apply(config, cb);
          });
        } else cb(err)
      } else {
        scope.data.id = container.id;
        container.start(function (err) {
          if (err) {
            cb(err);
          } else {
            save();
            ensure(scope, config, cb);
          }
        });
      }
    }.bind(this));
  } else cb(err);
}

function apply(scope, config, cb) {
  container.inspect(function (err, res) {
    if (err) {
      handleInspectError(err, config, cb)
    } else ensure(scope, config, cb);
  });
};

function pull(image, cb) {
  docker.pull(image, function (err, stream) {  
    if (err) cb(err)
    else {
      stream.on('error', function(err) { cb(err) });
      stream.on('finish', function() { cb(err) });
      stream.on('data', function (chunk) {
        var data = JSON.parse(chunk.toString());
        if (data.error) {
          cb(new Error("Pull failed. "+data.error))
        } else {
          // consider using https://www.npmjs.org/package/progress
          console.info(data);
        }
      });
    }
  });
};

module.exports = Scope
