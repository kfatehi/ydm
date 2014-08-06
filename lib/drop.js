module.exports = function (scope) {
  // https://github.com/apocas/dockerode/blob/master/lib/container.js
  return {
    scope: scope,
    inspect: function (cb) {
      scope.inspectContainer(cb)
    },
    install: function (done) {
      done(new Error('Nothing to install'))
    },
    destroy: function (done) {
      scope.destroy(done)
    },
    tail: function (done) {
      scope.tailForever()
    }
  }
}
