var home = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;
var fs = require('fs')
  , path = require('path')

module.exports = function(Scope) {
  return {
    mkdir: function(name) {
      if ( !fs.existsSync(name) ) fs.mkdirSync(name);
      return name
    },
    makeScope: function(scopeName, argv) {
      var dewHome = argv.dewhome || this.mkdir(path.join(home, '.dew'))
        , scopesDir = this.mkdir(path.join(dewHome, 'scopes'))
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
}
