# Description:
#   Get the latest stock prices
#
# Dependencies:
#   Emoji for :stonks:, :doge:, :stonks-down:, :wsb:, :wsb-fire:
#
# Configuration:
#   HUBOT_FINNHUB_API_KEY from finntech.io
#
# Commands:
#   hubot stonk <symbol>
#   hubot memestonks

module.exports = (robot) ->
  apiKey = process.env.HUBOT_FINNHUB_API_KEY

  robot.respond /sto[c|n]ks? ([-\@\w.]{1,11}?\S$)/i, (msg) ->
    symbol = msg.match[1]
    getStockData symbol, msg

  robot.respond /memestonks?\S$$/i, (msg) ->
    console.log 'the meeeeeemeees'
    msg.send(":wsb:")
    getStockData 'AMC', msg
    getStockData 'BB', msg
    getStockData 'BBBY', msg
    getStockData 'GME', msg
    getStockData 'DOGE-USD', msg

  getStockData = (symbol, msg) ->
    url = 'https://finnhub.io/api/v1/quote?'
    url += "&token=#{apiKey}"
    if symbol == 'doge'
        symbol = 'doge-usd'
    symbol = symbol.toUpperCase()
    url += "&symbol=#{symbol.toUpperCase()}"
    msg.http(url)
      .get() (err,res,body) ->
        result = JSON.parse(body)
        # Body returns
        # { c: 256.89, h: 296, l: 252.01, o: 282, pc: 193.6, t: 1611878400 }
        #console.log(result)
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
