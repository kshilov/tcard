'use strict';

const sendMainMenu = require('../helpers/sendMainMenu');
const db = require('../models');

async function init(bot) {

    bot.command('menu', async ctx => {
        return sendMainMenu(ctx);
    })
}


  // Exports
module.exports = {
    init
}
  