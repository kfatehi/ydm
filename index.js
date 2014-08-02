var Dew = require('./lib/dew')
  , Drop = require('./lib/drop')
  , Scope = require('./lib/scope')
  , scopeMaker = require('./lib/scope_maker')(Scope)
  , dropMaker = require('./lib/drop_maker')(Drop, scopeMaker)

module.exports = {
  Dew: Dew,
  Drop: Drop,
  Scope: Scope,
  buildDrop: dropMaker,
  findOrCreateScope: scopeMaker
}
