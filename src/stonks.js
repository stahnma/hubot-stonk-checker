// Description:
//   Get the latest stock prices
//
// Dependencies:
//   Emoji for :stonks:, :doge:, :stonks-down:, :wsb:, :wsb-fire:
//
// Configuration:
//  HUBOT_FINNHUB_API_KEY from finntech.io
//  HUBOT_MEMESTONKS optional comma seperated list of stocks to check with
//     memestonk commands
//  HUBOT_SPECIAL_STONKS optional comma seperated list of stock that will not
//     need the `hubot stock` anchor, but just reply with `hubot symbol`.
//     .e.g `hubot cat` gives Caterpillar stock.
//
// Commands:
//   hubot stonk <symbol>
//   hubot stock <symbol>
//   hubot memestonks

/*jshint esversion: 6 */

module.exports = function (robot) {
  const apiKey = process.env.HUBOT_FINNHUB_API_KEY;
  let memeset = process.env.HUBOT_MEMESTONKS;
  let special_stonks = process.env.HUBOT_SPECIAL_STONKS;
  const defaultMemeSet = 'AMC,BB,BBBY,DOGE-USD,GME';
  const defaultSpecialStonks = '';
  let richtext = false;
  const quoteBaseUrl = 'https://finnhub.io/api/v1/quote';
  const companyBaseUrl = 'https://finnhub.io/api/v1/stock/profile2';

  if (typeof apiKey === 'undefined' || apiKey === null) {
    robot.logger
      .error('Must set HUBOT_FINNHUB_API_KEY for hubot-stonk-checker to work.');
  }

  if (typeof memeset === "undefined" || memeset === null)
    memeset = defaultMemeSet.split(',');
  else
    memeset = memeset.split(',');

  if (robot.adapterName === 'slack')
    richtext = true;

  if (typeof special_stonks !== 'undefined' && special_stonks !== null) {
    special_stonks = special_stonks.split(',');
    special_stonks.forEach((symbol) => {
      re = new RegExp(symbol + '$', 'i');
      robot.logger.debug('Loading special stonk symbol ' + symbol);
      robot.respond(re, (msg) => {
        getStockData(symbol, msg, robot);
      });
    });
  }

  robot.respond(/sto[c|n]ks? ([-\@\w.]{1,11}?\S$)/i, (msg) => {
    symbol = msg.match[1];
    getStockData(symbol, msg, robot);
  });

  robot.respond(/company ([-\@\w.]{1,11}?\S$)/i, (msg) => {
    symbol = msg.match[1];
    getStockData(symbol, msg, robot);
  });

  robot.respond(/memestonks?\S$$/i, (msg) => {
    if (richtext) {
      msg.send(':wsb:');
    }
    memeset.forEach((symbol) => {
      getStockData(symbol, msg, robot);
    });
  });

  function formatSymbol(symbol) {
    symbol = symbol.toUpperCase();
    // If it's a common crypto currency abbreviation, help the user out.
    if (['DOGE', 'BTC', 'XRP', 'ETH'].includes(symbol)) {
      symbol += '-USD';
    }
    return symbol;
  }

  function getStockData(symbol, msg, robot) {
    symbol = formatSymbol(symbol);
    msg.http(companyBaseUrl)
      .query({
        token: apiKey,
        symbol: symbol
      })
      .get()((err, res, body) => {
        if (err) {
          robot.logger.error(err);
          msg.send('Encountered an error: ' + err.toString());
          return;
        }
        data = JSON.parse(body);
        if (data && typeof data.error !== 'undefined') {
          robot.logger.error(data);
          msg.send('Error! Make sure you have set HUBOT_FINNHUB_API_KEY.');
          return;
        }
        robot.logger.debug('Url being called in getStockData is', res.req.path);
        getStockQuote(symbol, msg, robot, data);
      });
  }

  function getStockQuote(symbol, msg, robot, companyData) {
    symbol = formatSymbol(symbol);
    msg.http(quoteBaseUrl)
      .query({
        token: apiKey,
        symbol: symbol
      })
      .get()(function (err, res, body) {
        robot.logger.debug('Url being called in getStockQuote is', res.req.path);
        var printperc, delta, printdelta, message;
        if (err) {
          robot.logger.error(err);
          msg.send('Encountered an error: ' + err.toString());
          return;
        }
        result = JSON.parse(body);
        robot.logger.debug('Body from url:', body);
        // Body returns
        // { c: 256.89, h: 296, l: 252.01, o: 282, pc: 193.6, t: 1611878400 }
        delta = parseFloat(result.c - result.pc).toFixed(3);
        printdelta = delta;
        if (delta > 0.0) {
          printdelta = '+' + delta;
        }
        else {
          printdelta = delta;
        }
        perc = parseFloat(delta / result.pc * 100).toFixed(3);
        if (perc > 0.0)
          printperc = '+' + perc + '%';
        else
          printperc = perc + '%';

        // Currencies do not have companyData
        message = symbol + ' $' + result.c + ' ($' + printdelta + ' ' + printperc + ')';
        if (companyData && typeof companyData.name !== 'undefined' && companyData.name !== null) {
          message = symbol + ' (' + companyData.name + ') ' + '$' + result.c + '  ($' + printdelta + ' ' + printperc + ')';
        }
        if (richtext) {
          if (delta > 0.0)
            message = ':stonks: ' + message;
          if (delta < 0.0)
            message = ':stonks-down: ' + message;
          if (delta == 0.0)
            message = message;
          if (symbol == 'DOGE-USD') {
            message = ':doge: ' + message;
          }
          if (perc > 15.00)
            message = message + '\n :gem: :raised_hands: :rocket: :rocket: :rocket: :moon:';
        }
        if (result.pc == 0)
          message = symbol + ' ticker symbol not found.';
        msg.send(message);
      });
  }
};
