'use strict'

const path = require('path')

module.exports = (robot) => {
  const scriptsPath = path.resolve(__dirname, 'src')
  return robot.loadFile(scriptsPath, 'stonks.js')
}
