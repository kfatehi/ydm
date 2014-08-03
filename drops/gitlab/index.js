module.exports = function(scope, argv, dew) {
  var PostgreSQL = dew.drops['postgresql'](argv, dew);
  var env = {
    SMTP_DOMAIN: 'knban.com',
    SMTP_HOST: 'localhost',
    SMTP_PORT: 25,
    GITLAB_HTTPS: true,
    GITLAB_HTTPS_ONLY: false,
    GITLAB_HOST: 'gitlab.knban.com',
    GITLAB_EMAIL: 'gitlab@knban.com',
    DB_TYPE: 'postgres',
    DB_HOST: null,
    DB_USER: 'gitlab',
    DB_PASS: 'password',
    DB_NAME: 'gitlabhq_production'
  }
  return {
    install: function (done) {
      var pg = new PostgreSQL()
      pg.install(function (err, pg_user, pg_pass) {
        if (err) throw new Error(err);
        pg.inspect(function (err, data) {
          env.DB_HOST = data.NetworkSettings.IPAddress;
          console.log(env);
          
        });
        /*
        scope.applyConfig({
          image: 
          image: "sameersbn/gitlab:7.1.1",
          ports: {
            10022: 22,
            10080: 80
          },
          volumes: {
            data: "/home/git/data"
          },
          links: {
            postgresql: 'postgresql'
          },
          env: {
          }
        }, function (err) {
          if (err) throw err;
          scope.tailForever();
        })*/
      });
    }
  }
}
