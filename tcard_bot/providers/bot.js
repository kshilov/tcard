'use strict';

// Dependencies
const Telegraf = require('telegraf')
const uuid = require('uuid/v4')
const secretPath = uuid()

const bot_listen_port = process.env.BOT_LISTEN_PORT;
const {SETUP_STEPS} = require("../helpers/constants");


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
  console.log("STEP %d - FAILED: can't initize telegram bot",SETUP_STEPS['bot'], err);
})

// Start bot
function start() {

    // Start bot
    if (process.env.USE_WEBHOOK === 'true') {
      const domain = process.env.WEBHOOK_DOMAIN
      bot.telegram
        .deleteWebhook()
        .then(async () => {
          bot.startWebhook(`/${secretPath}`, undefined, bot_listen_port)
          await bot.telegram.setWebhook(
            `https://${domain}/${secretPath}`,
            undefined,
            100
          )
          const webhookInfo = await bot.telegram.getWebhookInfo()
          console.log("STEP %d - SUCCESS: telegram bot is up and running in webhook mode: ",SETUP_STEPS['bot'], webhookInfo);
        })
        .catch(err => console.log("STEP %d - FAILED: telegram bot can't setup webhook",SETUP_STEPS['bot'], err));
    } else {
      bot.telegram
        .deleteWebhook()
        .then(async () => {
          bot.startPolling()
          // Console that everything is fine
          console.log("STEP %d - SUCCESS: telegram bot is up and running in polling mode: ",SETUP_STEPS['bot']);
        })
        .catch(err => console.log("STEP %d - FAILED: telegram bot can't start polling",SETUP_STEPS['bot'], err));
    }
}

// Export bot
module.exports = { bot, start, secretPath }