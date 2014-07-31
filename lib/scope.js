var Docker = require('dockerode')
  , URI = require("uri-js")
  , dockerHost = process.env.DOCKER_HOST
  , docker = null

function Scope(root) {
  this.root = root
  if (dockerHost) {
    var url = URI.parse(dockerHost)
    docker = new Docker(url);
  } else if (fs.existsSync('/var/run/docker.sock')) {
    docker = new Docker({socketPath: '/var/run/docker.sock'})
  }
  console.log(docker);
  this.tools = {
    docker: docker,
    createContainer: function (config, cb) {
      console.log('create');
      docker.createThatShit()
      cb();
    },
    startContainer: function (cb) {
      console.log('start');
      cb();
    },
    containerExists: function () {
      return false;
    },
    containerRunning: function () {
      return false;
    }
  }
};

Scope.prototype = {
};

module.exports = Scope
