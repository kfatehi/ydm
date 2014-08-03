var path = require('path')
  , fs = require('fs')
  , _ = require('lodash')
  , State = require('./state')
  

function Scope(options) {
  this.home = options.home;
  this.name = options.name;
  console.log("Initializing scope "+this.name);
  if (typeof this.localStorage === "undefined" || this.localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    this.localStorage = new LocalStorage(path.join(options.home, 'storage'));
  }
  var config = this.localStorage.getItem('_config');
  if ( ! config) {
    this.localStorage.setItem('_config', JSON.stringify({
      volumes: {}
    }));
    this.localStorage.setItem('_numVolumes', 0);
  }
  this.state = State(this);
}

Scope.prototype = {
  destroy: function (cb) {
    this.state.destroy(cb)
  },
  applyConfig: function (config, cb) {
    config.startOpts = _.assign({ Binds: [] }, config.start);
    config.createOpts = _.assign({ name: this.name }, config.create);
    if (config.volumes) {
      _.each(config.volumes, function (containerPath, volName) {
        var bind = this.getVolumePath(volName)+":"+containerPath;
        config.startOpts.Binds.push(bind);
      }.bind(this));
      this.localStorage.setItem('_numVolumes', _.keys(config.volumes).length);
    }
    this.localStorage.setItem('_config', JSON.stringify(config));
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
  tailUntilMatch: function (pattern, cb) {
    var match = null;
    this.state.getContainer().logs({
      follow: true, stdout: true, stderr: true
    }, function (err, stream) {
      if (err) throw err;
      stream.on('error', function(e2) { err = new Error(e2) });
      stream.on('data', function (chunk) {
        match = chunk.toString('utf-8').match(pattern)
        if (match) {
          stream.destroy(null)
          match.unshift(err);
          cb.apply(this, match)
        }
      });
    })
  },
  tailForever: function (cb) {
    this.state.getContainer().logs({
      follow: true, stdout: true, stderr: true
    }, function (err, stream) {
      if (err) throw err;
      var patt = /([0-9a-zA-Z'"#,\-\/_ .@]+)/;
      stream.on('error', function(e2) { err = new Error(e2) });
      stream.on('data', function (chunk) {
        var str = chunk.toString('utf-8');
        var match = str.match(patt);
        if (match) {
          console.log(match[0])
        }
      });
      cb(err, stream);
    })
  }
}

module.exports = Scope;
