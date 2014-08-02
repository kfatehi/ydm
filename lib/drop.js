module.exports = function (scope) {
  return {
    install: function (done) {
      done(new Error('Nothing to install'))
    },
    reinstall:function (done) {
      scope.destroy(function() {
        console.log("Destroyed, reinstalling...");
        this.install(done)
      }.bind(this))
    },
    destroy: function (done) {
      console.log("Destroying");
      scope.destroy(done)
    }
  }
}
