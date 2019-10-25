'use strict';

const { findChat } = require('../helpers/db')

async function init(bot) {
    bot.use(async (ctx, next) => {
      next()
    })
}

module.exports = {
  init
}