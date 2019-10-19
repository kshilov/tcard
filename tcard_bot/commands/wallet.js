'use strict';

const db = require('../models');
const sendWallet = require('../helpers/sendWallet')

function setupWallet(bot, ton) {

    bot.command('wallet', async ctx => {
        const telegram_id = ctx.from.id;
        
        const user = await db.User.get_user(telegram_id);

        const wallet = await user.get_wallet()

        if (!wallet.deployed()){
            await wallet.deploy_wallet(ton)
        }

        return sendWallet(ctx);
    })
}


  // Exports
module.exports = {
    setupWallet,
}
  