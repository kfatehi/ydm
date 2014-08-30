var _ = require('lodash')

module.exports = function(scope, argv, dew) {
  // https://github.com/apocas/dockerode/blob/master/lib/container.js

  var deep_value = function(obj, path){
    for (var i=0, path=path.split('.'), len=path.length; i<len; i++){
      obj = obj[path[i]];
    };
    return obj;
  };

  return {
    scope: scope,
    inspect: function (done) {
      scope.inspectContainer(function (err, data) {
        var keyPath = null;
        if (argv.keyPath || argv._)
          keyPath = argv.keyPath || argv._[2];
        if (keyPath) {
          var result = JSON.stringify(deep_value(data, keyPath), null, 2)
          done(err, result || "Could not find key path");
        } else {
          if (_.isObject(data)) {
            done(err, JSON.stringify(data, null, 2))
          } else {
            console.log('!!DONE', done)
            done(err, data);
          }
        }
      })
    },
    install: function (done) {
      done(new Error('Nothing to install'))
    },
    reinstall: function (done) {
      this.destroy(function () {
        argv._[1] = "install"
        require('./cli').run(argv, dew)
      })
    },
    destroy: function (done) {
      scope.destroy(done)
    },
    tail: function (done) {
      scope.tailForever()
    }
  }
}
