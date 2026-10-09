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
//   hubot stonk search <query> - find ticker symbols matching a company name
//   hubot stonk portfolio - show the stocks in your portfolio (alias: hubot my stonks)
//   hubot stonk portfolio add <symbol> [shares] - add a stock to your portfolio
//   hubot stonk portfolio remove <symbol> - remove a stock from your portfolio

/*jshint esversion: 11, node: true */
/* globals fetch, URLSearchParams */

module.exports = function (robot) {
  const apiKey = process.env.HUBOT_FINNHUB_API_KEY;
  let memeset = process.env.HUBOT_MEMESTONKS;
  let special_stonks = process.env.HUBOT_SPECIAL_STONKS;
  const defaultMemeSet = 'AMC,BB,BBBY,DOGE-USD,GME';
  let richtext = false;
  const quoteBaseUrl = 'https://finnhub.io/api/v1/quote';
  const companyBaseUrl = 'https://finnhub.io/api/v1/stock/profile2';
  const searchBaseUrl = 'https://finnhub.io/api/v1/search';
  const maxSearchResults = 10;
  const portfolioBrainKey = 'stonkPortfolios';

  if(typeof apiKey === 'undefined' || apiKey === null) {
    robot.logger
      .error('Must set HUBOT_FINNHUB_API_KEY for hubot-stonk-checker to work.');
  }

  if(typeof memeset === "undefined" || memeset === null)
    memeset = defaultMemeSet.split(',');
  else
    memeset = memeset.split(',');

  // Hubot 3 reports the adapter name as given on the command line ("slack"),
  // newer Hubot versions use the adapter's own name (e.g. "Slack" or "SlackBot").
  if(/slack/i.test(robot.adapterName))
    richtext = true;

  if(typeof special_stonks !== 'undefined' && special_stonks !== null) {
    special_stonks = special_stonks.split(',');
    special_stonks.forEach((symbol) => {
      const re = new RegExp(symbol + '$', 'i');
      robot.logger.debug('Loading special stonk symbol ' + symbol);
      robot.respond(re, (msg) => {
        return getStockData(symbol, msg, robot);
      });
    });
  }

  // "portfolio" is a command, not a ticker symbol.
  robot.respond(/sto[c|n]ks? (?!portfolio$)([-\@\w.]{1,11}?\S$)/i, (msg) => {
    return getStockData(msg.match[1], msg, robot);
  });

  robot.respond(/sto[c|n]ks? (?:search|lookup|find) (.+)$/i, (msg) => {
    return searchSymbols(msg.match[1].trim(), msg, robot);
  });

  robot.respond(/(?:sto[cn]ks? portfolio|my sto[cn]ks)$/i, (msg) => {
    return showPortfolio(msg, robot);
  });

  robot.respond(/sto[cn]ks? portfolio add ([-\@\w.]{1,11})(?: (\d+(?:\.\d+)?|\.\d+))?$/i, (msg) => {
    const shares = msg.match[2] ? parseFloat(msg.match[2]) : null;
    return addToPortfolio(msg.match[1], shares, msg, robot);
  });

  robot.respond(/sto[cn]ks? portfolio (?:remove|rm|delete|del) ([-\@\w.]{1,11})$/i, (msg) => {
    return removeFromPortfolio(msg.match[1], msg);
  });

  robot.respond(/company ([-\@\w.]{1,11}?\S$)/i, (msg) => {
    return getStockData(msg.match[1], msg, robot);
  });

  robot.respond(/(?:memestonk|stonk)s?\S$$/i, async (msg) => {
    if(richtext) {
      await msg.send(':wsb:');
    }
    for(const symbol of memeset) {
      await getStockData(symbol, msg, robot);
    }
  });

  function formatSymbol(symbol) {
    symbol = symbol.toUpperCase();
    // If it's a common crypto currency abbreviation, help the user out.
    if(['DOGE', 'BTC', 'XRP', 'ETH', 'HNS'].includes(symbol)) {
      symbol += '-USD';
    }
    return symbol;
  }

  // Portfolios are stored in the brain keyed by user id:
  //   { "<user id>": { "GME": { "shares": 10 }, "AMC": { "shares": null } } }
  function getPortfolio(user) {
    const portfolios = robot.brain.get(portfolioBrainKey) || {};
    return portfolios[user.id] || {};
  }

  function savePortfolio(user, portfolio) {
    const portfolios = robot.brain.get(portfolioBrainKey) || {};
    if(Object.keys(portfolio).length === 0)
      delete portfolios[user.id];
    else
      portfolios[user.id] = portfolio;
    robot.brain.set(portfolioBrainKey, portfolios);
  }

  function formatMoney(amount) {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  async function addToPortfolio(symbol, shares, msg, robot) {
    symbol = formatSymbol(symbol);
    let quote;
    try {
      quote = await finnhub(quoteBaseUrl, {
        symbol: symbol
      });
    } catch(err) {
      robot.logger.error(err);
      return msg.send('Encountered an error: ' + err.toString());
    }
    if(quote && typeof quote.error !== 'undefined') {
      robot.logger.error(quote);
      return msg.send('Error! Make sure you have set HUBOT_FINNHUB_API_KEY.');
    }
    if(!quote || !quote.pc) {
      return msg.send(symbol + ' ticker symbol not found.');
    }
    const portfolio = getPortfolio(msg.message.user);
    portfolio[symbol] = {
      shares: shares
    };
    savePortfolio(msg.message.user, portfolio);
    let reply = 'Added ' + symbol + ' to your portfolio';
    if(shares !== null)
      reply += ' (' + shares + ' ' + (shares === 1 ? 'share' : 'shares') + ')';
    return msg.send(reply + '.');
  }

  function removeFromPortfolio(symbol, msg) {
    symbol = formatSymbol(symbol);
    const portfolio = getPortfolio(msg.message.user);
    if(!(symbol in portfolio)) {
      return msg.send(symbol + ' is not in your portfolio.');
    }
    delete portfolio[symbol];
    savePortfolio(msg.message.user, portfolio);
    return msg.send('Removed ' + symbol + ' from your portfolio.');
  }

  async function showPortfolio(msg, robot) {
    const portfolio = getPortfolio(msg.message.user);
    const symbols = Object.keys(portfolio).sort();
    if(symbols.length === 0) {
      return msg.send('Your portfolio is empty. Add to it with `' + robot.name +
        ' stonk portfolio add <symbol> [shares]`.');
    }
    let value = 0;
    let change = 0;
    let holdings = 0;
    for(const symbol of symbols) {
      const quote = await getStockData(symbol, msg, robot);
      const shares = portfolio[symbol].shares;
      if(quote && shares !== null) {
        value += quote.c * shares;
        change += (quote.c - quote.pc) * shares;
        holdings++;
      }
    }
    if(holdings > 0) {
      const previous = value - change;
      const perc = previous ? (change / previous * 100).toFixed(3) : '0.000';
      const sign = change > 0 ? '+' : (change < 0 ? '-' : '');
      return msg.send('Portfolio value: $' + formatMoney(value) + ' (' + sign + '$' +
        formatMoney(Math.abs(change)) + ' ' + (change > 0 ? '+' : '') + perc + '% today)');
    }
  }

  async function finnhub(url, params) {
    const query = new URLSearchParams(Object.assign({
      token: apiKey || ''
    }, params));
    robot.logger.debug('Url being called is ' + url + ' with ' + JSON.stringify(params));
    const res = await fetch(url + '?' + query.toString());
    return res.json();
  }

  async function searchSymbols(query, msg, robot) {
    let data;
    try {
      data = await finnhub(searchBaseUrl, {
        q: query
      });
    } catch(err) {
      robot.logger.error(err);
      return msg.send('Encountered an error: ' + err.toString());
    }
    if(data && typeof data.error !== 'undefined') {
      robot.logger.error(data);
      return msg.send('Error! Make sure you have set HUBOT_FINNHUB_API_KEY.');
    }
    const results = (data && data.result) || [];
    if(results.length === 0) {
      return msg.send('No symbols found matching "' + query + '".');
    }
    const lines = results.slice(0, maxSearchResults).map((r) => {
      return r.displaySymbol + ' - ' + r.description + (r.type ? ' (' + r.type + ')' : '');
    });
    let header = 'Symbols matching "' + query + '":';
    if(results.length > maxSearchResults) {
      header = 'Top ' + maxSearchResults + ' of ' + results.length + ' symbols matching "' + query + '":';
    }
    return msg.send(header + '\n' + lines.join('\n'));
  }

  async function getStockData(symbol, msg, robot) {
    symbol = formatSymbol(symbol);
    let data;
    try {
      data = await finnhub(companyBaseUrl, {
        symbol: symbol
      });
    } catch(err) {
      robot.logger.error(err);
      return msg.send('Encountered an error: ' + err.toString());
    }
    if(data && typeof data.error !== 'undefined') {
      robot.logger.error(data);
      return msg.send('Error! Make sure you have set HUBOT_FINNHUB_API_KEY.');
    }
    return getStockQuote(symbol, msg, robot, data);
  }

  async function getStockQuote(symbol, msg, robot, companyData) {
    let result, symbolstr, message;
    symbol = formatSymbol(symbol);
    try {
      result = await finnhub(quoteBaseUrl, {
        symbol: symbol
      });
    } catch(err) {
      robot.logger.error(err);
      return msg.send('Encountered an error: ' + err.toString());
    }
    robot.logger.debug('Body from url: ' + JSON.stringify(result));
    let yFinUrl = "";
    if(richtext) {
      yFinUrl = 'https://finance.yahoo.com/quote/' + symbol;
      robot.logger.debug("Yahoo Finance URL: " + yFinUrl);
      symbolstr = '<' + yFinUrl + '|' + symbol + '>';
    }
    // Body returns
    // { c: 256.89, h: 296, l: 252.01, o: 282, pc: 193.6, t: 1611878400 }
    const delta = parseFloat(result.c - result.pc).toFixed(3);
    let printdelta = delta;
    if(delta > 0.0) {
      printdelta = '+' + delta;
    }
    const perc = parseFloat(delta / result.pc * 100).toFixed(3);
    let printperc;
    if(perc > 0.0)
      printperc = '+' + perc + '%';
    else
      printperc = perc + '%';

    // Currencies do not have companyData
    if(yFinUrl)
      message = symbolstr;
    else
      message = symbol;
    if(companyData && typeof companyData.name !== 'undefined' && companyData.name !== null) {
      message += ' (' + companyData.name + ') ' + '$' + result.c + '  ($' + printdelta + ' ' + printperc + ')';
    } else {
      message += ' $' + result.c + ' ($' + printdelta + ' ' + printperc + ')';
    }
    const regex = /69/g;
    const current_price = String(result.c);
    if(richtext) {
      if(delta > 0.0)
        message = ':stonks: ' + message;
      if(delta < 0.0)
        message = ':stonks-down: ' + message;
      if(symbol == 'DOGE-USD')
        message = ':doge: ' + message;
      if(regex.test(current_price))
        message = ':nice: ' + message;
      if(perc > 15.00)
        message = message + '\n :gem: :raised_hands: :rocket: :rocket: :rocket: :moon:';
    }
    const found = result.pc != 0;
    if(!found)
      message = symbol + ' ticker symbol not found.';
    if(richtext)
      message = {
        "text": message,
        "unfurl_links": false,
        "unfurl_media": false
      };
    await msg.send(message);
    return found ? result : null;
  }
};
