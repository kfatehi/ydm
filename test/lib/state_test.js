var helper = require('../test_helper.js');

describe('State', function() {
  var scope = null, state = null

  beforeEach(function() {
    scope = helper.buildScope('state-tests', { namespace: "ydmey" })
    scope.storage.setItem('_id', 1);
    state = scope.state
  });

  it("exposes the docker connection", function() {
    expect(state.dockerConnection).to.be.ok;
  });

  describe("getContainer()", function() {
    it("is a function", function() {
      expect(state.getContainer).to.be.an.instanceof(Function)
    });
  });

  describe("pullImage()", function() {
    var mock = null;
    beforeEach(function() {
      mock = helper.mocker().post('/images/create?fromImage=some-proggie&tag=0.0.1', {
        "fromImage": "some-proggie",
        "tag": "0.0.1"
      })
    });

    describe("when there is an error", function() {
      it("calls back with the error", function(done) {
        mock.reply(200, '{"error": "the error"}')
        state.pullImage('some-proggie:0.0.1', function (err) {
          expect(err.message).to.match(/the error/)
          done();
        })
      });
    });

    describe("when everything looks ok", function() {
      it("prints data and calls back without error", function(done) {
        mock.reply(200, '{"cool": "all good"}')
        sinon.stub(console, 'info')
        state.pullImage('some-proggie:0.0.1', function (err) {
          expect(console.info.callCount).to.eq(1)
          expect(console.info.getCall(0).args[0]).to.deep.eq({ cool: "all good" })
          console.info.restore()
          expect(err).to.eq(null)
          done();
        })
      });
    });
  });

  describe("apply()", function() {
    describe("mocking docker to 404 on Container#inspect", function() {
      beforeEach(function() {
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
              helper.mocker().get('/containers/1/json').reply(200, { State: { Running: true } })
              helper.mocker().get('/containers/1/json').reply(200, { State: { Running: true } })
              state.apply(scope, config, function (_err, _res) {
                if (_err) throw _err;
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

      describe("mocking docker to 201 on createContainer", function() {
        var config = { create: { Image: "test-image" } }
          , newId = null
        beforeEach(function() {
          newId = Math.random().toString(24).substring(2)
          helper.mocker()
          .post('/containers/create?Image=test-image', {
            "Image":"test-image"
          }).reply(201, { Id: newId })
          helper.mocker().get('/containers/'+newId+"/json").reply(200, {
            State: { Running: false }
          })
          helper.mocker().post('/containers/'+newId+'/start').reply(204)
          helper.mocker().get('/containers/'+newId+"/json").reply(200, {
            State: { Running: true }
          })
        });

        it("persists the container id", function(done) {
          state.apply(scope, config, function (_err, _res) {
            if (_err) throw _err;
            expect(scope.storage.getItem('_id')).to.eq(newId)
            done();
          })
        });

        it("on successfully starting the container calls State#apply()", function(done) {
          sinon.spy(state, 'apply')
          state.apply(scope, config, function (_err, _res) {
            if (_err) throw _err;
            expect(state.apply.callCount).to.eq(2)
            expect(state.apply.getCall(1).args).to.deep.eq(state.apply.getCall(0).args)
            state.apply.restore()
            done();
          })
        });
      });
    });

    describe("mocking docker to 200 on Container#inspect", function() {
      beforeEach(function() {
        helper.mocker().get('/containers/1/json').reply(200, {
          HereIs: "your Shit"
        })
      });
      it("calls State#ensure() once with a callback", function(done) {
        sinon.stub(state, 'ensure').yields()
        state.apply(scope, { create: {} }, function (err, res) {
          if (err) throw err;
          expect(state.ensure.callCount).to.eq(1)
          expect(state.ensure.getCall(0).args[0]).to.be.an.instanceof(Function)
          state.ensure.restore()
          done();
        })
      });
    });
  });

  describe("ensure()", function() {
    describe("Container#inspect tells us the container is running", function() {
      beforeEach(function() {
        helper.mocker().get('/containers/1/json').reply(200, {
          State: { Running: true }
        })
      });

      it("calls back with no error", function(done) {
        state.ensure(function (err) {
          expect(err).to.eq(null)
          done()
        })
      });
    });

    describe("Container#inspect tells us the container is stopped", function() {
      beforeEach(function() {
        helper.mocker().get('/containers/1/json').reply(200, {
          State: { Running: false }
        })
      });

      it("starts the container and calls State#ensure()", function(done) {
        helper.mocker().post('/containers/1/start').reply(204)
        helper.mocker().get('/containers/1/json').reply(200, {
          State: { Running: true }
        })
        sinon.spy(state, 'ensure')
        state.ensure(function () {
          expect(state.ensure.callCount).to.eq(2)
          state.ensure.restore()
          done()
        })
      });
    });
  });

  describe("destroy()", function() {
    var fs = require('fs'), mock = null;
    beforeEach(function() {
      mock = helper.mocker()
      .delete('/containers/1?force=true&v=true')
      .reply(204)
    });

    it("destroys the container", function(done) {
      state.destroy(function () {
        mock.done()
        done()
      })
    });

    it("deletes the data volumes", function(done) {
      var out = scope.managedVolumes({
        smoke: "/mari/jua/na",
        drink: "/tan/que/ray"
      })
      expect(fs.existsSync(out[0].split(':')[0])).to.be.true;
      expect(fs.existsSync(out[1].split(':')[0])).to.be.true;
      state.destroy(function () {
        expect(fs.existsSync(out[0].split(':')[0])).to.be.false;
        expect(fs.existsSync(out[1].split(':')[0])).to.be.false;
        mock.done()
        done()
      })
    });

    describe("linked", function () {
      var jackHerer = null, spottedCow = null, mock2 = null, mock3 = null;

      beforeEach(function () {
        jackHerer = { scope: helper.buildScope('herb', { namespace: "drugs" }) }
        spottedCow = { scope: helper.buildScope('ale', { namespace: "drugs" }, { clear: false }) }

        jackHerer.scope.storage.setItem('_id', 2)
        spottedCow.scope.storage.setItem('_id', 3)

        expect(fs.existsSync(jackHerer.scope.home)).to.be.true;
        expect(fs.existsSync(spottedCow.scope.home)).to.be.true;

        mock2 = helper.mocker()
        .delete('/containers/2?force=true&v=true')
        .reply(204)

        mock3 = helper.mocker()
        .delete('/containers/3?force=true&v=true')
        .reply(204)

      })

      it("removes (unshared) linked (dependent) containers", function (done) {
        var out = scope.managedLinks({
          smoke: jackHerer,
          drink: spottedCow
        })
        state.destroy(function () {
          expect(fs.existsSync(jackHerer.scope.home)).to.be.false;
          expect(fs.existsSync(spottedCow.scope.home)).to.be.false;
          mock.done()
          mock2.done()
          mock3.done()
          done()
        })
      })
    })

    it("removes the scope directory", function(done) {
      expect(fs.existsSync(scope.home)).to.be.true;
      state.destroy(function () {
        expect(fs.existsSync(scope.home)).to.be.false;
        mock.done()
        done()
      })
    });
  });
});
