var _ = require('lodash')
  , defaultDrop = require('./drop');

module.exports = function (scopeMaker) {
  return function (name, argv, dew) {
    var CustomDrop = function () {}
    var scope = scopeMaker(name, argv)
    var generic = defaultDrop(scope)
    var customized = require('../drops/'+name)(scope, argv, dew);
    CustomDrop.prototype = _.extend({}, generic, customized);
    return CustomDrop;
  }
}
