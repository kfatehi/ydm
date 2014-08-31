var path = require('path')
var dropsIndex = require('../drops')
var mkdirp = require('mkdirp')
var Performer = require('./performer')

function App(opts) {
  var options = opts || {};
  this.dropsPath = options.dropsPath || path.resolve(__dirname+'/../drops');
  mkdirp.sync(this.dropsPath)
  this.indexDrops = function() {
    this.drops = dropsIndex(this.dropsPath)
  }
  this.indexDrops()
  this.performer = function(dropName, argv) {
    return new Performer(dropName, argv, this)
  }
}

module.exports = App;
