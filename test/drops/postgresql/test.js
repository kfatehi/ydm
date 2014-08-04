var helper = require('../../test_helper')

describe("Postgresql", function() {
  var pg = null
  var doneCallback = null 

  after(function() {
    console.log.restore()
  });

  before(function() {
    sinon.stub(console, 'log');
    helper.clearScope('postgresql');
    var dew = new Dew()
    var PostgreSQL = dew.drops['postgresql']({})
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
      sinon.stub(pg.scope, 'applyConfig')
      pg.install()
    });

    afterEach(function() {
      pg.scope.applyConfig.restore();
    });

    it("does not call done yet", function() {
      expect(doneCallback.callCount).to.eq(0)
    });

    it("applies the config once", function() {
      expect(pg.scope.applyConfig.callCount).to.eq(1)
    });

    it("applies the correct config", function() {
      expect(pg.scope.applyConfig.getCall(0).args[0]).to.deep.eq({
        create:
          { Image: 'sameersbn/postgresql:latest',
            Binds: [ '/tmp/dew-tests/scopes/postgresql/volumes/data:/var/lib/postgresql' ] } })
    });
  });

  describe("#install (callback)", function() {
    beforeEach(function() {
      sinon.stub(pg.scope, 'tailUntilMatch').yields(null, '', 'postgres', 'pass')
      sinon.stub(pg.scope, 'applyConfig').yields(null)
      pg.install(doneCallback)
    });

    afterEach(function() {
      pg.scope.tailUntilMatch.restore();
      pg.scope.applyConfig.restore();
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

    it("calls the done callback with the harvested username and password", function() {
      var args = doneCallback.getCall(0).args
      expect(args[1]).to.eq('postgres')
      expect(args[2]).to.eq('pass')
    });
  });
});
