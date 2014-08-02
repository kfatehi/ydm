var home = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;
var fs = require('fs')
  , path = require('path')
  , dewHome = path.join(home, '.dew')
  , scopesDir = path.join(dewHome, 'scopes')

module.exports = function(Scope) {
  return function(scopeName, argv) {
    var scopeHome = path.join(scopesDir, scopeName)
    if ( !fs.existsSync(dewHome) )
      fs.mkdirSync(dewHome)
    if ( !fs.existsSync(scopesDir) )
      fs.mkdirSync(scopesDir)
    if ( !fs.existsSync(scopeHome) )
      fs.mkdirSync(scopeHome)
    return new Scope(scopeHome, scopeName);
  }
}
