#!/bin/bash

curl "https://finnhub.io/api/v1/quote?token=${HUBOT_FINNHUB_API_KEY}&symbol=${1^^}"
echo
