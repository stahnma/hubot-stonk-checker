# Description:
#   Get the latest stock prices
#
# Dependencies:
#   Emoji for :stonks:, :doge:, :stonks-down:, :wsb:, :wsb-fire:
#
# Configuration:
#   HUBOT_FINNHUB_API_KEY from finntech.io
#   HUBOT_MEMESTONKS optional comma seperated list of stocks to check with
#     memestonk commands
#
# Commands:
#   hubot stonk <symbol>
#   hubot stock <symbol>
#   hubot memestonks
#
module.exports = (robot) ->

  apiKey = process.env.HUBOT_FINNHUB_API_KEY
  memeset = process.env.HUBOT_MEMESTONKS

  if apiKey == undefined
    robot.logger.error "Must set HUBOT_FINNHUB_API_KEY for hubot-stonk-checker to work."
    return false

  if memeset == undefined
    def_meme_set = "AMC,BB,BBBY,DOGE-USD,GME"
    memeset = def_meme_set.split(',')
  else
    memeset = memeset.split(',')

  robot.respond /sto[c|n]ks? ([-\@\w.]{1,11}?\S$)/i, (msg) ->
    symbol = msg.match[1]
    getStockData symbol, msg

  robot.respond /memestonks?\S$$/i, (msg) ->
    msg.send(":wsb:")
    for i in memeset
      getStockData i, msg

  getStockData = (symbol, msg) ->
    url = 'https://finnhub.io/api/v1/quote'
    url += "?token=#{apiKey}"
    if symbol == 'doge'
        symbol = 'doge-usd'
    symbol = symbol.toUpperCase()
    url += "&symbol=#{symbol.toUpperCase()}"
    msg.http(url)
      .get() (err,res,body) ->
        result = JSON.parse(body)
        robot.logger.debug body
        # Body returns
        # { c: 256.89, h: 296, l: 252.01, o: 282, pc: 193.6, t: 1611878400 }
        delta = parseFloat(result.c - result.pc).toFixed(3)
        if delta > 0.0
            printdelta = "+#{delta}"
        else
            printdelta = "#{delta}"
        perc = parseFloat(delta / result.pc * 100).toFixed(3)
        if perc > 0.0
            printperc = "+#{perc}%"
        else
            printperc = "#{perc}%"
        message = "#{symbol} $#{result.c}  ($#{printdelta} #{printperc})"
        if delta > 0.0
            message = ":stonks: " + message
        if delta < 0.0
            message = ":stonks-down: " + message
        if delta == 0.0
            message = message
        if symbol == 'DOGE-USD'
            message = ":doge: " + message
        if perc > 15.00
            message = message + "\n :gem: :raised_hands: :rocket: :rocket: :rocket: :moon:"
        if result.pc == 0
            message = "#{symbol} ticker symbol not found."
        msg.send(message)
