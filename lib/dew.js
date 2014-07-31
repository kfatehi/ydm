var glob = require('glob')
  , path = require('path')
  , _ = require('lodash')

function Dew(opts) {
  this.src = opts.src;
  // Make sure we're seeing the source
  if (require(this.src+'/package').name !== "dew-node") {
    throw new Error("Invalid source directory.")
  }
  this.dropsPath = path.join(this.src, 'drops');
  this.data = '';
  this.scopes = '';
}

Dew.prototype.drops = function (cb) {
  glob(this.dropsPath+'/*', {}, function (err, results) {
    var drops = {};
    _.each(results, function (drop_path) {
      var name = _.last(drop_path.split('/'));
      drops[name] = {
        foo: "bar"
      };
    });
    cb(err, drops);
  });
};

module.exports = Dew;
