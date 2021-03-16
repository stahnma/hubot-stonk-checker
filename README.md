# hubot-stonk-checker


[![stahnma](https://circleci.com/gh/stahnma/hubot-stonk-checker.svg?style=svg)](https://app.circleci.com/pipelines/github/stahnma/hubot-stonk-checker)

---

Have you ever wanted to check on your stock portfolio from the convenience of your chat applications? Of course you have. Well fear not, now you can go ape and throw your :gem: :raised_hands: in the air and check on your tendies.

# Setup

You will need an API key from [finnhub.io](https://finnhub.io/).

Steps to get an API key.

1. Navigate to [finnhub.io](https://finnhub.io/).
1. Click on "Get free API key".
1. Register an account.
1. Save the API key.


# Installation

From your hubot installation directory.

1. Add `HUBOT_FINNHUB_API_KEY` environment variable into your setup.
1. Run `npm install hubot-stonk-checker --save`
1. Add `hubot-stonk-checker` to your `external-scripts.json` file.


# Usage

     hubot stonks <symbol>


   :warning: _Note:_ that `stocks`, `stonks`, `stonk`, `stock` are all aliases to the same set of functionality so if you're not an APE with diamond hands, you can just use `stock` and be pedestrian. :warning:

    hubot memestonks


Shows a set of stocks deemed memeworthy, or more accurately, brought into prominence from [/r/wallstreetbets](https://reddit.com/r/wallstreetbets).


## Slack specialities

If you're using slack, for best functionality, you want to enable the emojis. They're found in the `assets` directory. If you add them to your slack team with the names provided (minus the extensions) they'll get used when retrieving stock information if certain conditions are met.


## Setting the memestonk sets

The list of memestonks can be set via `HUBOT_MEMESTONKS` and is comma seperated.

    HUBOT_MEMESTONKS=BB,GME,AMC,DOGE-USD


It defaults to

    AMC,BB,BBBY,DOGE-USD,GME

## Setting a special stonk set.

Setting `HUBOT_SPECIAL_STONKS` provides list of stock ticker symbols that you can address in a short-hand way and not through asking the bot to do `hubot stock symbol` but just `hubot symbol` therefore saving you five keystrokes. (This preserves some backward compatibility with an older stock checking module as well).

As an example

    HUBOT_SPECIAL_STONKS=CAT,MSFT

This will allow bot beavhior to be:

`hubot cat`
vs
`hubot stock cat`

# Development

Basically, git clone this repo. Run `npm i` to get the deps. `npm test` to test things.

# License
MIT
