var _ = require('lodash')
  , defaultDrop = require('./drop');

module.exports = function (scopeMaker) {
  return function (name, argv, dew, cb) {
    var CustomDrop = function () {}
    var scope = scopeMaker.makeScope(name, argv)
    var generic = defaultDrop(scope)
    var customized = require('../drops/'+name)(scope, argv, dew);
    if (customized.requiresNamespace && ! argv.namespace) {
      console.error(scope.name+" requires flag --namespace")
      process.exit(1)
    }
    CustomDrop.prototype = _.extend({}, generic, customized);
    return CustomDrop;
  }
}
