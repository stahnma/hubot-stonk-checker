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
//
// Commands:
//   hubot stonk <symbol>
//   hubot stock <symbol>
//   hubot memestonks
//

// const env = process.env
const apiKey = process.env.HUBOT_FINNHUB_API_KEY;
let memeset = process.env.HUBOT_MEMESTONKS;
const defaultMemeSet = 'AMC,BB,BBBY,DOGE-USD,GME';
let richtext;

if (memeset === undefined) {
  memeset = defaultMemeSet.split(',');
} else {
  memeset = memeset.split(',');
}

module.exports = function(robot) {
  if (robot.adapterName === 'slack') {
    richtext = true;
  } else {
    richtext = false;
  }

  if (apiKey === undefined) {
    robot.logger
        .error('Must set HUBOT_FINNHUB_API_KEY for hubot-stonk-checker to work.');
    return false;
  }
  robot.respond(/sto[c|n]ks? ([-\@\w.]{1,11}?\S$)/i, function(msg) {
    symbol = msg.match[1];
    getStockData(symbol, msg, robot);
  });

  robot.respond(/memestonks?\S$$/i, function(msg) {
    if (richtext) {
      msg.send(':wsb:');
    }
    memeset.forEach((symbol) => {
      getStockData(symbol, msg, robot);
    });
  });
};

function getStockData(symbol, msg, robot) {
  url = 'https://finnhub.io/api/v1/quote';
  url += '?token=' + apiKey;
  // If it's a common crypto currency abbreviation, help the user out.
  if (['doge', 'btc', 'xrp', 'eth'].includes(symbol)) {
    symbol += '-usd';
  }
  symbol = symbol.toUpperCase();
  url += '&symbol=' + symbol.toUpperCase();
  robot.logger.debug('Url being called in getStockData is', url);
  msg.http(url)
      .get()(function(err, res, body) {
      // if(parseInt(response["statusCode"]) >= 400) {
      //   robot.logger.error("Lookup failed. HTTP response code: " + response["statusCode"])
      //   return false
      // }

        result = JSON.parse(body);
        robot.logger.debug('Body from url:', body);
        // Body returns
        // { c: 256.89, h: 296, l: 252.01, o: 282, pc: 193.6, t: 1611878400 }
        delta = parseFloat(result.c - result.pc).toFixed(3);

        if (delta > 0.0) {
          printdelta = '+' + delta;
        } else {
          printdelta = delta;
        }

        perc = parseFloat(delta / result.pc * 100).toFixed(3);
        if (perc > 0.0) {
          printperc = '+' + perc + '%';
        } else {
          printperc = perc + '%';
        }

        message = symbol + ' $' + result.c + '  ($' + printdelta + ' ' + printperc + ')';

        if (richtext) {
          if (delta > 0.0) {
            message = ':stonks: ' + message;
          }
          if (delta < 0.0) {
            message = ':stonks-down: ' + message;
          }
          if (delta == 0.0) {
            message = message;
          }
          if (symbol == 'DOGE-USD') {
            message = ':doge: ' + message;
          }
          if (perc > 15.00) {
            message = message + '\n :gem: :raised_hands: :rocket: :rocket: :rocket: :moon:';
          }
        }
        if (result.pc == 0) {
          message = symbol + ' ticker symbol not found.';
        }

        msg.send(message);
      });
}

//   # This can be used for slack formatted cards. I don't actually like it that much.
//   getSlackData = (symbol, msg) ->
//     url = 'https://finnhub.io/api/v1/quote'
//     url += "?token=#{apiKey}"
//     console.log("Get slack data")
//     if symbol == 'doge'
//         symbol = 'doge-usd'
//     symbol = symbol.toUpperCase()
//     url += "&symbol=#{symbol.toUpperCase()}"
//     contents = []
//     printperc = ""
//     delta =  ""
//     msg.http(url)
//       .get() (err,res,body) ->
//         result = JSON.parse(body)
//         robot.logger.debug body
//         # Body returns
//         # { c: 256.89, h: 296, l: 252.01, o: 282, pc: 193.6, t: 1611878400 }
//         delta = parseFloat(result.c - result.pc).toFixed(3)
//         price = result.c
//         if delta > 0.0
//             printdelta = "+#{delta}"
//         else
//             printdelta = "#{delta}"
//         perc = parseFloat(delta / result.pc * 100).toFixed(3)
//         if perc > 0.0
//             printperc = "+#{perc}%"
//         else
//             printperc = "#{perc}%"
//         message = "#{symbol} $#{result.c}  ($#{printdelta} #{printperc})"
//         if delta > 0.0
//             img = "https://raw.githubusercontent.com/stahnma/hubot-stonk-checker/master/assets/stonks.png"
//             message = ":stonks: " + message
//         if delta < 0.0
//             img = "https://raw.githubusercontent.com/stahnma/hubot-stonk-checker/master/assets/stonks-down.png"
//             message = ":stonks-down: " + message
//         if delta == 0.0
//             message = message
//         if symbol == 'DOGE-USD'
//             message = ":doge: " + message
//         if perc > 15.00
//             message = message + "\n :gem: :raised_hands: :rocket: :rocket: :rocket: :moon:"
//         if result.pc == 0
//             message = "#{symbol} ticker symbol not found."

//         profile_url = "https://finnhub.io/api/v1/stock/profile2?token=#{apiKey}&symbol=#{symbol}"
//         info = {}
//         msg.http(profile_url)
//           .get() (err,res,profile_body) ->
//             info = JSON.parse(profile_body)
//             if info.exchange != undefined
//               if info.exchange == "NEW YORK STOCK EXCHANGE, INC."
//                 exchange = "NYSE"
//               else if info.exchange.match(/nasdaq/i)
//                 exchange = "nasdaq"
//             linkname = "<https://www.google.com/finance/quote/#{symbol}:#{exchange}|#{info.name}"
//             if exchange == undefined
//               linkname = "#{symbol}  #{info.name}"
//             if exchange
//               card =  {
//                 "fallback": message,
//                 "blocks": [
//                   {
//                     "type": "section",
//                     "accessory": {
//                         "type": "image",
//                         "image_url": img,
//                         "alt_text": "computer thumbnail"
//                     },
//                     "text": {
//                       "type": "mrkdwn",
//                       "text": "*<https://www.google.com/finance/quote/#{symbol}:#{exchange}|#{info.name}>*\n #{printperc}"
//                     },

//                     "fields": [
//                       {
//                         "type": "mrkdwn",
//                         "text": "*Price:* $#{price}"
//                       },
//                       {
//                         "type": "mrkdwn",
//                         "text": "*Change:* $#{printdelta}"
//                       },
//                       {
//                         "type": "mrkdwn",
//                         "text": "*MarketCap:* #{info.marketCapitalization}"
//                       },
//                       {
//                         "type": "mrkdwn",
//                         "text": "*IPO*: #{info.ipo} "
//                       }
//                     ]
//                   }
//                 ]
//               }
//             if card
//               contents.push card
//               if robot.adapterName == 'slack'
//                 robot.messageRoom msg.message.room, attachments: contents, unfurl_links: false
//             else
//               msg.send(message)
