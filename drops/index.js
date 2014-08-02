var _ = require('lodash');

var names = [
  'gitlab',
  'postgresql',
  'strider'
];

module.exports = _.zipObject(names, _.map(names, function (n) {
  return require('../index').buildDrop(n);
}))
