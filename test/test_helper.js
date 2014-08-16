process.env.DOCKER_HOST="http://dew-tests.local"
var home = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;
process.env.DEW_HOME = require('path').join(home, ".dew-tests")

expect = require('chai').expect
sinon = require('sinon')
nock = require('nock')

scopeMaker = require('../lib/scope_maker')

module.exports = {
  App: require('../lib/app'),
  clearScope: function (scope) {
    require('rimraf').sync(process.env.DEW_HOME+'/scopes/'+scope)
  },
  buildScope: function (name, argv, opts) {
    var options = opts || { clear: true };
    if (options.clear) this.clearScope(argv.namespace || name);
    return scopeMaker.makeScope(name, {
      name: name,
      namespace: argv.namespace,
      dewhome: scopeMaker.mkdir(process.env.DEW_HOME)
    })
  },
  mocker: function () {
    return nock(process.env.DOCKER_HOST)
  }
}
