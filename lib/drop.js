module.exports = function(scope, argv, ydm) {
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
        var keyPath = argv._[2];
        if (keyPath) {
          var result = JSON.stringify(deep_value(data, keyPath), null, 2)
          done(err, result || "Could not find key path");
        } else {
          done(err, JSON.stringify(data, null, 2))
        }
      })
    },
    install: function (done) {
      done(new Error('Nothing to install'))
    },
    reinstall: function (done) {
      this.destroy(function () {
        argv._[1] = "install"
        require('./cli').run(argv, ydm)
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
