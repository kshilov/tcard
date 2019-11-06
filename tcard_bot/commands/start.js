'use strict';

const sendStart = require('../helpers/sendStart')
const db = require('../models');
const logger = require('../helpers/logger')
const check_payload = require('../helpers/check_payload')

async function init(bot) {
    // Start command
    bot.start(async ctx => {
        const telegram_id = ctx.from.id;
        
        var user = await db.User.get_user(telegram_id);


        if (!user){
            user = await db.User.complete_creation(ctx.from, ctx.chat.id);
        }

        var payload_handle = await check_payload(ctx, ctx.startPayload)
        if (payload_handle){
            return payload_handle(ctx)
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
  