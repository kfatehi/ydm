var expect = require('chai').expect;

describe("Dew", function() {
  var Dew = require('../../lib/dew.js');
  var dew = null;
  var out = null;

  beforeEach(function() {
    dew = new Dew({
      src: require('path').resolve('.')
    });
  });

  describe("drops()", function() {
    beforeEach(function(done) {
      dew.drops(function (err, res) {
        if (err) throw err;
        out = res;
        done();
      });
    });

    it("returns available drops", function() {
      expect(Object.keys(out)).
        to.contain('example').and.
        to.contain('example2');
    });
  });

  describe("install()", function() {
    describe("invalid drop", function() {
      it("raises an error", function(done) {
        dew.install('invalid', function (err, res) {
          expect(err.message).to.match(/No such drop/)
          expect(res).not.to.be.ok
          done()
        });
      });
    });

    it("", function() {
      
    });
  });
});
