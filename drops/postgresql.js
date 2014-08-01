module.exports = function Postgresql(scope) {
  this.install = function (done) {
    scope.applyConfig({
      image: "sameersbn/postgresql:latest",
      volumes: {
        data: '/var/lib/postgresql'
      }
    }, function (err, res) {
      // show logs
      done(err, res)
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
