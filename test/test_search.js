var Helper = require('./helper');
var chai = require('chai');
var nock = require('nock');
var expect = chai.expect;
var helper = new Helper(['../src/stonks.js']);

describe('hubot-stonk-checker symbol search', function () {
  var room = null;

  function mockSearch(token, q, status, fixture) {
    nock('https://finnhub.io')
      .get('/api/v1/search')
      .query({
        token: token,
        q: q
      })
      .replyWithFile(status, __dirname + '/fixtures/' + fixture);
  }

  beforeEach(async function () {
    process.env.HUBOT_LOG_LEVEL = 'silent';
    process.env.HUBOT_FINNHUB_API_KEY = 'foobar1';
    nock.disableNetConnect();
    room = await helper.createRoom();
  });

  afterEach(function () {
    room.destroy();
    nock.cleanAll();
    delete process.env.HUBOT_LOG_LEVEL;
    delete process.env.HUBOT_FINNHUB_API_KEY;
  });

  it('lists symbols matching a query', async function () {
    mockSearch('foobar1', 'apple', 200, 'search-apple.json');
    await room.user.say('alice', '@hubot stonk search apple');
    expect(room.messages).to.eql([
      ['alice', '@hubot stonk search apple'],
      ['hubot', 'Symbols matching "apple":\n' +
        'AAPL - APPLE INC (Common Stock)\n' +
        'APLE - APPLE HOSPITALITY REIT INC (Common Stock)\n' +
        'AAPL.SW - APPLE INC (Common Stock)\n' +
        'APLD - APPLIED DIGITAL CORP'
      ]
    ]);
  });

  it('supports multi-word queries and the lookup alias', async function () {
    mockSearch('foobar1', 'apple hospitality', 200, 'search-apple.json');
    await room.user.say('alice', '@hubot stock lookup apple hospitality');
    expect(room.messages[1][1]).to.match(/^Symbols matching "apple hospitality":\nAAPL - APPLE INC/);
  });

  it('limits the number of results shown', async function () {
    mockSearch('foobar1', 'sym', 200, 'search-many.json');
    await room.user.say('alice', '@hubot stonks search sym');
    var lines = room.messages[1][1].split('\n');
    expect(lines[0]).to.eql('Top 10 of 12 symbols matching "sym":');
    expect(lines).to.have.length(11);
    expect(lines[10]).to.eql('SYM9 - COMPANY 9 (Common Stock)');
  });

  it('says when nothing matches', async function () {
    mockSearch('foobar1', 'zzzzzz', 200, 'search-empty.json');
    await room.user.say('alice', '@hubot stonk search zzzzzz');
    expect(room.messages).to.eql([
      ['alice', '@hubot stonk search zzzzzz'],
      ['hubot', 'No symbols found matching "zzzzzz".']
    ]);
  });

  it('reports an API key error', async function () {
    mockSearch('foobar1', 'apple', 401, 'stonks-missing-api-key.json');
    await room.user.say('alice', '@hubot stonk search apple');
    expect(room.messages[1]).to.eql(['hubot', 'Error! Make sure you have set HUBOT_FINNHUB_API_KEY.']);
  });
});
