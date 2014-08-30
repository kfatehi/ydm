var path = require('path')
var dropsIndex = require('../drops')

function App(opts) {
  var options = opts || {};
  this.dropsPath = options.dropsPath || path.resolve(__dirname+'/../drops');
  this.indexDrops = function() {
    this.drops = dropsIndex(this.dropsPath)
  }
  this.indexDrops()
}

module.exports = App;
