var dockerConnect = require('../../../lib/docker_connect')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dew = require('../../../lib/dew')

describe("Gitlab#install()", function() {
  var PostgreSQL = null

  beforeEach(function(done) {
    sinon.stub(dockerConnect, 'connect').returns({
      docker: {
        getContainer: sinon.stub().returns({
          inspect: sinon.stub().yields(null, {
            State: {
              Running: false
            }
          }),
          start: sinon.stub().yields(null),
          logs: sinon.stub().yields(null, {
            on: sinon.stub()
          })
        })
      }
    })

    var argv = { namespace: "foo", dewhome: "/tmp/dew-tests" }
    require('rimraf')(argv.dewhome+'/scopes/'+argv.namespace, function () {
      var dew = new Dew()
      var GitLab = dew.drops['gitlab'](argv, dew)

      PostgreSQL = dew.drops['postgresql'](argv, dew)

      gitlab = new GitLab()

      sinon.stub(PostgreSQL.prototype, 'install').yields(null, 'pguser', 'pgpass')

      //gitlab.install()
      done()
    })
  });
  afterEach(function() {
    dockerConnect.connect.restore()

  });

  /*
  it("is impossible to test ...", function() {
    // :( 
    // we'll need to test the things they use instead
  });
 */
});
