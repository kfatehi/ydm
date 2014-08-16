var Dew = require('./lib/dew')
  , Scope = require('./lib/scope')
  , scopeMaker = require('./lib/scope_maker')

module.exports = {
  Dew: Dew,
  Scope: Scope,
  buildDrop: dropMaker,
  findOrCreateScope: scopeMaker
}
