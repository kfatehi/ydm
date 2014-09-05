var path = require('path')
var dropsIndex = require('../drops')
var mkdirp = require('mkdirp')
var Performer = require('./performer')

function App(opts) {
  var options = opts || {};
  var ydmHome = process.env.YDM_HOME || (process.env.HOME ? path.join(process.env.HOME, '.ydm') : null)
  this.dockerConnect = require('./docker_connect')
  this.scopesPath = options.scopesPath || path.join(ydmHome, 'scopes')
  this.dropsPath = options.dropsPath
  if (this.dropsPath) mkdirp.sync(this.dropsPath)
  this.indexDrops = function() {
    if (this.dropsPath) {
      this.drops = dropsIndex(this.dropsPath)
    } else {
      this.drops = dropsIndex(path.resolve(__dirname+'/../drops'))
    }
  }
  this.indexDrops()
  this.performer = function(dropName, argv) {
    return new Performer(dropName, argv, this)
  }
}

module.exports = App;
