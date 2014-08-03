var  _ = require('lodash'), util = require('util')

module.exports = function(scope, argv, dew) {
  var PostgreSQL = dew.drops['postgresql'](argv, dew)
    , pg = new PostgreSQL()
    , image = "sameersbn/gitlab:7.1.1"
    , links = [ pg.scope.name+":postgresql" ]
    , volumes = { data: "/home/git/data" }

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
    DB_PASS: scope.localStorage.getItem('gitlab_pg_pass'),
    DB_NAME: 'gitlabhq_production'
  }

  var drop = {
    requiresNamespace: true,
    install: function (done) {
      pg.install(function (err, pgUser, pgPass) {
        if (err) throw new Error(err);
        if (scope.localStorage.getItem('configured')) {
          console.log(scope.name+" has previously configured "+pg.scope.name);
          startGitlab(done)
        } else {
          console.log(scope.name+" will configure "+pg.scope.name);
          configure(pgUser, pgPass, done);
        }
      });
    }
  }

  function startGitlab(cb) {
    scope.applyConfig({
      env: env,
      volumes: volumes,
      create: {
        Image: image
      },
      start: {
        Links: links,
        PortBindings:{
          "22/tcp": [{ "HostPort": "10022" }],
          "80/tcp": [{ "HostPort": "10080" }]
        },
      }
    }, cb);
  }

  function setupGitlab(cb) {
    scope.reapplyConfig({
      env: env,
      volumes: volumes,
      create: {
        Image: image,
        AttachStdin: true,
        OpenStdin: true,
        Tty: true,
        Cmd:[ "app:rake", "gitlab:setup" ],
        Env: _.map(env, function (key, value) {
          return key+":"+value
        })
      },
      start: {
        Links: links
      }
    }, function (err) {
      if (err) throw err;
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
          console.log(str);
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

  function configure(pgAdminUser, pgAdminPass, done) {
    var spawn = require('child_process').spawn

    pg.inspect(function (err, data) {
      env.DB_PASS = Math.random().toString(26).substring(2)
      pg.scope.localStorage.setItem('gitlab_pg_pass', env.DB_PASS)

      env.DB_HOST = data.NetworkSettings.IPAddress
      scope.localStorage.setItem('gitlab_pg_host', env.DB_HOST)

      var sh = spawn("sh", ["-c", _.map([
        "CREATE ROLE "+env.DB_USER+" with LOGIN CREATEDB PASSWORD '"+env.DB_PASS+"';",
        "CREATE DATABASE "+env.DB_NAME+";",
        "GRANT ALL PRIVILEGES ON DATABASE "+env.DB_NAME+" to "+env.DB_USER+";"
      ], function(sql){
        return 'psql -U '+pgAdminUser+' -d template1 -h '+env.DB_HOST+' --command \"'+sql+'\"';
      }).join('\n')], { env:{ PGPASSWORD: pgAdminPass } });

      sh.stdout.on('data', function (data) { console.log(data.toString().trim()) })
      sh.stderr.on('data', function (data) { console.error(data.toString().trim()) })
      sh.on('close', function (code) {
        if (code !== 0) {
          throw new Error("psql exited with non-zero status");
        } else if (code === 0) {
          console.log(pg.scope.name+" created gitlab user and database")
          if (scope.localStorage.getItem('gitlabSetup')) {
            startGitlab(done)
          } else {
            setupGitlab(function () {
              scope.localStorage.setItem('gitlabSetup', true);
              startGitlab(done)
            })
          }
        }
      });
    });
  }

  return drop;
}
