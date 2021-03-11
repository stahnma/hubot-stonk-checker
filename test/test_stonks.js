  var Helper, chai, expect, helper, mockDateNow, nock, originalDateNow;

  Helper = require('hubot-test-helper');

  chai = require('chai');
  nock = require('nock');

  expect = chai.expect;

  helper = new Helper(['../src/stonks.js']);
  originalDateNow = Date.now;

  mockDateNow = function () {
    return Date.parse('Tue Mar 30 2018 14:10:00 GMT-0500 (CDT)');
  };

  describe('hubot-stonk-checker (plain text)', function () {
    beforeEach(function () {
      process.env.HUBOT_LOG_LEVEL = 'error';
      process.env.HUBOT_FINNHUB_API_KEY = 'foobar1';
      process.env.HUBOT_MEMESTONKS = 'amc';
      Date.now = mockDateNow;
      nock.disableNetConnect();
      return this.room = helper.createRoom();
    });

    afterEach(function () {
      delete process.env.HUBOT_LOG_LEVEL;
      delete process.env.HUBOT_FINNHUB_API_KEY;
      delete process.env.HUBOT_MEMESTONKS;
      Date.now = originalDateNow;
      nock.cleanAll();
      return this.room.destroy();
    });

    it('responds with a stonk price', function (done) {
      var selfRoom;
      nock('https://finnhub.io')
        .get('/api/v1/quote')
        .query(true)
        .replyWithFile(200, __dirname + '/fixtures/stonks-cat.json');
      selfRoom = this.room;
      selfRoom.user.say('alice', '@hubot stonks cat');
      return setTimeout(function () {
        var err;
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot stonks cat'],
            ['hubot', 'CAT $218.82  ($-3.000 -1.352%)']
          ]);
          done();
        } catch (error) {
          err = error;
          done(err);
        }
      }, 100);
    });

    it('handles doge as symbol for doge-usd', function (done) {
      var selfRoom;
      nock('https://finnhub.io')
        .get('/api/v1/quote')
        .query(true)
        .replyWithFile(200, __dirname + '/fixtures/stonks-cat.json');
      selfRoom = this.room;
      selfRoom.user.say('alice', '@hubot stonks doge');
      return setTimeout(function () {
        var err;
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot stonks doge'],
            ['hubot', 'DOGE-USD $218.82  ($-3.000 -1.352%)']
          ]);
          done();
        } catch (error) {
          err = error;
          done(err);
        }
      }, 100);
    });

    it('handles btc as symbol for btc-usd', function (done) {
      var selfRoom;
      nock('https://finnhub.io')
        .get('/api/v1/quote')
        .query(true)
        .replyWithFile(200, __dirname + '/fixtures/stonks-cat.json');
      selfRoom = this.room;
      selfRoom.user.say('alice', '@hubot stonks btc');
      return setTimeout(function () {
        var err;
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot stonks btc'],
            ['hubot', 'BTC-USD $218.82  ($-3.000 -1.352%)']
          ]);
          done();
        } catch (error) {
          err = error;
          done(err);
        }
      }, 100);
    });

    it('handles btc as symbol for xrp-usd', function (done) {
      var selfRoom;
      nock('https://finnhub.io')
        .get('/api/v1/quote')
        .query(true)
        .replyWithFile(200, __dirname + '/fixtures/stonks-cat.json');
      selfRoom = this.room;
      selfRoom.user.say('alice', '@hubot stonks xrp');
      return setTimeout(function () {
        var err;
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot stonks xrp'],
            ['hubot', 'XRP-USD $218.82  ($-3.000 -1.352%)']
          ]);
          done();
        } catch (error) {
          err = error;
          done(err);
        }
      }, 100);
    });

    it('lets you know when a symbol is not found', function (done) {
      var selfRoom;
      nock('https://finnhub.io')
        .get('/api/v1/quote')
        .query(true)
        .replyWithFile(200, __dirname + '/fixtures/stonks-notfound.json');
      selfRoom = this.room;
      selfRoom.user.say('alice', '@hubot stonks ajajaj');
      return setTimeout(function () {
        var err;
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot stonks ajajaj'],
            ['hubot', 'AJAJAJ ticker symbol not found.']
          ]);
          done();
        } catch (error) {
          err = error;
          done(err);
        }
      }, 100);
    });

    it('displays memestonks', function (done) {
      var selfRoom;
      nock('https://finnhub.io')
        .get('/api/v1/quote')
        .query(true)
        .replyWithFile(200, __dirname + '/fixtures/stonks-cat.json');
      selfRoom = this.room;
      selfRoom.user.say('alice', '@hubot memestonks');
      return setTimeout(function () {
        var err;
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot memestonks'],
            ['hubot', 'AMC $218.82  ($-3.000 -1.352%)']
          ]);
          done();
        } catch (error) {
          err = error;
          done(err);
        }
      }, 100);
    });

    it('displays memestonks with a diff env var', function (done) {
      var selfRoom;
      nock('https://finnhub.io')
        .get('/api/v1/quote')
        .query(true)
        .replyWithFile(200, __dirname + '/fixtures/stonks-amc.json');
      selfRoom = this.room;
      selfRoom.user.say('alice', '@hubot memestonks');
      return setTimeout(function () {
        var err;
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot memestonks'],
            ['hubot', 'AMC $7.93  ($-0.360 -4.343%)']
          ]);
          done();
        } catch (error) {
          err = error;
          done(err);
        }
      }, 100);
    });
  });
