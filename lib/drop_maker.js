var _ = require('lodash')
  , defaultDrop = require('./drop')
  , scopeMaker = require('./scope_maker')

function checkRequirements(argv, requirements) {
  var satisfied = true;
  _.each(requirements, function (detail, arg) {
    var argKey = arg.replace(/^-+/,'');
    if (! argv[argKey]) {
      satisfied = false
      console.error("Requirement not satisfied:", arg)
      console.error("Requirement reason:", detail)
    }
  })
  return satisfied;
}

module.exports = {
  buildDrop: function (name, argv, dew, cb) {
    var CustomDrop = function () {}
    var scope = scopeMaker.makeScope(name, argv)
    var generic = defaultDrop(scope, argv, dew)
    var customized = require('../drops/'+name)(scope, argv, dew);
    CustomDrop.prototype = _.extend({}, generic, customized);
    var canCreateDrop = true;
    if (customized.requireAlways) {
      if (! checkRequirements(argv, customized.requireAlways))
        canCreateDrop = false;
    }
    if (customized.requireDuring) {
      var action = argv._[1]
      var requirements = customized.requireDuring[action]
      if (requirements)
        if (! checkRequirements(argv, requirements))
          canCreateDrop = false;
    }
    if (! canCreateDrop) {
      console.error("cannot continue")
      process.exit(1)
    }
    return CustomDrop;
  }
}
