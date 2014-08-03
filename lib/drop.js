module.exports = function (scope) {
  return {
    scope: scope,
    inspect: function (cb) {
      scope.state.getContainer().inspect(cb)
    },
    install: function (done) {
      done(new Error('Nothing to install'))
    },
    reinstall:function (done) {
      scope.destroy(function() {
        this.install(done)
      }.bind(this))
    },
    destroy: function (done) {
      scope.destroy(done)
    }
  }
}
