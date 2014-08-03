module.exports = function (scope) {
  var getContainer = scope.state.getContainer;
  // https://github.com/apocas/dockerode/blob/master/lib/container.js
  return {
    scope: scope,
    getContainer: getContainer,
    inspect: function (cb) {
      this.getContainer().inspect(cb)
    },
    install: function (done) {
      done(new Error('Nothing to install'))
    },
    reinstall:function (done) {
      scope.destroy(function() {
        this.install(done)
      }.bind(this))
    },
    restart: function (done) {
      getContainer().stop(function (err, res) {
        console.log("Stopped "+scope.name);
        this.install(done)
      }.bind(this))
    },
    destroy: function (done) {
      scope.destroy(done)
    }
  }
}
