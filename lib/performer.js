var _ = require('lodash')


module.exports = function(dropName, argv, ydm) {
  var Drop = ydm.drops[dropName](argv, ydm)
    , drop = new Drop()

  if (!drop) throw new Error('Drop could not initialize');

  this.canPerform = function(action) {
    return action && drop[action]
  }

  this.perform = function(action, cb) {
    drop[action](cb)
  }
}
