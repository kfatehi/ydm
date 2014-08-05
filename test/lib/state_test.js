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

      describe("mocking docker to 404 on createContainer (image not pulled)", function() {
        beforeEach(function() {
          helper.mocker()
          .post('/containers/create?Image=test-image', {
            "Image":"test-image"
          }).reply(404)
        });

        describe("pulling the image", function() {
          var pullStub = null;
          
          beforeEach(function() {
            pullStub = sinon.stub(state, 'pullImage')
          });

          afterEach(function() {
            state.pullImage.restore()
          });

          describe("pull image succeeds", function() {
            var callback = null
              , config = { create: { Image: "test-image" } }
            beforeEach(function(done) {
              pullStub.yields(null)
              state.apply(scope, config, function (_err, _res) {
                callback = state.pullImage.getCall(0).args[1]
                done()
              });
            });

            it("pulled the right image", function() {
              expect(state.pullImage.getCall(0).args[0]).to.eq('test-image')
            });

            it("only pulled it once", function() {
              expect(state.pullImage.callCount).to.eq(1)
            });

            it("calls State#apply() again with correct arguments", function() {
              sinon.stub(state, 'apply');
              callback()
              expect(state.apply.callCount).to.eq(1);
              var args = state.apply.getCall(0).args;
              expect(args[0]).to.deep.eq(scope)
              expect(args[1]).to.deep.eq(config)
              expect(args[2]).to.be.an.instanceof(Function)
              state.apply.restore()
            });
          });
        });
      });
    });
  });


});
