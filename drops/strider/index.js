module.exports = function(scope, argv) {
  return {
    install: function (done) {
      scope.applyConfig({
        create: {
          Image: "niallo/strider:latest",
          Env: {
            /* https://github.com/Strider-CD/strider#configuring */
          }
        },
        start: {
          PublishAllPorts: !!argv.publish,
          Binds: scope.managedVolumes({
            home: '/home/strider'
          }),
        }
      }, function (err) {
        if (err) throw err;
        scope.inspectContainer(function (err, data) {
          var ip = data.NetworkSettings.IPAddress;
          done(err, {
            ip_address: ip,
            ports: data.NetworkSettings.Ports,
            app: {
              url: "http://"+ip+":3000",
              email: "test@example.com",
              password: "dontlook"
            },
            ssh: {
              port: 22,
              username: "strider",
              password: "str!der",
              notes: "Root access is prohibited by default through ssh. To get root access login as strider and su to root."
            }
          });
        });
      });
    }
  }
}
