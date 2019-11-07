'use strict';

// Dependencies
const Telegraf = require('telegraf')
const uuid = require('uuid/v4')
const secretPath = uuid()

const bot_listen_port = process.env.BOT_LISTEN_PORT;
const {SETUP_STEPS} = require("../helpers/constants");

const logger = require('../helpers/logger')
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);

// Create bot
const bot = new Telegraf(process.env.TOKEN, {
  channelMode: true,
})

bot.webhookReply = false;

// TLS options
const tlsOptions = {
  key: fs.readFileSync(__dirname + '/server-key.pem'),
  cert: fs.readFileSync(__dirname + '/server-cert.pem'),
  ca: [
    // This is necessary only if the client uses a self-signed certificate.
    fs.readFileSync(__dirname + '/client-cert.pem')
  ]
}

var custom_cert = fs.readFileSync(__dirname + '/client-cert.pem');


// Get bot's username
bot.telegram
  .getMe()
  .then(info => {
    bot.options.username = info.username
  })
  .catch(console.info)

  // Bot catch
bot.catch(err => {
  logger.error("FAILED: bot catch error: %s", err);
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
          logger.info("STEP %d - SUCCESS: telegram bot is up and running in webhook mode: %s",SETUP_STEPS['bot'], webhookInfo);
          logger.info(webhookInfo);

        })
        .catch(err => logger.error("STEP %d - FAILED: telegram bot can't setup webhook %s",SETUP_STEPS['bot'], err));
    } else {
      bot.telegram
        .deleteWebhook()
        .then(async () => {
          bot.startPolling()
          // Console that everything is fine
          logger.info("STEP %d - SUCCESS: telegram bot is up and running in polling mode:",SETUP_STEPS['bot']);
        })
        .catch(err => logger.error("STEP %d - FAILED: telegram bot can't start polling %s",SETUP_STEPS['bot'], err));
    }
}

// Export bot
module.exports = { bot, start, secretPath }