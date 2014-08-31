var expect = require('chai').expect;
var sinon = require('sinon');

describe("CLI", function() {
  var cli = require('../../lib/cli.js');
  var App = require('../../lib/app.js');
  var app = null;
  var stub = null;

  beforeEach(function() {
    app = new App();
    app.drops = {
      postgresql: function() {
        return function() {
          return { action: function() { stub() } }
        }
      }
    }
    stub = sinon.stub();
  });


  it("performs a drop action", function() {
    cli.run({
      _: ['action', 'postgresql']
    }, app)
    expect(stub.callCount).to.eq(1)
  });
});
