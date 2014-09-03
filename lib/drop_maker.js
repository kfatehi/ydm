var _ = require('lodash')
  , path = require('path')
  , defaultDrop = require('./drop')
  , scopeMaker = require('./scope_maker')

function checkRequirements(argv, requirements) {
  var satisfied = true;
  _.each(requirements, function (detail, arg) {
    var argKey = arg.replace(/^-+/,'');
    if (! argv[argKey]) {
      satisfied = false
      console.error("Argument missing:", arg)
      console.error("Argument purpose:", detail, '\n')
    }
  })
  return satisfied;
}

module.exports = {
  buildDrop: function (name, argv, ydm, cb) {
    var CustomDrop = function () {}
    var scope = scopeMaker.makeScope(name, argv, ydm)
    var generic = defaultDrop(scope, argv, ydm)
    ydm = ydm || {}
    var src = path.join(ydm.dropsPath || '../drops', name);
    var customized = require(src)(scope, argv, ydm);
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
