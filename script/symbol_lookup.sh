#!/bin/bash

curl "https://finnhub.io/api/v1/search?token=${HUBOT_FINNHUB_API_KEY}&q=${1^^}"
echo
