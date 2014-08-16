var expect = require('chai').expect;
var sinon = require('sinon');

describe("App", function() {
  var App = require('../../lib/app.js');
  var app = null;

  beforeEach(function() {
    app = new App();
  });
  
  it("defines drops", function() {
    expect(app.drops['postgresql']).to.be.ok;
    expect(app.drops['gitlab']).to.be.ok;
  });
});
