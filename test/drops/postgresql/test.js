var helper = require('../../test_helper')

describe("Postgresql", function() {
  var pg = null
  var doneCallback = null 

  before(function() {
    helper.clearScope('pgtest');
    var app = new helper.App()
    var PostgreSQL = app.drops['postgresql']({ namespace: "pgtest" }, {})
    pg = new PostgreSQL();
  });

  it("can be initialized", function() {
    expect(pg).to.be.ok;
  });

  it("has a scope", function() {
    expect(pg.scope).to.be.ok;
  });

  describe("#install (config)", function() {
    beforeEach(function() {
      doneCallback = sinon.stub()
      sinon.stub(pg.scope.state, 'apply')
      pg.install()
    });

    afterEach(function() {
      pg.scope.state.apply.restore();
    });

    it("does not call done yet", function() {
      expect(doneCallback.callCount).to.eq(0)
    });

    it("applies the config once", function() {
      expect(pg.scope.state.apply.callCount).to.eq(1)
    });

    it("applies state with correct config & persists the config", function() {
      var expectedConfig = {
        create: {
          name: 'pgtest.postgresql',
          Env: [],
          Image: 'sameersbn/postgresql:latest'
        },
        start: {
          Binds: [
            process.env.YDM_HOME+'/scopes/pgtest/postgresql/volumes/data:/var/lib/postgresql'
          ], Links: [], PublishAllPorts: false }
      }
      expect(pg.scope.state.apply.getCall(0).args[1]).to.deep.eq(expectedConfig)
      expect(pg.scope.getConfig()).to.deep.eq(expectedConfig);
    });
  });

  describe("#install (callback)", function() {
    beforeEach(function() {
      sinon.stub(pg.scope, 'tailUntilMatch').yields(null, '', 'postgres', 'pass')
      sinon.stub(pg.scope.state, 'apply').yields(null)
      sinon.stub(pg.scope, 'inspectContainer').yields(null, {
        NetworkSettings: { IPAddress: 123 }
      })
      pg.install(doneCallback)
    });

    afterEach(function() {
      pg.scope.tailUntilMatch.restore();
      pg.scope.state.apply.restore();
      pg.scope.inspectContainer.restore();
    });

    it("uses tailUntilMatch function twice", function() {
      expect(pg.scope.tailUntilMatch.callCount).to.eq(2)     
    });

    it("tails for credentials", function() {
      var regex = pg.scope.tailUntilMatch.getCall(0).args[0];
      expect("User: postgres, Password: myPass ").to.match(regex)
    });

    it("tails for connection readiness", function() {
      var regex = pg.scope.tailUntilMatch.getCall(1).args[0];
      expect("database system is ready to accept connections").to.match(regex)
    });

    it("calls the done callback with harvested data", function() {
      var data = doneCallback.getCall(0).args[1]
      expect(data.user).to.eq('postgres')
      expect(data.password).to.eq('pass')
      expect(data.ip_address).to.eq(123)
    });
    
    it("saves harvested data in local storage", function() {
      expect(pg.scope.storage.getItem('pg_user')).to.eq('postgres')
      expect(pg.scope.storage.getItem('pg_pass')).to.eq('pass')
    });
  });
});
