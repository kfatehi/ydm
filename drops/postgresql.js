module.exports = function(scope, argv, ydm) {
  return {
    install: function (done) {
      scope.applyConfig({
        create: {
          Image: "sameersbn/postgresql:latest"
        },
        start: {
          PublishAllPorts: !!argv.publish,
          Binds: scope.managedVolumes({
            data: '/var/lib/postgresql'
          })
        }
      }, function (err) {
        if (err) throw new Error(err)
        scope.tailUntilMatch(/User:\s(\S+),\sPassword:\s(\S+)\s/, function (err, string, user, pass) {
          if (err) throw new Error(err)
          scope.storage.setItem('pg_user', user)
          scope.storage.setItem('pg_pass', pass);
          scope.tailUntilMatch(/ready to accept connections/, function () {
            scope.inspectContainer(function (err, data) {
              var ip = data.NetworkSettings.IPAddress;
              done(null, {
                ip_address: ip,
                ports: data.NetworkSettings.Ports,
                user: user,
                password: pass
              })
            })
          })
        });
      });
    }
  }
}
