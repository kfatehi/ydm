var expect = require('chai').expect;
var sinon = require('sinon');

describe("Dew", function() {
  var Dew = require('../../lib/dew.js');
  var dew = null;

  beforeEach(function() {
    dew = new Dew();
  });

  describe("install()", function() {
    describe("invalid drop", function() {
      it("raises an error", function() {
        expect(function () {
          dew.install('invalid'); 
        }).to.throw(Error);
      });
    });

    describe("valid drop", function() {
      var drop = null;
      beforeEach(function() {
        drop = require('../../drops/gitlab');
        sinon.stub(drop, 'install');
      });
      afterEach(function() {
        drop.install.restore();     
      });
      it("calls its install() function", function() {
        dew.install('gitlab')
        expect(drop.install.callCount).to.eq(1);
      });
    });
  });
});
