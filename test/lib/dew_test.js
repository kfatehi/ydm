var expect = require('chai').expect;

describe("Dew", function() {
  var Dew = require('../../lib/dew.js');
  var dew = null;
  beforeEach(function() {
    dew = new Dew({
      src: require('path').resolve('.')
    });
  });
  describe("drops()", function() {
    var out = null;
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
});
