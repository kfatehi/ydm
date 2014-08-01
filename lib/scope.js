var dataFile = null
  , dockerHost = process.env.DOCKER_HOST
  , Docker = require('dockerode')
  , URI = require("uri-js")
  , path = require('path')
  , _ = require('lodash')
  , fs = require('fs')
  , dockerOpts = null
  , container = null
  , docker = null
  , local = null
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
    container = scope.container = docker.getContainer(scope.data.id);
  }
};

function getMyIPAddresses() {
  var ifaces = require('os').networkInterfaces();
  return _.pluck(_.flatten(_.map(ifaces, function (eth) {
    return _.map(eth, function(addr) { return addr })
  })), 'address')
};

function Scope(home, name) {
  scope = this
  scope.data = { home: home, name: name }
  dataFile = path.join(home, 'data.json')
  // Is this docker instance local or remote?
  // It affects our assumptions with volume paths.
  if (dockerHost) {
    dockerOpts = URI.parse(dockerHost)
    // this is not bulletproof -- you might be using dns, etc
    local = _.contains(getMyIPAddresses(), dockerOpts.host)
    docker = new Docker(dockerOpts);
  } else if (fs.existsSync('/var/run/docker.sock')) {
    local = true
    dockerOpts = { socketPath: '/var/run/docker.sock' };
    docker = new Docker(dockerOpts);
  } else {
    throw new Error("Failed to setup docker client");
  }
  console.info("Connected to "+(local ? "local" : "remote")+" docker", dockerOpts);
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
    if (config.volumes) {
      if (local) {
        var binds = [];
        _.each(config.volumes, function (containerPath, volName) {
          binds.push(volumePath(volName)+":"+containerPath);
        });
        config.options = {
          start: {
            Binds: binds
          }
        };
        save();
      } else {
        cb(new Error('Setting up volumes on remote hosts is unsupported at this time'));
        return;
      }
    }
    apply(this, config, cb);
  }
};

function handleInspectError(err, config, cb) {
  if (err.statusCode === 404) {
    var createOpts = {
      name: scope.data.name,
      Image: config.image,
    };
    docker.createContainer(createOpts, function (err, container) {
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
    }.bind(this));
  } else {
    if (err.code === "EACCES" && err.syscall === "connect" && local && dockerOpts.socketPath) {
      console.error("Permission to access socket "+dockerOpts.socketPath+" was denied. You may want to use sudo.");
      cb(null);
    } else {
      cb(new Error(err));
    }
  }
}

function apply(scope, config, cb) {
  load();
  container.inspect(function (err, res) {
    if (err) {
      handleInspectError(err, config, cb)
    } else ensure(scope, config, cb);
  });
};

function volumePath(name) {
  if ( ! local) {
    console.warn("Dew does not support remote host volumes right now")
  }
  var volRoot = path.join(scope.data.home, 'volumes')
    , volPath = path.join(volRoot, name)
  if (fs.existsSync(volPath)) {
    return volPath;
  } else {
    if ( !fs.existsSync(volRoot) )
      fs.mkdirSync(volRoot)
    if ( !fs.existsSync(volPath) )
      fs.mkdirSync(volPath)
    return volPath;
  }
};

function ensure(scope, config, cb) {
  load();
  container.inspect(function (err, res) {
    if (err) cb(new Error(err))
    else {
      var liveConfig = res["HostConfig"];
      if (config.volumes) {
        var binds = {}
        _.each(liveConfig.Binds, function (pair) {
          var parts = pair.split(':')
          binds[parts[1]] = parts[0]
        });
        if (liveConfig === null) {
          err = new Error("Volumes did not mount!")
        } else {
          _.each(config.volumes, function (containerPath, volName) {
            console.log(containerPath+" => "+volumePath(volName))
            if (binds[containerPath] !== volumePath(volName)) {
              err = new Error("Volume mounted incorrectly!");
            }
          });
        }
      }
      cb(err)
    }
  });
};

function pull(image, cb) {
  docker.pull(image, function (err, stream) {  
    if (err) cb(new Error(err))
    else {
      stream.on('finish', function() { cb(err) });
      stream.on('error', function(e2) { err = new Error(e2) });
      stream.on('data', function (chunk) {
        var data = JSON.parse(chunk.toString());
        if (data.error) {
          err = new Error("Pull failed. "+data.error)
        } else {
          // consider using https://www.npmjs.org/package/progress
          console.info(data);
        }
      });
    }
  });
};

module.exports = Scope
