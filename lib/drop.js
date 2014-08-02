module.exports = function (scope) {
  return {
    install: function (done) {
      done(new Error('Nothing to install'))
    },
    reinstall:function (done) {
      this.destroy(function () {
        this.install(done)
      }.bind(this))
    },
    destroy: function (done) {
      scope.destroy(done)
    }
  }
}
