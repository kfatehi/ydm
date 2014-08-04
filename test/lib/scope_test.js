var helper = require('../test_helper.js');

describe('Scope', function() {
  var scope = helper.buildScope('test-scope', { namespace: "bad-ideas" })

  it(".home is correct", function () {
    expect(scope.home).to.eq('/tmp/dew-tests/scopes/bad-ideas/test-scope')
  })

  it(".name is correct", function () {
    expect(scope.name).to.eq('bad-ideas.test-scope');
  })

  it(".namespace.home is correct", function () {
    expect(scope.namespace.home).to.eq('/tmp/dew-tests/scopes/bad-ideas')
  })

  describe("#managedVolumes()", function () {
    var out = scope.managedVolumes({
      smoke: "/mari/jua/na",
      drink: "/tan/que/ray"
    })

    it("returns an array with length 2", function () {
      expect(out).to.be.an.Array;
      expect(out).to.have.length(2);
    })

    it('returns docker binds with correct paths', function () {
      expect(out).to.deep.eq([
        '/tmp/dew-tests/scopes/bad-ideas/test-scope/volumes/smoke:/mari/jua/na',
        '/tmp/dew-tests/scopes/bad-ideas/test-scope/volumes/drink:/tan/que/ray'
      ])
    })
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
