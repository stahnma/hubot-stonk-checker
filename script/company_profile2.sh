#!/bin/bash

curl "https://finnhub.io/api/v1/stock/profile2?token=${HUBOT_FINNHUB_API_KEY}&symbol=${1^^}"
echo
