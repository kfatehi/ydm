var image = "sameersbn/postgresql:latest";
module.exports = function Postgresql(scope) {
  var tools = scope.tools;

  this.install = function (done) {
    if (tools.containerExists('postgresql')) {
      if (tools.containerRunning('postgresql')) {
        done(); // nothing to do
      } else {
        tools.startContainer('postgresql', done);
      }
    } else {
      tools.createContainer({
        image: image,
        volumes: {
          data: '/var/lib/postgresql'
        }
      }, function () {
        // inspect etc
        done();
      });
    }
  }
}
