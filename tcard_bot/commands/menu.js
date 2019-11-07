'use strict';

const sendMainMenu = require('../helpers/sendMainMenu');
const db = require('../models');

const logger = require('../helpers/logger')

async function init(bot) {

    /*
    bot.command('menu', async ctx => {
        return sendMainMenu(ctx);
    })
    */
}


  // Exports
module.exports = {
    init
}
  