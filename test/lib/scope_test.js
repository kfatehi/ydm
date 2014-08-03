var Scope = require('../../lib/scope');

describe('scope', function() {
  var scope = null;
  beforeEach(function() {
    scope = new Scope({
      home: dir(scopeHome),
      name: scopeName
    });
  });
})
