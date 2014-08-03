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
      pg.install(function (err, pgUser, pgPass) {
        if (err) throw new Error(err);
        pg.inspect(function (err, data) {
          var exec = require('child_process').exec
            , newPass = Math.random().toString(26).substring(2)
            , sql = [], script = null, _ = require('lodash')
            , psql = null
            
          env.DB_HOST = data.NetworkSettings.IPAddress;
          sql.push("CREATE ROLE gitlab with LOGIN CREATEDB PASSWORD '"+newPass+"';")
          sql.push("CREATE DATABASE gitlabhq_production;")
          sql.push("GRANT ALL PRIVILEGES ON DATABASE gitlabhq_production to gitlab;")
          script = _.map(sql, function (sql) {
            return 'psql -U '+pgUser+' -d template1 -h '+env.DB_HOST+' --command \"'+sql+'\"';
          }).join('\n');
          exec(script, {env:{PGPASSWORD:pgPass}}, function (err) {
            if (err) throw new Error(err);
            console.log(pg.scope.name+" created gitlab user and database")
          });
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
