module.exports = function (Drop, autoScope) {
  return function (name) {
    var CustomDrop = function (options) {
      this.options = options;
      this.scope = autoScope(options.name || name)
    }
    CustomDrop.prototype = require('../drops/'+name);
    require('util').inherits(CustomDrop, Drop);
    return CustomDrop;
  }
}
