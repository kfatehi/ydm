module.exports = function Postgresql(scope) {
  this.install = function (done) {
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
        stream.on('finish', function() { done(err) });
        stream.on('error', function(e2) { err = new Error(e2) });
        stream.on('data', function (chunk) {
          var string = chunk.toString('utf-8');
          console.log(inspect(string));
          //if (/PostgreSQL User/.test(string)) {
          //  console.info(string);
          //}
          //stream.end();
        });
      })
    });
  }

  this.destroy = function (done) {
    scope.container.remove({
      force: true, // Stop and remove
      v: false // Don't remove volumes
    }, done)
  }

  this.reinstall = function (done) {
    this.destroy(function () {
      this.install(done)
    }.bind(this))
  }
}
