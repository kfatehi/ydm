module.exports = function Postgresql(scope, tools) {
  var image = "sameersbn/postgresql:latest";
  console.log(scope);

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
      });
    }
  }
}
