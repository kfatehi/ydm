function Dew(opts) {
  this.drops = require('../drops')
}

Dew.prototype.install = function (dropName) {
  this.drops[dropName].install()
};

module.exports = Dew;
