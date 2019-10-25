'use strict';

async function init(bot) {
    bot.use( async (ctx, next) => {
      console.info("Logging message...", ctx.message);
      next();
    })

    console.info("Successfull setup: setupLogMessage middleware...");
}

module.exports = {
  init
}