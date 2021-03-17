var Helper = require('hubot-test-helper');
var chai = require('chai');
var nock = require('nock');
var sinon = require('sinon');
chai.use(require('sinon-chai'));
var expect = chai.expect;
var helper = new Helper(['../src/stonks.js']);

describe('hubot-stonk-checker (plain text)', function () {
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
      .replyWithFile(200, __dirname + '/fixtures/stonks-doge-usd.json');
    nock('https://finnhub.io')
      .get('/api/v1/stock/profile2')
      .query({token: 'foobar1', symbol: 'DOGE-USD'})
      .reply(200, "{}");
    nock('https://finnhub.io')
      .get('/api/v1/quote')
      .query({token: 'foobar1', symbol: 'BTC-USD'})
      .replyWithFile(200, __dirname + '/fixtures/stonks-btc-usd.json');
    nock('https://finnhub.io')
      .get('/api/v1/stock/profile2')
      .query({token: 'foobar1', symbol: 'BTC-USD'})
      .reply(200, "{}");
    nock('https://finnhub.io')
      .get('/api/v1/quote')
      .query({token: 'foobar1', symbol: 'XRP-USD'})
      .replyWithFile(200, __dirname + '/fixtures/stonks-xrp-usd.json');
    nock('https://finnhub.io')
      .get('/api/v1/stock/profile2')
      .query({token: 'foobar1', symbol: 'XRP-USD'})
      .reply(200, "{}");
    nock('https://finnhub.io')
      .get('/api/v1/quote')
      .query({token: 'foobar1', symbol: 'AJAJAJ'})
      .replyWithFile(404, __dirname + '/fixtures/stonks-notfound.json');
    nock('https://finnhub.io')
      .get('/api/v1/stock/profile2')
      .query({token: 'foobar1', symbol: 'AJAJAJ'})
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
      .query({token: '', symbol: 'CAT'})
      .replyWithFile(401, __dirname + '/fixtures/stonks-missing-api-key.json');
    nock('https://finnhub.io')
      .get('/api/v1/quote')
      .query({token: '', symbol: 'CAT'})
      .replyWithFile(401, __dirname + '/fixtures/stonks-missing-api-key.json');
    nock('https://finnhub.io')
      .get('/api/v1/stock/profile2')
      .query({token: '', symbol: 'CAT'})
      .replyWithFile(401, __dirname + '/fixtures/stonks-missing-api-key.json');
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

    it('responds with a stonk price', function (done) {
      room.user.say('alice', '@hubot stonks cat');
      return setTimeout(function () {
        try {
          expect(room.messages).to.eql([
            ['alice', '@hubot stonks cat'],
            ['hubot', 'CAT (Caterpillar Inc) $218.82  ($-3.000 -1.352%)']
          ]);
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });

    it('handles doge as symbol for doge-usd', function (done) {
      room.user.say('alice', '@hubot stonks doge');
      return setTimeout(function () {
        try {
          expect(room.messages).to.eql([
            ['alice', '@hubot stonks doge'],
            ['hubot', 'DOGE-USD $0.056976184 ($-0.001 -1.721%)']
          ]);
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });

    it('handles btc as symbol for btc-usd', function (done) {
      room.user.say('alice', '@hubot stonks btc');
      return setTimeout(function () {
        try {
          expect(room.messages).to.eql([
            ['alice', '@hubot stonks btc'],
            ['hubot', 'BTC-USD $55013.98 ($-736.440 -1.321%)']
          ]);
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });

    it('handles xrp as symbol for xrp-usd', function (done) {
      room.user.say('alice', '@hubot stonks xrp');
      return setTimeout(function () {
        try {
          expect(room.messages).to.eql([
            ['alice', '@hubot stonks xrp'],
            ['hubot', 'XRP-USD $0.46506116 ($0.000 0.000%)']
          ]);
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });

    it('lets you know when a symbol is not found', function (done) {
      room.user.say('alice', '@hubot stonks ajajaj');
      return setTimeout(function () {
        try {
          expect(room.messages).to.eql([
            ['alice', '@hubot stonks ajajaj'],
            ['hubot', 'AJAJAJ ticker symbol not found.']
          ]);
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });

    it('displays memestonks', function (done) {
      room.user.say('alice', '@hubot memestonks');
      return setTimeout(function () {
        try {
          expect(room.messages).to.eql([
            ['alice', '@hubot memestonks'],
            ['hubot', 'AMC (AMC Entertainment Holdings Inc) $7.93  ($-0.360 -4.343%)']
          ]);
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });
  });

  context('special stock test', function () {
    beforeEach(function () {
      process.env.HUBOT_LOG_LEVEL = 'error';
      process.env.HUBOT_FINNHUB_API_KEY = 'foobar1';
      process.env.HUBOT_MEMESTONKS = 'amc';
      process.env.HUBOT_SPECIAL_STONKS = 'cat';
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
      delete process.env.HUBOT_SPECIAL_STONKS;
    });

    it('responds with a stonk price for HUBOT_SPECIAL_STONKS', function (done) {
      room.user.say('alice', '@hubot cat');
      return setTimeout(function () {
        try {
          expect(room.messages).to.eql([
            ['alice', '@hubot cat'],
            ['hubot', 'CAT (Caterpillar Inc) $218.82  ($-3.000 -1.352%)']
          ]);
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });
  });

  context('stock price test missing API key', function () {
    beforeEach(function () {
      process.env.HUBOT_LOG_LEVEL = 'error';
      delete process.env.HUBOT_FINNHUB_API_KEY;
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
    });
  
    it('responds with an error message', function (done) {
      room.user.say('alice', '@hubot stonks cat');
      return setTimeout(function () {
        try {
          expect(room.messages).to.eql([
            ['alice', '@hubot stonks cat'],
            ['hubot', 'Error! Make sure you have set HUBOT_FINNHUB_API_KEY.']
          ]);
          done();
        } catch (err) {
          done(err);
        }
      }, 100);
    });
  });
});
