var _ = require('lodash')

module.exports = {
  run: function (argv, ydm, help, listDrops) {
    var action = argv._[0];
    var dropName = argv._[1];

    if (action) {
      if (dropName) {
        var performer = ydm.performer(dropName, argv)
        var check = performer.canPerform(action)
        if (check.ok) {
          performer.perform(action, function(err, res) {
            if (err) throw err;
            if (res) {
              if (_.isObject(res)) {
                console.log(JSON.stringify(res, null, 4));
              } else console.log(res)
            }
          })
        } else {
          console.log(check.reason);
        }
      } else {
        console.log("What would you like to "+action+"?");
      }
    } else if (dropName) {
      var attrs = Object.keys(drop.__proto__);
      console.log("Available commands: ");
      _.each(attrs, function (e) {
        if (_.isFunction(drop[e])) {
          console.log(" - "+e);
        }
      })
    } else {
      help()
    }
  }
}
