'use strict';

const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')


module.exports = async function sendMainMenu(ctx) {
    return ctx.reply('', Markup
    .keyboard([
      '🔍 Wallet', 
      '☸ Settings',
      '📢 Service'
    ])
    .oneTime()
    .resize()
    .extra()
  )
}