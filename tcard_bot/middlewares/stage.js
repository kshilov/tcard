'use strict';

const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const create_offer_wizard = require('../wizards/offer_create')
const activate_offer_wizard = require('../wizards/offer_activate')
const apply_offer_wizard = require('../wizards/offer_apply')

const logger = require('../helpers/logger')


const stage = new Stage([create_offer_wizard,
  activate_offer_wizard,
  apply_offer_wizard])


async function setupStages(bot) {
  try{
    bot.use(session());
    bot.use(stage.middleware());

    bot.command('create_offer', async ctx => {
      return ctx.scene.enter('create-offer-wizard')
    })

    bot.command('activate_offer', async ctx => {
      return ctx.scene.enter('activate-offer-wizard')
    })

  }catch(error){
    logger.error("FAILED: bot middleware stages setup failed: %s", error);
    return;
  }

  logger.info("SUCCESS: bot middleware stages setup success");

}

module.exports = { setupStages }
