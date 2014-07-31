function Dew(opts) {
  this.drops = require('../drops')
}

Dew.prototype.findOrCreateScope = function (name) {
  var home = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;
  var fs = require('fs')
    , path = require('path')
    , dewHome = path.join(home, '.dew')
    , scopeHome = path.join(dewHome, name)
    , Scope = require('./scope')
  if ( !fs.existsSync(dewHome) )
    fs.mkdirSync(dewHome)
  if ( !fs.existsSync(scopeHome) )
    fs.mkdirSync(scopeHome)
  return new Scope(scopeHome, name);
};

module.exports = Dew;
