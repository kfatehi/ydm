var  _ = require('lodash'), util = require('util')

module.exports = function(scope, argv, dew) {
  var PostgreSQL = dew.drops['postgresql'](argv, dew);
  var pg = new PostgreSQL()
  var image = "sameersbn/gitlab:7.1.1";
  var config = {
    image: image,
    volumes: {
      data: "/home/git/data"
    },
    ports: {
      10022: 22,
      10080: 80
    }
  }
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

  function startGitlab(cb) {
    scope.applyConfig(_.assign({}, config, {
      create: {
        Image: image
      },
      start: {

      }
    }), function (err) {
      if (err) throw err;
      scope.tailForever();
    })
  }

  function setupGitlab(cb) {
    scope.applyConfig(_.assign({}, config, {
      create: {
        Image: image,
        AttachStdin: true,
        OpenStdin: true,
        Tty: true,
        Cmd:[ "app:rake", "gitlab:setup" ]
      }
    }), function (err) {
      if (err) throw new Error(err);
      var setup = scope.state.getContainer();
      setup.attach({
        stream: true,
        stdin: true,
        stdout: true,
        stderr: true
      }, function (err, stream) {
        if (err) throw err;
        console.log(scope.name+" is being configured, please wait...")
        stream.on('error', function(e2) { err = new Error(e2) });

        var loginPatt = /login\.+(\S+)/;
        var passPatt = /password\.+(\S+)/;

        stream.on('data', function (chunk) {
          var str = chunk.toString('utf-8').trim();
          var loginMatch = str.match(loginPatt);
          var passMatch = str.match(passPatt);
          if (/Do you want to continue/.test(str)) {
            stream.write('yes\n');
          }
          if (loginMatch) {
            scope.localStorage.setItem('gitlab_login', loginMatch[1])
            console.log(scope.name+".gitlab_user: "+loginMatch[1]);
          }
          if (passMatch) {
            scope.localStorage.setItem('gitlab_pass', passMatch[1])
            console.log(scope.name+".gitlab_pass: "+passMatch[1]);
            // If we came this far we're ready to destroy the container
            // and flag that gitlab has been configured
            scope.localStorage.getItem('configured', true);
            console.log(scope.name+" has been configured, removing temporary container.")
            setup.remove({ force: true }, cb)
          }
        });
      }); 
    })
  }

  function configure(pgUser, pgPass, done) {
    pg.inspect(function (err, data) {
      var exec = require('child_process').exec
        , newPass = Math.random().toString(26).substring(2)
        , sql = [], script = null

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

      if (scope.localStorage.getItem('postgresConfigured')) {
        startGitlab(done)
      } else {
        setupGitlab(function () {
          scope.localStorage.setItem('postgresConfigured', true);
          startGitlab(done)
        })
      }
    });
  }

  return {
    install: function (done) {
      pg.install(function (err, pgUser, pgPass) {
        if (err) throw new Error(err);
        if (scope.localStorage.getItem('configured')) {
          console.log(scope.name+" has previously configured "+pg.scope.name);
          startGitlab()
        } else {
          console.log(scope.name+" will configure "+pg.scope.name);
          configure(pgUser, pgPass, done);
        }
      });
    }
  }
}
