'use strict';

const db = require('../models');
const sendWallet = require('../helpers/sendWallet')

const {providers} = require("../providers")

const ton = providers.ton.ton

function init(bot) {

    bot.command('wallet', async ctx => {
        const telegram_id = ctx.from.id;
        
        const user = await db.User.get_user(telegram_id);

        const wallet = await user.get_wallet()

        return sendWallet(ctx);
    })
}


  // Exports
module.exports = {
    init
}
  