var path = require('path')

function App(opts) {
  var options = opts || {};
  var dropsPath = options.dropsPath || path.resolve(__dirname+'/../drops');
  this.drops = require('../drops')(dropsPath)
}

module.exports = App;
