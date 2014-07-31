var image = "sameersbn/postgresql:latest";
module.exports = function Postgresql(scope) {
  var tools = scope.tools;

  this.install = function (done) {
    tools.getContainer(function (err, container) {
      if (container.Running) {
        
      }
      console.log(arguments);
      if (tools.containerRunning('postgresql')) {
        done(); // nothing to do
      } else {
        tools.startContainer('postgresql', done);
      }

      tools.createContainer({
        image: image,
        volumes: {
          data: '/var/lib/postgresql'
        }
      }, function () {
        // inspect etc
        done();
      });
    })
  }
}
