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
  } finally {
    container = null;
    container = docker.getContainer(scope.data.id);
  }
};

function Scope(home, name) {
  scope = this
  scope.data = { home: home, name: name }
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
    load();
  }
};

Scope.prototype = {
  applyConfig: function (config, cb) {
    this.data.config = config;
    save();
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
              cb(new Error(err))
            } else apply(config, cb);
          });
        } else cb(new Error(err))
      } else {
        scope.data.id = container.id;
        container.start(function (err) {
          if (err) {
            cb(new Error(err));
          } else {
            save();
            apply(scope, config, cb);
          }
        });
      }
    }.bind(this));
  } else cb(new Error(err));
}

function apply(scope, config, cb) {
  load();
  container.inspect(function (err, res) {
    if (err) {
      handleInspectError(err, config, cb)
    } else ensure(scope, config, cb);
  });
};

function volumePath(scopePath) {
  console.log(scopePath);
  return scopePath;
};

function ensure(scope, config, cb) {
  // inspect it to make sure it fits config
  load();
  container.inspect(function (err, res) {
    if (err) {
      cb(new Error(err))
    }
    else {
      console.log(res.Volumes);
      if (config.volumes) {
        console.log("Checking volumes");
        _.each(config.volumes, function (containerPath, scopePath) {
          if (res.Volumes[containerPath] !== volumePath(scopePath)) {
            cb(new Error("Volume mounted incorrectly!"));
          }
        });
      }
      throw new Error();
    }
  });
};

function pull(image, cb) {
  docker.pull(image, function (err, stream) {  
    if (err) cb(new Error(err))
    else {
      stream.on('error', function(err) { cb(new Error(err)) });
      stream.on('finish', function() { cb(null) });
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
