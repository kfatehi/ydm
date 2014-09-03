var home = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;
var fs = require('fs')
  , mkdirp = require('mkdirp')
  , path = require('path')
  , Scope = require('./scope')

module.exports = {
  mkdir: function(name) {
    if ( !fs.existsSync(name) ) mkdirp.sync(name);
    return name
  },
  makeScope: function(scopeName, argv, ydm) {
    var scopesDir = this.mkdir(ydm.scopesPath || process.env.YDM_HOME+'/scopes')
      , scopeHome = null
      , namespace = null
    if (argv.namespace) {
      namespace = new Scope({
        name: argv.namespace,
        home: this.mkdir(path.join(scopesDir, argv.namespace))
      })
      scopeHome = path.join(namespace.home, scopeName)
      scopeName = argv.namespace+'.'+scopeName
    } else {
      scopeHome = path.join(scopesDir, scopeName)
      scopeName = scopeName
    }
    var scope = new Scope({
      home: this.mkdir(scopeHome),
      name: scopeName
    });
    scope.namespace = namespace
    return scope;
  }
}
