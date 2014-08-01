module.exports = function Postgresql(scope) {
  drop = this;
  drop.install = function (done) {
    scope.applyConfig({
      image: "sameersbn/postgresql:latest",
      volumes: {
        data: '/var/lib/postgresql'
      }
    }, function (err) {
      var inspect = require('util').inspect;
      if (err) throw err;
      scope.container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        tail: 10
      }, function (err, stream) {
        if (err) throw err;
        stream.on('end', function() { done(err) });
        stream.on('error', function(e2) { err = new Error(e2) });
        stream.on('data', function (chunk) {
          var string = chunk.toString('utf-8');
          var match = string.match(/User:\s(.*),\sPassword:\s(.*)\s+/)
          if (match) {
            stream.destroy(null)
            scope.data.info = {
              user: match[1],
              password: match[2]
            }
            scope.save()
            done(null, scope.data.info)
          }
        });
      })
    });
  }

  drop.destroy = function (done) {
    scope.destroy(done);
  }

  drop.reinstall = function (done) {
    drop.destroy(function () {
      drop.install(done)
    })
  }
}
