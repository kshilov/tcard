'use strict';

module.exports = function setupLogMessage(bot) {
    bot.use( async (ctx, next) => {
      console.info("Logging message...", ctx.message);
      next();
    })

    console.info("Successfull setup: setupLogMessage middleware...");
}