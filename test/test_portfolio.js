var Helper = require('./helper');
var chai = require('chai');
var nock = require('nock');
var expect = chai.expect;
var helper = new Helper(['../src/stonks.js']);

describe('hubot-stonk-checker portfolio', function () {
  var room = null;

  function mock(path, symbol, fixture) {
    var scope = nock('https://finnhub.io')
      .persist()
      .get(path)
      .query({
        token: 'foobar1',
        symbol: symbol
      });
    if(fixture)
      scope.replyWithFile(200, __dirname + '/fixtures/' + fixture);
    else
      scope.reply(200, '{}');
  }

  beforeEach(async function () {
    process.env.HUBOT_LOG_LEVEL = 'silent';
    process.env.HUBOT_FINNHUB_API_KEY = 'foobar1';
    nock.disableNetConnect();
    mock('/api/v1/quote', 'CAT', 'stonks-cat.json');
    mock('/api/v1/stock/profile2', 'CAT', 'company_profile2_cat.json');
    mock('/api/v1/quote', 'AMC', 'stonks-amc.json');
    mock('/api/v1/stock/profile2', 'AMC', 'company_profile2_amc.json');
    mock('/api/v1/quote', 'DOGE-USD', 'stonks-doge-usd.json');
    mock('/api/v1/stock/profile2', 'DOGE-USD');
    mock('/api/v1/quote', 'AJAJAJ', 'stonks-notfound.json');
    room = await helper.createRoom();
  });

  afterEach(function () {
    room.destroy();
    nock.cleanAll();
    nock.enableNetConnect();
    delete process.env.HUBOT_LOG_LEVEL;
    delete process.env.HUBOT_FINNHUB_API_KEY;
  });

  it('tells you when your portfolio is empty', async function () {
    await room.user.say('alice', '@hubot stonk portfolio');
    expect(room.messages).to.eql([
      ['alice', '@hubot stonk portfolio'],
      ['hubot', 'Your portfolio is empty. Add to it with `hubot stonk portfolio add <symbol> [shares]`.']
    ]);
  });

  it('adds stocks and shows them with a total value', async function () {
    await room.user.say('alice', '@hubot stonk portfolio add cat 10');
    await room.user.say('alice', '@hubot stocks portfolio add amc');
    await room.user.say('alice', '@hubot stonks portfolio');
    expect(room.messages).to.eql([
      ['alice', '@hubot stonk portfolio add cat 10'],
      ['hubot', 'Added CAT to your portfolio (10 shares).'],
      ['alice', '@hubot stocks portfolio add amc'],
      ['hubot', 'Added AMC to your portfolio.'],
      ['alice', '@hubot stonks portfolio'],
      ['hubot', 'AMC (AMC Entertainment Holdings Inc) $7.93  ($-0.360 -4.343%)'],
      ['hubot', 'CAT (Caterpillar Inc) $218.82  ($-3.000 -1.352%)'],
      ['hubot', 'Portfolio value: $2,188.20 (-$30.00 -1.352% today)']
    ]);
  });

  it('applies the crypto shorthand and supports "my stonks"', async function () {
    await room.user.say('alice', '@hubot stonk portfolio add doge 1000.5');
    await room.user.say('alice', '@hubot my stonks');
    expect(room.messages.slice(1)).to.eql([
      ['hubot', 'Added DOGE-USD to your portfolio (1000.5 shares).'],
      ['alice', '@hubot my stonks'],
      ['hubot', 'DOGE-USD $0.056976184 ($-0.001 -1.721%)'],
      ['hubot', 'Portfolio value: $57.00 (-$1.12 -1.919% today)']
    ]);
  });

  it('omits the total when no share counts are set', async function () {
    await room.user.say('alice', '@hubot stonk portfolio add cat');
    await room.user.say('alice', '@hubot stonk portfolio');
    expect(room.messages.slice(3)).to.eql([
      ['hubot', 'CAT (Caterpillar Inc) $218.82  ($-3.000 -1.352%)']
    ]);
  });

  it('updates the share count when a stock is added again', async function () {
    await room.user.say('alice', '@hubot stonk portfolio add cat 10');
    await room.user.say('alice', '@hubot stonk portfolio add cat 1');
    expect(room.messages[3]).to.eql(['hubot', 'Added CAT to your portfolio (1 share).']);
    expect(room.robot.brain.get('stonkPortfolios')).to.eql({
      alice: {
        CAT: {
          shares: 1
        }
      }
    });
  });

  it('refuses to add unknown symbols', async function () {
    await room.user.say('alice', '@hubot stonk portfolio add ajajaj 5');
    expect(room.messages[1]).to.eql(['hubot', 'AJAJAJ ticker symbol not found.']);
    expect(room.robot.brain.get('stonkPortfolios')).to.equal(null);
  });

  it('removes stocks', async function () {
    await room.user.say('alice', '@hubot stonk portfolio add cat 10');
    await room.user.say('alice', '@hubot stonk portfolio remove cat');
    await room.user.say('alice', '@hubot stonk portfolio rm cat');
    expect(room.messages.slice(2)).to.eql([
      ['alice', '@hubot stonk portfolio remove cat'],
      ['hubot', 'Removed CAT from your portfolio.'],
      ['alice', '@hubot stonk portfolio rm cat'],
      ['hubot', 'CAT is not in your portfolio.']
    ]);
    expect(room.robot.brain.get('stonkPortfolios')).to.eql({});
  });

  it('keeps a separate portfolio per user', async function () {
    await room.user.say('alice', '@hubot stonk portfolio add cat 10');
    await room.user.say('bob', '@hubot stonk portfolio');
    expect(room.messages[3]).to.eql(['hubot',
      'Your portfolio is empty. Add to it with `hubot stonk portfolio add <symbol> [shares]`.'
    ]);
  });
});
