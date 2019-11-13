'use strict';

const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const logger = require('../helpers/logger')

const offer_create_wizard = require('../wizards/offer_create')
const offer_activate_wizard = require('../wizards/offer_activate')
const offer_update_wizard = require('../wizards/offer_update')




const stage = new Stage([
  offer_create_wizard,
  offer_activate_wizard,
  offer_update_wizard
])


async function setupStages(bot) {
  try{
    bot.use(session());
    bot.use(stage.middleware());

    bot.command('offer_create', async ctx => {
      return ctx.scene.enter('offer-create-wizard')
    })

    bot.command('offer_activate', async ctx => {
      return ctx.scene.enter('offer-activate-wizard')
    })


    bot.command('offer_update', async ctx => {
      return ctx.scene.enter('offer-update-wizard')
    })

  }catch(error){
    logger.error("FAILED: bot middleware stages setup failed: %s", error);
    return;
  }

  logger.info("SUCCESS: bot middleware stages setup success");

}

module.exports = { setupStages }
