'use strict';

const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const create_offer_wizard = require('../wizards/offer_create')
const activate_offer_wizard = require('../wizards/offer_activate')
const apply_offer_wizard = require('../wizards/offer_apply')
const update_manual_offer_wizard = require('../wizards/offer_update_manual')
const activate_button_offer_wizard = require('../wizards/offer_activate_button')
const create_button_offer_wizard = require('../wizards/offer_create_button')
const test_wizard = require('../wizards/test_wizard')

const logger = require('../helpers/logger')


const stage = new Stage([create_offer_wizard,
  activate_offer_wizard,
  apply_offer_wizard,
  update_manual_offer_wizard,
  activate_button_offer_wizard,
  create_button_offer_wizard,
  test_wizard])


async function setupStages(bot) {
  try{
    bot.use(session());
    bot.use(stage.middleware());

    bot.command('test_wizard', async ctx => {
      return ctx.scene.enter('test-wizard')
    })


    bot.command('create_button_offer', async ctx => {
      return ctx.scene.enter('create-button-offer-wizard')
    })

    bot.command('activate_button_offer', async ctx => {
      return ctx.scene.enter('activate-button-offer-wizard')
    })

    
    /*
    bot.command('create_offer', async ctx => {
      return ctx.scene.enter('create-offer-wizard')
    })

    bot.command('activate_offer', async ctx => {
      return ctx.scene.enter('activate-offer-wizard')
    })

    bot.command('manual_update_offer', async ctx => {
      return ctx.scene.enter('update-manual-offer-wizard')
    })
*/


  }catch(error){
    logger.error("FAILED: bot middleware stages setup failed: %s", error);
    return;
  }

  logger.info("SUCCESS: bot middleware stages setup success");

}

module.exports = { setupStages }
