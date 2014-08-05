var helper = require('../test_helper.js');

describe('State', function() {
  var scope = null, state = null

  beforeEach(function() {
    scope = helper.buildScope('state-tests', { namespace: "dewey" })
    state = scope.state;
  });

  describe("getContainer()", function() {
    it("is a function", function() {
      expect(state.getContainer).to.be.an.instanceof(Function)
    });
  });

  describe("apply()", function() {
    describe("no docker mock", function() {
      it("calls back with a connection error", function(done) {
        state.apply(scope, {}, function (err) {
          expect(err.code).to.eq('ECONNREFUSED')
          expect(err.syscall).to.eq('connect')
          done()
        })
      });
    });

    describe("mocking docker to 404 on Container#inspect", function() {
      beforeEach(function() {
        scope.storage.setItem('_id', 1);
        helper.mocker().get('/containers/1/json').reply(404)
      });
      it("bitches if you didnt configure an image", function(done) {
        state.apply(scope, { create: {} }, function (err) {
          expect(err.message).to.match(/Missing.+Image/)
          done();
        })
      });
      describe("mocking docker to 404 on createContainer", function() {
        beforeEach(function() {
          helper.mocker()
          .post('/containers/create?Image=test-image', {
            "Image":"test-image"
          }).reply(404)
        });
        it("creates the container", function(done) {
          state.apply(scope, {
            create: { Image: "test-image" }
          }, function (err) {
            console.log(err)
            done()
          })
        });
      });
    });
  });


});
