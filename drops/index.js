var dropMaker = require('../lib/drop_maker')

function drops(d) {
  var _ = require('lodash')
  return _.zipObject(d, _.map(d, function (name) {
    return function (argv, app) {
      return dropMaker.buildDrop(name, argv, app)
    }
  }))
}

module.exports = drops([
  'gitlab',
  'postgresql',
  'strider'
])
