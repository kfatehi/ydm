module.exports = function(scope) {
  return {
    install: function (done) {
      scope.applyConfig({
        image: "sameersbn/postgresql:latest",
        volumes: {
          data: '/var/lib/postgresql'
        }
      }, function (err) {
        if (err) throw new Error(err);
        scope.tailUntilMatch(/User:\s(\S+),\sPassword:\s(\S+)\s/, function (err, match) {
          if (err) throw new Error(err);
          scope.data.info = { user: match[1], password: match[2] }
          scope.save()
          done(null, scope.data.info)
        });
      });
    }
  }
}
