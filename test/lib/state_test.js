var helper = require('../test_helper.js');

describe('State', function() {
  var scope = helper.buildScope('state-tests', { namespace: "dewey" })
  var state = scope.state;

  it("is ok", function () {
    expect(state).to.be.ok;
  })


});
