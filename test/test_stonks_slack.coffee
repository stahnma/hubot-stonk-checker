Helper = require('hubot-test-helper')
chai = require 'chai'
nock = require 'nock'

expect = chai.expect

helper = new Helper [
  'adapters/slack.coffee',
  '../src/stonks.js'
]

# Alter time as test runs
originalDateNow = Date.now
mockDateNow = () ->
  return Date.parse('Tue Mar 30 2018 14:10:00 GMT-0500 (CDT)')

describe 'hubot-stonk-checker (rich formatting)', ->
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
  it 'responds with a stonk price (rich formatting)', (done) ->
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
          ['hubot', ':stonks-down: CAT $218.82  ($-3.000 -1.352%)']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot stonks
  it 'responds with diamond hands when more than 15% gain', (done) ->
    nock('https://finnhub.io')
      .get('/api/v1/quote')
      .query(true)
      .replyWithFile(200, __dirname + '/fixtures/stonks-gme.json')

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot stonks gme')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot stonks gme'],
          ['hubot', ':stonks: GME $191.495  ($+82.765 +76.120%)\n :gem: :raised_hands: :rocket: :rocket: :rocket: :moon:']

        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot stonks
  it 'handles doge as symbol for doge-usd (rich formatting)', (done) ->
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
          ['hubot', ':doge: :stonks-down: DOGE-USD $218.82  ($-3.000 -1.352%)']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot stonks
  it 'displays memestonks (rich formatting)', (done) ->
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
          ['hubot', ':wsb:']
          ['hubot', ':stonks-down: AMC $218.82  ($-3.000 -1.352%)']

        ]
        done()
      catch err
        done err
      return
    , 1000)

  # hubot stonks
  it 'displays memestonks with a diff env var (rich formatting)', (done) ->
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
          ['hubot', ':wsb:']
          ['hubot', ':stonks-down: AMC $7.93  ($-0.360 -4.343%)']

        ]
        done()
      catch err
        done err
      return
    , 1000)
