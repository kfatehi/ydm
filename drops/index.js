function drops(d) {
  var _ = require('lodash')
  return _.zipObject(d, _.map(d, function (n) {
    return function () {
      return require('../index').buildDrop(n)
    }
  }))
}

module.exports = drops([
  'gitlab',
  'postgresql',
  'strider'
])
