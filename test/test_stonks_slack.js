  var Helper, chai, expect, helper, mockDateNow, nock, originalDateNow;

  Helper = require('hubot-test-helper');

  chai = require('chai');
  nock = require('nock');
  expect = chai.expect;

  helper = new Helper(['adapters/slack.coffee', '../src/stonks.js']);

  originalDateNow = Date.now;

  mockDateNow = function () {
    return Date.parse('Tue Mar 30 2018 14:10:00 GMT-0500 (CDT)');
  };

  describe('hubot-stonk-checker (rich formatting)', function () {
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

    it('responds with a stonk price (rich formatting)', function (done) {
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
            ['hubot', ':stonks-down: CAT $218.82  ($-3.000 -1.352%)']
          ]);
          done();
        } catch (error) {
          err = error;
          done(err);
        }
      }, 1000);
    });
    it('responds with diamond hands when more than 15% gain', function (done) {
      var selfRoom;
      nock('https://finnhub.io')
        .get('/api/v1/quote')
        .query(true)
        .replyWithFile(200, __dirname + '/fixtures/stonks-gme.json');
      selfRoom = this.room;
      selfRoom.user.say('alice', '@hubot stonks gme');
      return setTimeout(function () {
        var err;
        try {
          expect(selfRoom.messages).to.eql([
            ['alice', '@hubot stonks gme'],
            ['hubot', ':stonks: GME $191.495  ($+82.765 +76.120%)\n :gem: :raised_hands: :rocket: :rocket: :rocket: :moon:']
          ]);
          done();
        } catch (error) {
          err = error;
          done(err);
        }
      }, 1000);
    });

    it('handles doge as symbol for doge-usd (rich formatting)', function (done) {
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
            ['hubot', ':doge: :stonks-down: DOGE-USD $218.82  ($-3.000 -1.352%)']
          ]);
          done();
        } catch (error) {
          err = error;
          done(err);
        }
      }, 1000);
    });

    it('displays memestonks (rich formatting)', function (done) {
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
            ['hubot', ':wsb:'],
            ['hubot', ':stonks-down: AMC $218.82  ($-3.000 -1.352%)']
          ]);
          done();
        } catch (error) {
          err = error;
          done(err);
        }
      }, 1000);
    });

    it('displays memestonks with a diff env var (rich formatting)', function (done) {
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
            ['hubot', ':wsb:'],
            ['hubot', ':stonks-down: AMC $7.93  ($-0.360 -4.343%)']
          ]);
          done();
        } catch (error) {
          err = error;
          done(err);
        }
      }, 1000);
    });
  });
