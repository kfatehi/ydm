module.exports = function Postgresql(scope) {
  this.install = function (done) {
    scope.applyConfig({
      image: "sameersbn/postgresql:latest",
      volumes: {
        data: '/var/lib/postgresql'
      }
    }, done);
  }
}
