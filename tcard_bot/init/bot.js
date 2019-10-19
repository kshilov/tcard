'use strict';

// Dependencies
const Telegraf = require('telegraf')
const uuid = require('uuid/v4')
const secretPath = uuid()

// Create bot
const bot = new Telegraf(process.env.TOKEN, {
  channelMode: true,
})

bot.webhookReply = false;

// Get bot's username
bot.telegram
  .getMe()
  .then(info => {
    bot.options.username = info.username
  })
  .catch(console.info)

  // Bot catch
bot.catch(err => {
  //report(bot, err, 'bot.catch')
  console.log(err);
})

// Start bot
function startBot() {

    // Start bot
    if (process.env.USE_WEBHOOK === 'true') {
      const domain = process.env.WEBHOOK_DOMAIN
      bot.telegram
        .deleteWebhook()
        .then(async () => {
          bot.startWebhook(`/${secretPath}`, undefined, 5000)
          await bot.telegram.setWebhook(
            `https://${domain}/${secretPath}`,
            undefined,
            100
          )
          const webhookInfo = await bot.telegram.getWebhookInfo()
          console.info('Bot is up and running with webhooks', webhookInfo)
        })
        .catch(err => console.info('Bot launch error', err))
    } else {
      bot.telegram
        .deleteWebhook()
        .then(async () => {
          bot.startPolling()
          // Console that everything is fine
          console.info('Bot is up and running')
        })
        .catch(err => console.info('Bot launch error', err))
    }
}

// Export bot
module.exports = { bot, startBot, secretPath }