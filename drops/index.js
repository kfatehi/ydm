function drops(d) {
  var _ = require('lodash')
  return _.zipObject(d, _.map(d, function (name) {
    return function (argv) {
      return require('../index').buildDrop(name, argv)
    }
  }))
}

module.exports = drops([
  'gitlab',
  'postgresql',
  'strider'
])
