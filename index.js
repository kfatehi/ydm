var Dew = require('./lib/dew')
  , Scope = require('./lib/scope')
  , scopeMaker = require('./lib/scope_maker')(Scope)
  , dropMaker = require('./lib/drop_maker')(scopeMaker)

module.exports = {
  Dew: Dew,
  Scope: Scope,
  buildDrop: dropMaker,
  findOrCreateScope: scopeMaker
}
