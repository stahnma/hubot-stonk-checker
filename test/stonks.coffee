Helper = require('hubot-test-helper')
chai = require 'chai'
nock = require 'nock'

expect = chai.expect

helper = new Helper [
  '../src/stonks.coffee'
]

# Alter time as test runs
originalDateNow = Date.now
mockDateNow = () ->
  return Date.parse('Tue Mar 30 2018 14:10:00 GMT-0500 (CDT)')

describe 'hubot-stonks', ->
  beforeEach ->
    process.env.HUBOT_LOG_LEVEL='error'
    process.env.HUBOT_FINNHUB_API_KEY='foobar1'
    Date.now = mockDateNow
    nock.disableNetConnect()
    @room = helper.createRoom()

  afterEach ->
    delete process.env.HUBOT_LOG_LEVEL
    delete process.env.HUBOT_FINNHUB_API_KEY
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
          ['hubot', ':stonks-down: CAT $218.82  ($-3.000 -1.352%)']
        ]
        done()
      catch err
        done err
      return
    , 1000)
