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
    var self = this;
    this.container.inspect(function (err, res) {
      if (err) {
        if (err.statusCode === 404) {
          console.log('create it, per config');
        }
        docker.createContainer({
          Image: config.image,
          name: self.name,
        }, function (err, container) {
          console.log(err, container);
          container.start(function (err, data) {
            //...
          });
        });
      } else {
        console.log('it exists -- make sure config matches, else redo things');
      }
      cb();
    });
  }
};

module.exports = Scope
