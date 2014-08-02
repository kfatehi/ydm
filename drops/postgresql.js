module.exports = function(scope) {
  return {
    install: function (done) {
      scope.applyConfig({
        image: "sameersbn/postgresql:latest",
        volumes: {
          data: '/var/lib/postgresql'
        }
      }, function (err) {
        if (err) throw new Error(err)
        scope.tailUntilMatch(/User:\s(\S+),\sPassword:\s(\S+)\s/, function (err, string, user, pass) {
          if (err) throw new Error(err)
          scope.localStorage.setItem('pg_user', user)
          scope.localStorage.setItem('pg_pass', pass);
          console.log(scope.name+".pg_user: "+user);
          console.log(scope.name+".pg_pass: "+pass);
          done(null)
        });
      });
    }
  }
}
