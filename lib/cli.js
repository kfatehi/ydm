var _ = require('lodash')

module.exports = {
  run: function (argv, ydm) {
    var dropName = argv._[0];
    var action = argv._[1];
    if (action) {
      var performer = ydm.performer(dropName, argv)
      if (performer.canPerform(action)) {
        performer.perform(action, function(err, res) {
          if (err) throw err;
          if (res) {
            if (_.isObject(res)) {
              console.log(JSON.stringify(res, null, 4));
            } else console.log(res)
          }
        })
      } else {
        console.log("Cannot '"+action+"' this drop");
      }
    } else {
      var attrs = Object.keys(drop.__proto__);
      console.log("Available commands: ");
      _.each(attrs, function (e) {
        if (_.isFunction(drop[e])) {
          console.log(" - "+e);
        }
      })
    }
  }
}
