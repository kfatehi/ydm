"use strict";
var path = require('path')
  , fs = require('fs')
  , _ = require('lodash')
  , dockerConnect = require('./docker_connect')
  , State = require('./state')
  

function Scope(options) {
  this.home = options.home;
  this.name = options.name;
  console.log("initializing scope "+this.name);
  if (typeof this.localStorage === "undefined" || this.localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    this.localStorage = new LocalStorage(path.join(options.home, 'storage'));
  }
  this.state = new State(this);
}

Scope.prototype = {
  applyConfig: function (config, cb) {
    config.options = { start: { Binds: [] } };
    if (config.volumes) {
      _.each(config.volumes, function (containerPath, volName) {
        var bind = this.getVolumePath(volName)+":"+containerPath;
        config.options.start.Binds.push(bind);
      }.bind(this));
    }
    this.localStorage.setItem('config', JSON.stringify(config));
    this.state.apply(this, config, cb);
  },
  getVolumePath: function (_name) {
    var volRoot = path.join(this.home, 'volumes')
      , volPath = path.join(volRoot, _name)
    if (fs.existsSync(volPath)) {
      return volPath;
    } else {
      if ( !fs.existsSync(volRoot) )
        fs.mkdirSync(volRoot)
      if ( !fs.existsSync(volPath) )
        fs.mkdirSync(volPath)
      return volPath;
    }
  },
  destroy: function (cb) {
    var removeVolumes = true; // on by default
    console.log("Removing container")
    this.state.container.remove({
      force: true, // Stop container and remove
      v: removeVolumes // Remove volumes
    }, function (err) {
      if (err) {
        cb(new Error(err));
      } else if (numVolumes > 0) {
        var done = _.after(numVolumes, function () {
          cb(null);
        });
        eachVolume(function (c, name) {
          rimraf(volumePath(name), done)
        })
      } else cb(null)
    })
  }
}

module.exports = Scope;
