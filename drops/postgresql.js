module.exports = function(scope) {
  return {
    install: function (done) {
      scope.applyConfig({
        image: "sameersbn/postgresql:latest",
        volumes: {
          data: '/var/lib/postgresql'
        }
      }, function (err) {
        if (err) done(new Error(err))
        scope.tailUntilMatch(/User:\s(\S+),\sPassword:\s(\S+)\s/, function (err, match) {
          if (err) done(new Error(err))
          scope.localStorage.setItem('pg_user', match[1])
          scope.localStorage.setItem('pg_password', match[2])
          done(null)
        });
      });
    }
  }
}
