'use strict';

const sendStart = require('../helpers/sendStart')
const db = require('../models');

async function init(bot) {
    // Start command
    bot.start(async ctx => {
        const telegram_id = ctx.from.id;
        
        const user = await db.User.get_user(telegram_id);

        if (!user){
            await db.User.complete_creation(ctx.from, ctx.chat.id);
            return suggestWalletCreation(ctx);
        }

        return sendStart(ctx);
    })
}

async function suggestWalletCreation(ctx){
    await ctx.replyWithMarkdown(ctx.i18n.t('create_wallet'));
}

  // Exports
module.exports = {
    init
}
  