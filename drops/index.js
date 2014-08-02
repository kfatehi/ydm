function drops(d) {
  var _ = require('lodash')
  return _.zipObject(d, _.map(d, function (name) {
    return function (argv, dew) {
      return require('../index').buildDrop(name, argv, dew)
    }
  }))
}

module.exports = drops([
  'gitlab',
  'postgresql',
  'strider'
])
