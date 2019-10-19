'use strict';

const sendMainMenu = require('../helpers/sendMainMenu');
const db = require('../models');

function setupMenu(bot) {

    bot.command('menu',async ctx => {
        return sendMainMenu(ctx);
    })
}


  // Exports
module.exports = {
    setupMenu
}
  