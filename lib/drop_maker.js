var _ = require('lodash')
  , defaultDrop = require('./drop')
  , scopeMaker = require('./scope_maker')

module.exports = {
  buildDrop: function (name, argv, dew, cb) {
    var CustomDrop = function () {}
    var scope = scopeMaker.makeScope(name, argv)
    var generic = defaultDrop(scope, argv, dew)
    var customized = require('../drops/'+name)(scope, argv, dew);
    var canCreateDrop = true;
    if (customized.recommend) {
      // loop through and make sure to inform these are settable
      _.each(customized.recommend, function (detail, arg) {
        var argKey = arg.replace(/^-+/,'');
        if (! argv[argKey]) {
          console.error("Recommendation not utilized:", arg)
          console.error("Recommendation reason:", detail)
        }
      })
    }
    if (customized.require) {
      // loop through and make sure these are set on argv
      _.each(customized.require, function (detail, arg) {
        var argKey = arg.replace(/^-+/,'');
        if (! argv[argKey]) {
          canCreateDrop = false
          console.error("Requirement not satisfied:", arg)
          console.error("Requirement reason:", detail)
        }
      })
    }
    if (! canCreateDrop) {
      console.error("cannot continue")
      process.exit(1)
    } else {
      CustomDrop.prototype = _.extend({}, generic, customized);
      return CustomDrop;
    }
  }
}
