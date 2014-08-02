module.exports = function Gitlab(scope, Dew) {
  var drop = this;

  drop.install = function (done) {
    var pgScope = Dew.findOrCreateScope('postgresql')
    var pgDrop = new Dew.drops['postgresql'](pgScope)

    pgDrop.install(function () {
      console.log(arguments);
      scope.applyConfig({
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
          SMTP_DOMAIN: 'knban.com',
          SMTP_HOST: 'localhost',
          SMTP_PORT: 25,
          GITLAB_HTTPS: true,
          GITLAB_HTTPS_ONLY: false,
          GITLAB_HOST: 'gitlab.knban.com',
          GITLAB_EMAIL: 'gitlab@knban.com',
          DB_TYPE: 'postgres',
          DB_HOST: pgScope.data.host,
          DB_USER: 'gitlab',
          DB_PASS: 'password',
          DB_NAME: 'gitlabhq_production'
        }
      }, function (err) {
        if (err) throw err;
        scope.tailForever();
      });
    });
  };

  drop.destroy = function (done) {
    scope.destroy(done);
  }

  drop.reinstall = function (done) {
    drop.destroy(function () {
      drop.install(done)
    })
  }
}
