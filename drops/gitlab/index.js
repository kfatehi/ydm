module.exports = function(scope, argv, ydm) {
  var  _ = require('lodash')
    , PostgreSQL = ydm.drops['postgresql'](argv, ydm)
    , pg = new PostgreSQL()
    , fs = require('fs')
    , sh = require('shelljs')
    , path = require('path')

  return {
    requireDuring: {
      install: {
        "--env": "highly customizable through environment variables, pass in a JSON file. Example: "+JSON.stringify(require('./env.example.json'), null, 4)+"\nFor more information visit https://github.com/sameersbn/docker-gitlab"
      }
    },
    requireAlways: {
      '--namespace': "uses links, therefore a namespace is required",
    },
    install: function (done) {
      pg.install(function (err, info) {
        if (err) throw err;
        if (get('configuredPostgres')) {
          start(done)
        } else {
          configurePostgres(info, function (err) {
            if (err) throw err;
            console.log(pg.scope.name+" persisted gitlab user and database")
            set('configuredPostgres', true)
            start(done)
          })
        }
      });
    }
  }

  var userEnv = null;

  function getOptions() {
    if (! userEnv) {
      var filePath = null;
      try {
        filePath = path.join(sh.pwd(), argv.env)
        userEnv = require(filePath);
      } catch (e) {
        throw new Error('--env was not passed a valid path')
      }
    }
    return {
      create: {
        Image: "sameersbn/gitlab:7.1.1",
        Env: _.assign({}, {
          DB_TYPE: 'postgres',
          DB_HOST: scope.storage.getItem('gitlab_pg_host'),
          DB_USER: 'gitlab',
          DB_PASS: scope.storage.getItem('gitlab_pg_pass'),
          DB_NAME: 'gitlabhq_production'
        }, userEnv)
      },
      start: {
        Links: scope.managedLinks({ postgres: pg }),
        Binds: scope.managedVolumes({ data: '/home/git/data' }),
        PublishAllPorts: !!argv.publish
      }
    }
  }

  function get(key) {
    return scope.storage.getItem(key)
  }

  function set(key, value) {
    return scope.storage.setItem(key, value)
  }

  function start(done) {
    if (get('configuredGitlab')) {
      scope.applyConfig(getOptions(), function () {
        scope.inspectContainer(function (err, data) {
          var ip = data.NetworkSettings.IPAddress;
          done(err, {
            ip_address: ip,
            ports: data.NetworkSettings.Ports,
            app: _.assign({
              urls:{
               http: "http://"+ip+"/",
               https: "https://"+ip+"/"
              }
            }, JSON.parse(get('gitlabInfo'))),
            notes: "You may get 502 errors for a few minutes while assets precompile."
          })
        })
      });
    } else setup(done)
  }

  function setup(done) {
    configureGitlab(function (err, info) {
      if (err) throw err;
      set('configuredGitlab', true)
      set('gitlabInfo', JSON.stringify(info))
      start(done)
    })
  }


  function configureGitlab(cb) {
    var options = getOptions()
    scope.applyConfig({
      create: _.assign({
        AttachStdin: true,
        OpenStdin: true, Tty: true,
        Cmd:[ "app:rake", "gitlab:setup" ],
      }, options.create),
      start: options.start
    }, function (err) {
      if (err) throw err;
      var tmpContainer = scope.state.getContainer();
      tmpContainer.attach({
        stream: true, stdin: true, stdout: true, stderr: true
      }, function (err, stream) {
        if (err) throw err;
        // demux the stream
        // https://github.com/apocas/nodechecker-tester/blob/master/lib/container.js#L120
        stream.on('error', function(e2) { err = new Error(e2) });
        stream.on('data', function (chunk) {
          var str = chunk.toString('utf-8').trim();
          console.log(str);
          var loginMatch = str.match(/login\.+(\S+)/);
          var passMatch = str.match(/password\.+(\S+)/);
          if (/Do you want to continue/.test(str)) stream.write('yes\n')
          if (loginMatch) set('gitlab_login', loginMatch[1])
          if (passMatch) {
            set('gitlab_pass', passMatch[1])
            console.log(scope.name+" has been configured, removing temporary container.")
            tmpContainer.remove({ force: true }, function (err) {
              cb(err, {
                login: get('gitlab_login'),
                pass: get('gitlab_pass')
              })
            })
          }
        });
      }); 
    })
  }

  function configurePostgres(pgInfo, cb) {
    var pgAdminUser = pgInfo.user
      , pgAdminPass = pgInfo.password
      , spawn = require('child_process').spawn
      , env = getOptions().create.Env;

    pg.scope.inspectContainer(function (err, data) {
      if (err) throw err;
      var DB_PASS = Math.random().toString(26).substring(2)
      scope.storage.setItem('gitlab_pg_pass', DB_PASS)
      var DB_HOST = data.NetworkSettings.IPAddress
      scope.storage.setItem('gitlab_pg_host', DB_HOST)
      var sh = spawn("sh", ["-c", _.map([
        "CREATE ROLE "+env.DB_USER+" with LOGIN CREATEDB PASSWORD '"+DB_PASS+"';",
        "CREATE DATABASE "+env.DB_NAME+";",
        "GRANT ALL PRIVILEGES ON DATABASE "+env.DB_NAME+" to "+env.DB_USER+";"
      ], function(sql){
        return 'psql -U '+pgAdminUser+' -d template1 -h '+DB_HOST+' --command \"'+sql+'\"';
      }).join('\n')], { env:{ PGPASSWORD: pgAdminPass } });
      sh.stdout.on('data', function (data) { console.log(data.toString().trim()) })
      sh.stderr.on('data', function (data) { console.error(data.toString().trim()) })
      sh.on('close', function (code) {
        if (code !== 0) cb(new Error("psql exited with non-zero status"));
        else cb(null)
      });
    });
  }
}
