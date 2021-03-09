Helper = require('hubot-test-helper')
chai = require 'chai'
nock = require 'nock'

expect = chai.expect

helper = new Helper [
  '../src/stonks.js'
]

# Alter time as test runs
originalDateNow = Date.now
mockDateNow = () ->
  return Date.parse('Tue Mar 30 2018 14:10:00 GMT-0500 (CDT)')

describe 'hubot-stonk-checker (plain text)', ->
  beforeEach ->
    process.env.HUBOT_LOG_LEVEL='error'
    process.env.HUBOT_FINNHUB_API_KEY='foobar1'
    process.env.HUBOT_MEMESTONKS='amc'
    Date.now = mockDateNow
    nock.disableNetConnect()
    @room = helper.createRoom()

  afterEach ->
    delete process.env.HUBOT_LOG_LEVEL
    delete process.env.HUBOT_FINNHUB_API_KEY
    delete process.env.HUBOT_MEMESTONKS
    Date.now = originalDateNow
    nock.cleanAll()
    @room.destroy()

  # hubot stonks
  it 'responds with a stonk price', (done) ->
    nock('https://finnhub.io')
      .get('/api/v1/quote')
      .query(true)
      .replyWithFile(200, __dirname + '/fixtures/stonks-cat.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot stonks cat')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot stonks cat'],
          ['hubot', 'CAT $218.82  ($-3.000 -1.352%)']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot stonks
  it 'handles doge as symbol for doge-usd', (done) ->
    nock('https://finnhub.io')
      .get('/api/v1/quote')
      .query(true)
      .replyWithFile(200, __dirname + '/fixtures/stonks-cat.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot stonks doge')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot stonks doge'],
          ['hubot', 'DOGE-USD $218.82  ($-3.000 -1.352%)']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot stonks
  it 'handles btc as symbol for btc-usd', (done) ->
    nock('https://finnhub.io')
      .get('/api/v1/quote')
      .query(true)
      .replyWithFile(200, __dirname + '/fixtures/stonks-cat.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot stonks btc')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot stonks btc'],
          ['hubot', 'BTC-USD $218.82  ($-3.000 -1.352%)']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot stonks
  it 'lets you know when a symbol is not found', (done) ->
    nock('https://finnhub.io')
      .get('/api/v1/quote')
      .query(true)
      .replyWithFile(200, __dirname + '/fixtures/stonks-notfound.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot stonks ajajaj')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot stonks ajajaj'],
          ['hubot', 'AJAJAJ ticker symbol not found.']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot stonks
  it 'displays memestonks', (done) ->
    nock('https://finnhub.io')
      .get('/api/v1/quote')
      .query(true)
      .replyWithFile(200, __dirname + '/fixtures/stonks-cat.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot memestonks')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot memestonks'],
          ['hubot', 'AMC $218.82  ($-3.000 -1.352%)']

        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot stonks
  it 'displays memestonks with a diff env var', (done) ->
    nock('https://finnhub.io')
      .get('/api/v1/quote')
      .query(true)
      .replyWithFile(200, __dirname + '/fixtures/stonks-amc.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot memestonks')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot memestonks'],
          ['hubot', 'AMC $7.93  ($-0.360 -4.343%)']

        ]
        done()
      catch err
        done err
      return
    , 1000)
