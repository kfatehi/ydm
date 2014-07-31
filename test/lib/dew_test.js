var expect = require('chai').expect;

describe("Dew", function() {
  var Dew = require('../../lib/dew.js');
  var dew = null;
  beforeEach(function() {
    dew = new Dew();
  });
  describe("list()", function() {
    var out = null;
    beforeEach(function() {
      out = dew.list();
    });
    it("returns available drops", function() {
      expect(out).to.deep.eq([]);
    });
  });
});
