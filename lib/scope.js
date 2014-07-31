var dockerHost = process.env.DOCKER_HOST
  , Docker = require('dockerode')
  , URI = require("uri-js")
  , path = require('path')
  , _ = require('lodash')
  , fs = require('fs')
  , docker = null

function Scope(home, name) {
  if (dockerHost) {
    docker = new Docker(URI.parse(dockerHost));
  } else if (fs.existsSync('/var/run/docker.sock')) {
    docker = new Docker({socketPath: '/var/run/docker.sock'})
  } else {
    throw new Error("Failed to setup docker client");
  }
  this.home = home;
  this.name = name;
  this.dataFile = path.join(home, 'data.json');
  this.data = {};
  if ( fs.existsSync(this.dataFile) ) {
    this.load();
  } else {
    this.save();
  }
  console.log(this.data);
  this.container = docker.getContainer(this.data.id);
};

Scope.prototype = {
  save: function () {
    fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 4));
  },
  load: function () {
    this.data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
  },
  applyConfig: function (config, cb) {
    this.data.config = config;
    this.save();
    apply(this, config, cb);
  }
};

function apply(scope, config, cb) {
  scope.container.inspect(function (err, res) {
    if (err) {
      if (err.statusCode === 404) {
        docker.createContainer({
          Image: config.image,
          name: scope.name,
        }, function (err, container) {
          if (err) {
            if (err.statusCode === 404) {
              pull(config.image, function (err, res) {
                if (err) {
                  cb(err)
                } else apply(config, cb);
              });
            } else cb(err)
          } else container.start(function (err, data) {
            cb(err, data);
          });
        });
      } else cb(err);
    } else cb(new Error('it exists -- make sure config matches, else redo things'));
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
