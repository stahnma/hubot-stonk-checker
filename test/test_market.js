var Helper = require('./helper');
var chai = require('chai');
var nock = require('nock').default;
var expect = chai.expect;

function mockQuote(symbol, fixture) {
  var scope = nock('https://finnhub.io')
    .get('/api/v1/quote')
    .query({
      token: 'foobar1',
      symbol: symbol
    });
  if(fixture)
    return scope.replyWithFile(200, __dirname + '/fixtures/' + fixture);
  return scope.reply(200, '{"c":0,"d":null,"dp":null,"h":0,"l":0,"o":0,"pc":0,"t":0}');
}

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

describe('hubot-stonk-checker market overview', function () {
  var room = null;

  afterEach(function () {
    room.destroy();
    nock.cleanAll();
    delete process.env.HUBOT_LOG_LEVEL;
    delete process.env.HUBOT_FINNHUB_API_KEY;
    delete process.env.HUBOT_MARKET_SYMBOLS;
  });

  context('plain text', function () {
    beforeEach(async function () {
      process.env.HUBOT_LOG_LEVEL = 'silent';
      process.env.HUBOT_FINNHUB_API_KEY = 'foobar1';
      room = await new Helper(['../src/stonks.js']).createRoom();
      nock.disableNetConnect();
      mockQuote('SPY', 'stonks-spy.json');
      mockQuote('DIA', 'stonks-dia.json');
      mockQuote('QQQ', 'stonks-qqq.json');
    });

    var expected = 'Market today:\n' +
      'S&P 500 (SPY) $581.77 (+$5.07 +0.88%)\n' +
      'Dow Jones (DIA) $421.30 (-$2.65 -0.63%)\n' +
      'Nasdaq-100 (QQQ) $512.40 (+$6.30 +1.24%)';

    it('shows the market with `market`', async function () {
      await room.user.say('alice', '@hubot market');
      await wait(100);
      expect(room.messages).to.eql([
        ['alice', '@hubot market'],
        ['hubot', expected]
      ]);
    });

    it('shows the market with `stonks market` and does not treat it as a symbol', async function () {
      await room.user.say('alice', '@hubot stonks market');
      await wait(100);
      expect(room.messages).to.eql([
        ['alice', '@hubot stonks market'],
        ['hubot', expected]
      ]);
    });
  });

  context('custom symbols and missing data', function () {
    beforeEach(async function () {
      process.env.HUBOT_LOG_LEVEL = 'silent';
      process.env.HUBOT_FINNHUB_API_KEY = 'foobar1';
      process.env.HUBOT_MARKET_SYMBOLS = 'SPY:S&P 500,iwm';
      room = await new Helper(['../src/stonks.js']).createRoom();
      nock.disableNetConnect();
      mockQuote('SPY', 'stonks-spy.json');
      mockQuote('IWM', null);
    });

    it('uses HUBOT_MARKET_SYMBOLS and flags unavailable quotes', async function () {
      await room.user.say('alice', '@hubot market');
      await wait(100);
      expect(room.messages).to.eql([
        ['alice', '@hubot market'],
        ['hubot', 'Market today:\nS&P 500 (SPY) $581.77 (+$5.07 +0.88%)\nIWM unavailable']
      ]);
    });
  });

  context('slack', function () {
    beforeEach(async function () {
      process.env.HUBOT_LOG_LEVEL = 'silent';
      process.env.HUBOT_FINNHUB_API_KEY = 'foobar1';
      room = await new Helper(['../src/stonks.js'], {
        adapterName: 'Slack'
      }).createRoom();
      nock.disableNetConnect();
      mockQuote('SPY', 'stonks-spy.json');
      mockQuote('DIA', 'stonks-dia.json');
      mockQuote('QQQ', 'stonks-qqq.json');
    });

    it('adds links and up/down emoji', async function () {
      await room.user.say('alice', '@hubot market');
      await wait(100);
      expect(room.messages).to.eql([
        ['alice', '@hubot market'],
        ['hubot', {
          text: 'Market today:\n' +
            ':stonks: S&P 500 (<https://finance.yahoo.com/quote/SPY|SPY>) $581.77 (+$5.07 +0.88%)\n' +
            ':stonks-down: Dow Jones (<https://finance.yahoo.com/quote/DIA|DIA>) $421.30 (-$2.65 -0.63%)\n' +
            ':stonks: Nasdaq-100 (<https://finance.yahoo.com/quote/QQQ|QQQ>) $512.40 (+$6.30 +1.24%)',
          unfurl_links: false,
          unfurl_media: false
        }]
      ]);
    });
  });
});
