function Drop() {/* Don't use the constructor -- just set prototypes */}

Drop.prototype = {
  reinstall:function (done) {
    console.log(this.scope);
    this.destroy(function () {
      this.install(done)
    })
  },
  destroy: function (done) {
  }
}

module.exports = Drop;
