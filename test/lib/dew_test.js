var expect = require('chai').expect;
var sinon = require('sinon');

describe("Dew", function() {
  var Dew = require('../../lib/dew.js');
  var dew = null;

  beforeEach(function() {
    dew = new Dew();
  });
  
  it("defines drops", function() {
    expect(dew.drops['postgresql']).to.be.ok;
    expect(dew.drops['gitlab']).to.be.ok;
  });
});
