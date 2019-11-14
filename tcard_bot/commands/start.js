'use strict';

const sendStart = require('../helpers/sendStart')
const db = require('../models');
const logger = require('../helpers/logger')
const check_payload = require('../helpers/check_payload')

async function ask_for_city(ctx){
    return ctx.scene.enter('user-city-wizard')
}


async function init(bot) {
    // Start command
    bot.start(async ctx => {
        const telegram_id = ctx.from.id;
        
        var user = await db.User.get_user(telegram_id);


        if (!user){
            user = await db.User.complete_creation(ctx.from, ctx.chat.id);
        }

        var payload_handle = await check_payload(ctx, ctx.startPayload)

        if (ctx.state.ref){
            await user.add_ref(ctx.state.ref)
        }

        if (payload_handle){
            return payload_handle(ctx)
        }

        if (!user.has_city()){
            return ask_for_city(ctx);
        }

        return sendStart(ctx);
    })
}

  // Exports
module.exports = {
    init
}
  