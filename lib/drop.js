module.exports = function (scope) {
  return {
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
