var _ = require('lodash')
  , defaultDrop = require('./drop');

module.exports = function (autoScope) {
  return function (name) {
    var CustomDrop = function (runOpts) { console.info(runOpts) }
    var scope = autoScope(name)
    var generic =  defaultDrop(scope)
    var customized = require('../drops/'+name)(scope);
    CustomDrop.prototype = _.extend({}, generic, customized);
    return CustomDrop;
  }
}
