var dockerHost = process.env.DOCKER_HOST
  , Docker = require('dockerode')
  , URI = require("uri-js")
  , path = require('path')
  , _ = require('lodash')
  , fs = require('fs')
  , docker = null

function Scope(home) {
  if (dockerHost) {
    docker = new Docker(URI.parse(dockerHost));
  } else if (fs.existsSync('/var/run/docker.sock')) {
    docker = new Docker({socketPath: '/var/run/docker.sock'})
  } else {
    throw new Error("Failed to setup docker client");
  }
  this.home = home;
  this.dataFile = path.join(home, 'data.json');
  if ( fs.existsSync(this.dataFile) ) {
    this.load();
  } else {
    this.data = {};
    this.save();
  }
  this.tools = {
    getContainer: function () {
      docker.getContainer(scope.Id)
    },
    createContainer: function (config, cb) {
      console.log(config);
      docker.createContainer({
        Image: 'ubuntu',
        Cmd: ['/bin/bash'],
        name: 'ubuntu-test'
      }, function (err, container) {
        container.start(function (err, data) {
          //...
        });
      });
      cb();
    },
    startContainer: function (cb) {
      console.log('start');
      cb();
    },
    containerExists: function () {
      docker.listContainers(function (err, containers) {
        containers.forEach(function (containerInfo) {
          docker.getContainer(containerInfo.Id).stop(cb);
        });
      });
    },
    containerRunning: function () {
      docker.listContainers(function (err, containers) {
        containers.forEach(function (containerInfo) {
          docker.getContainer(containerInfo.Id).stop(cb);
        });
      });
    }
  }
};

Scope.prototype = {
  save: function () {
    fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 4));
  },
  load: function () {
    console.log(this.dataFile);
    this.data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
  }
};

module.exports = Scope
