var path = require('path')
  , fs = require('fs')
  , mkdirp = require('mkdirp')
  , _ = require('lodash')
  , State = require('./state')
  , LocalStorage = require('node-localstorage').LocalStorage;
  

function Scope(options) {
  this.home = options.home;
  this.name = options.name;
  this.setupLocalStorage()
  this.state = State(this);
}

Scope.prototype = {
  setupLocalStorage: function () {
    var storagePath = path.join(this.home, 'storage')
    if (!fs.existsSync(storagePath)) mkdirp.sync(storagePath)
    this.storage = new LocalStorage(storagePath);
  },
  destroy: function (options, cb) {
    this.state.destroy(options, cb)
  },
  setConfig: function (config) {
    // Support passing in the Env as an object or Array
    if (config.create && config.create.Env) {
      var env = config.create.Env
      if ( ! _.isArray(env) && _.isObject(env)) {
        config.create.Env = _.map(env, function (v, k) { return k+"="+v })
      }
    }
    config.create = _.assign({
      name: this.name,
      Env: []
    }, config.create);
    config.start = _.assign({
      Binds: [],
      Links: [],
    }, config.start);
    this.storage.setItem('_config', JSON.stringify(config));
  },
  applyConfig: function (config, cb) {
    /* It is preferred that you use this method instead of
     * modifying state or container directly
     */
    this.setConfig(config)
    this.state.apply(this, this.getConfig(), cb);
  },
  getConfig: function () {
    return JSON.parse(this.storage.getItem('_config'));
  },
  managedLinks: function (links) {
    /* Converts your object of keys and scoped drops
     * to an array of Links expected by Docker
     * Leaves traces behind so we can delete
     */
    var _managedLinks = []
    var scopes = []
    _.each(links, function (drop, linkName) {
      _managedLinks.push(drop.scope.name+":"+linkName);
      scopes.push(drop.scope)
    }.bind(this));
    this.storage.setItem('_managedLinks', JSON.stringify({
      Links: _managedLinks,
      Scopes: scopes
    }));
    return _managedLinks;
  },
  managedVolumes: function (volumes) {
    /* Returns an array of Binds with volumes
     * pointing to paths within the scope.
     * Leaves traces behind so we can delete
     */
    var _managedVolumes =  _.map(volumes, function (containerPath, volName) {
      return this.getVolumePath(volName)+":"+containerPath;
    }.bind(this));
    this.storage.setItem('_managedVolumes', JSON.stringify({
      Binds: _managedVolumes
    }));
    return _managedVolumes;
  },
  getVolumePath: function (_name) {
    var volRoot = path.join(this.home, 'volumes')
      , volPath = path.join(volRoot, _name)
    if (fs.existsSync(volPath)) {
      return volPath;
    } else {
      if ( !fs.existsSync(volRoot) )
        mkdirp.sync(volRoot)
      if ( !fs.existsSync(volPath) )
        mkdirp.sync(volPath)
      return volPath;
    }
  },
  inspectContainer: function (cb) {
    this.state.getContainer().inspect(cb)
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
      follow: true, stdout: true, stderr: true, tail: 10
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
    })
  }
}

module.exports = Scope;
