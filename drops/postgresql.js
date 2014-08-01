module.exports = function Postgresql(scope) {
  this.install = function (done) {
    scope.applyConfig({
      image: "sameersbn/postgresql:latest",
      volumes: {
        data: '/var/lib/postgresql'
      }
    }, done);
  }

  this.destroy = function (done) {
    scope.container.remove({
      force: true, // Stop and remove
      v: false // Don't remove volumes
    }, function (err, res) {
      console.log(err, res);
    })
  }
}
