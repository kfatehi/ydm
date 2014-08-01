module.exports = function Gitlab(scope) {
  var drop = this;
  drop.install = function (done) {
    scope.applyConfig({
      image: "sameersbn/gitlab:7.1.1"
    }, function (err) {
      if (err) throw err;
      scope.tailForever();
    });
  };
}
