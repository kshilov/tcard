'use strict';

const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const logger = require('../helpers/logger')

const offer_create_wizard = require('../wizards/offer_create')
const offer_activate_wizard = require('../wizards/offer_activate')
const offer_update_wizard = require('../wizards/offer_update')
const offer_users_list_wizard = require('../wizards/offer_users_list')
const offer_managers_list_wizard = require('../wizards/offer_managers_list')
const user_city_wizard = require('../wizards/user_city')
const support_wizard = require('../wizards/support')
const notification_send_wizard = require('../wizards/notification_send')
const offer_apply_wizard = require('../wizards/offer_apply')
const offer_list_wizard = require('../wizards/offer_list')
const offer_users_notify = require('../wizards/offer_users_notify')

const stage = new Stage([
  offer_create_wizard,
  offer_activate_wizard,
  offer_update_wizard,
  offer_users_list_wizard,
  offer_managers_list_wizard,
  user_city_wizard,
  support_wizard,
  notification_send_wizard,
  offer_apply_wizard,
  offer_list_wizard,
  offer_users_notify
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

    bot.command('offer_users_list', async ctx => {
      return ctx.scene.enter('offer-users-list-wizard')
    })

    bot.command('offer_managers_list', async ctx => {
      return ctx.scene.enter('offer-managers-list-wizard')
    })

    bot.command('support', async ctx => {
      return ctx.scene.enter('support-wizard')
    })

    bot.command('notification_send', async ctx => {
      return ctx.scene.enter('notification-send-wizard')
    })

    bot.command('offer_list', async ctx => {
      return ctx.scene.enter('offer-list-wizard')
    })




  }catch(error){
    logger.error("FAILED: bot middleware stages setup failed: %s", error);
    return;
  }

  logger.info("SUCCESS: bot middleware stages setup success");

}

module.exports = { setupStages }
