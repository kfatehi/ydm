var helper = require('../test_helper.js');

describe('Scope', function() {
  var scope = helper.buildScope('test-scope', { namespace: "bad-ideas" })

  it(".home is correct and real", function () {
    expect(scope.home).to.eq(process.env.YDM_HOME+'/scopes/bad-ideas/test-scope')
    expect(require('fs').existsSync(scope.home)).to.be.true;
  })

  it(".name is correct", function () {
    expect(scope.name).to.eq('bad-ideas.test-scope');
  })

  it(".namespace.home is correct", function () {
    expect(scope.namespace.home).to.eq(process.env.YDM_HOME+'/scopes/bad-ideas')
  })

  describe("#managedLinks()", function () {
    var out = null, expected = null;
    before(function() {
      helper.clearScope('pgtest');
      var app = new helper.App()
      var PostgreSQL = app.drops['postgresql']({ namespace: "drugs" }, {})
      marijuana = new PostgreSQL();
      tanqueray = new PostgreSQL();
      out = scope.managedLinks({
        smoke: marijuana,
        drink: tanqueray
      })
      expected = [
        "drugs.postgresql:smoke",
        "drugs.postgresql:drink"
      ]
    });

    it("returns an array with length 2", function() {
      expect(out).to.be.an.Array;
      expect(out).to.have.length(2);
    });

    it('returns Docker Links correctly', function () {
      expect(out).to.deep.eq(expected)
    })

    it("sets _managedLinks in the scope as a trace for uninstall", function() {
      var data = JSON.parse(scope.storage.getItem('_managedLinks'))
      expect(data.Links).to.deep.eq(expected);
      var scopes = JSON.parse(JSON.stringify([ marijuana.scope, tanqueray.scope ]))
      expect(data.Scopes).to.deep.eq(scopes);
    });
  })

  describe("#managedVolumes()", function () {
    var out = null, expected = null;
    
    before(function () {
      out = scope.managedVolumes({
        smoke: "/mari/jua/na",
        drink: "/tan/que/ray"
      })
      expected = [
        process.env.YDM_HOME+'/scopes/bad-ideas/test-scope/volumes/smoke:/mari/jua/na',
        process.env.YDM_HOME+'/scopes/bad-ideas/test-scope/volumes/drink:/tan/que/ray'
      ]
    })
    
    it("returns an array with length 2", function () {
      expect(out).to.be.an.Array;
      expect(out).to.have.length(2);
    })

    it('returns Docker Binds with correct paths', function () {
      expect(out).to.deep.eq(expected)
    })

    it("sets _managedVolumes in the scope as a trace for uninstall", function() {
      var binds = JSON.parse(scope.storage.getItem('_managedVolumes')).Binds
      expect(binds).to.deep.eq(expected);
    });
  })

  describe("#setConfig()", function() {
    it("converts Env from Javascript Object to Docker-style Array", function() {
      scope.setConfig({ create: { Env: { foo: "bar", baz: true } } })
      expect(scope.getConfig().create.Env).to.deep.eq([ "foo=bar","baz=true" ])
    });

    it("leaves Env alone when already an Array", function() {
      scope.setConfig({ create: { Env: [ "foo=bar", "baz=true" ] } })
      expect(scope.getConfig().create.Env).to.deep.eq([ "foo=bar","baz=true" ])
    });
  });
})
