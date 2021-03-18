var Helper = require('hubot-test-helper');
var chai = require('chai');
var nock = require('nock');
var sinon = require('sinon');
chai.use(require('sinon-chai'));
var expect = chai.expect;
var helper = new Helper(['./adapters/slack.js', '../src/stonks.js']);

describe('hubot-stonk-checker (rich formatting)', function () {
  var room = null;

  beforeEach(function () {
    nock('https://finnhub.io')
      .get('/api/v1/quote')
      .query({token: 'foobar1', symbol: 'CAT'})
      .replyWithFile(200, __dirname + '/fixtures/stonks-cat.json');
    nock('https://finnhub.io')
      .get('/api/v1/stock/profile2')
      .query({token: 'foobar1', symbol: 'CAT'})
      .replyWithFile(200, __dirname + '/fixtures/company_profile2_cat.json');
    nock('https://finnhub.io')
      .get('/api/v1/quote')
      .query({token: 'foobar1', symbol: 'DOGE-USD'})
      .replyWithFile(200, __dirname + '/fixtures/stonks-cat.json');
    nock('https://finnhub.io')
      .get('/api/v1/stock/profile2')
      .query({token: 'foobar1', symbol: 'DOGE-USD'})
      .reply(200, "{}");
    nock('https://finnhub.io')
      .get('/api/v1/quote')
      .query({token: 'foobar1', symbol: 'AMC'})
      .replyWithFile(200, __dirname + '/fixtures/stonks-amc.json');
    nock('https://finnhub.io')
      .get('/api/v1/stock/profile2')
      .query({token: 'foobar1', symbol: 'AMC'})
      .replyWithFile(200, __dirname + '/fixtures/company_profile2_amc.json');
    nock('https://finnhub.io')
      .get('/api/v1/quote')
      .query({token: 'foobar1', symbol: 'GME'})
      .replyWithFile(200, __dirname + '/fixtures/stonks-gme.json');
    nock('https://finnhub.io')
      .get('/api/v1/stock/profile2')
      .query({token: 'foobar1', symbol: 'GME'})
      .replyWithFile(200, __dirname + '/fixtures/company_profile2_gme.json');
  });

  context('stock price tests', function () {
    beforeEach(function () {
      process.env.HUBOT_LOG_LEVEL = 'error';
      process.env.HUBOT_FINNHUB_API_KEY = 'foobar1';
      process.env.HUBOT_MEMESTONKS = 'amc';
      room = helper.createRoom();
      nock.disableNetConnect();
      this.robot = {
        respond: sinon.spy(),
        hear: sinon.spy()
      };
    });

    afterEach(function () {
      room.destroy();
      nock.cleanAll();
      delete process.env.HUBOT_LOG_LEVEL;
      delete process.env.HUBOT_FINNHUB_API_KEY;
      delete process.env.HUBOT_MEMESTONKS;
    });

    it('responds with a stonk price (rich formatting)', function (done) {
      room.user.say('alice', '@hubot stonks cat');
      return setTimeout(function () {
        try {
          expect(room.messages).to.eql([
            ['alice', '@hubot stonks cat'],
            ['hubot', ':stonks-down: CAT (Caterpillar Inc) $218.82  ($-3.000 -1.352%)']
          ]);
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });

    it('responds with diamond hands when more than 15% gain', function (done) {
      room.user.say('alice', '@hubot stonks gme');
      return setTimeout(function () {
        try {
          expect(room.messages).to.eql([
            ['alice', '@hubot stonks gme'],
            ['hubot', ':stonks: GME (GameStop Corp) $191.495  ($+82.765 +76.120%)\n :gem: :raised_hands: :rocket: :rocket: :rocket: :moon:']
          ]);
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });

    it('handles doge as symbol for doge-usd (rich formatting)', function (done) {
      room.user.say('alice', '@hubot stonks doge');
      return setTimeout(function () {
        try {
          expect(room.messages).to.eql([
            ['alice', '@hubot stonks doge'],
            ['hubot', ':doge: :stonks-down: DOGE-USD $218.82 ($-3.000 -1.352%)']
          ]);
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });

    it('displays memestonks (rich formatting)', function (done) {
      room.user.say('alice', '@hubot memestonks');
      return setTimeout(function () {
        try {
          expect(room.messages).to.eql([
            ['alice', '@hubot memestonks'],
            ['hubot', ':wsb:'],
            ['hubot', ':stonks-down: AMC (AMC Entertainment Holdings Inc) $7.93  ($-0.360 -4.343%)']
          ]);
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });

    it('displays memestonks with a diff env var (rich formatting)', function (done) {
    room.user.say('alice', '@hubot memestonks');
      return setTimeout(function () {
        try {
          expect(room.messages).to.eql([
            ['alice', '@hubot memestonks'],
            ['hubot', ':wsb:'],
            ['hubot', ':stonks-down: AMC (AMC Entertainment Holdings Inc) $7.93  ($-0.360 -4.343%)']
          ]);
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });
  });
});
