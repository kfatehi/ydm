var _ = require('lodash')
  , defaultDrop = require('./drop')
  , scopeMaker = require('./scope_maker')

module.exports = {
  buildDrop: function (name, argv, app, cb) {
    var CustomDrop = function () {}
    var scope = scopeMaker.makeScope(name, argv)
    var generic = defaultDrop(scope, argv, app)
    var customized = require('../drops/'+name)(scope, argv, app);
    var canCreateDrop = true;
    if (! canCreateDrop) {
      console.error("cannot continue")
      process.exit(1)
    } else {
      CustomDrop.prototype = _.extend({}, generic, customized);
      return CustomDrop;
    }
  }
}
