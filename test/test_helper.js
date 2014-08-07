process.env.DOCKER_HOST="http://dew-tests.local"
process.env.DEW_HOME="/tmp/dew-tests"

Dew = require('../lib/dew')
expect = require('chai').expect
Scope = require('../lib/scope')
ScopeMaker = require('../lib/scope_maker')(Scope)
sinon = require('sinon')
nock = require('nock')

module.exports = {
  clearScope: function (scope) {
    require('rimraf').sync(process.env.DEW_HOME+'/scopes/'+scope)
  },
  buildScope: function (name, argv, opts) {
    var options = opts || { clear: true };
    if (options.clear) this.clearScope(argv.namespace || name);
    return ScopeMaker.makeScope(name, {
      name: name,
      namespace: argv.namespace,
      dewhome: ScopeMaker.mkdir(process.env.DEW_HOME)
    })
  },
  mocker: function () {
    return nock(process.env.DOCKER_HOST)
  }
}
