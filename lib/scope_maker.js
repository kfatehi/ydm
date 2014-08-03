var home = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;
var fs = require('fs')
  , path = require('path')

module.exports = function(Scope) {
  var dewHome = dir(path.join(home, '.dew'))
    , scopesDir = dir(path.join(dewHome, 'scopes'))
    , scopeHome = null
    , scopeName = null

  return {
    makeScope: function(scopeName, argv) {
      if (argv.namespace) {
        var nameSpace = dir(path.join(scopesDir, argv.namespace));
        scopeHome = path.join(nameSpace, scopeName)
        scopeName = argv.namespace+'.'+scopeName
      } else {
        scopeHome = path.join(scopesDir, scopeName)
        scopeName = scopeName
      }
      return new Scope({
        home: dir(scopeHome),
        name: scopeName
      });
    }
  }
}

function dir(name) {
  if ( !fs.existsSync(name) ) fs.mkdirSync(name);
  return name
}

