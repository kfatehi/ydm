process.env.DOCKER_HOST="http://ydm-tests.local"
var home = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;
process.env.YDM_HOME = require('path').join(home, ".ydm-tests")

expect = require('chai').expect
sinon = require('sinon')
nock = require('nock')

scopeMaker = require('../lib/scope_maker')

module.exports = {
  App: require('../lib/app'),
  clearScope: function (scope) {
    require('rimraf').sync(process.env.YDM_HOME+'/scopes/'+scope)
  },
  buildScope: function (name, argv, opts) {
    var options = opts || { clear: true };
    if (options.clear) this.clearScope(argv.namespace || name);
    return scopeMaker.makeScope(name, {
      name: name,
      namespace: argv.namespace,
      ydmhome: scopeMaker.mkdir(process.env.YDM_HOME)
    }, new this.App({
      scopesPath: process.env.YDM_HOME+'/scopes'
    }))
  },
  mocker: function () {
    return nock(process.env.DOCKER_HOST)
  }
}
