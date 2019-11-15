'use strict';

const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const db = require('../models');
const logger = require('./logger')
const {providers} = require('../providers')
const bot = providers.bot.bot


module.exports = async function sendMainMenu(ctx) {
  try{
    var user = await db.User.get_user(ctx.from.id)
    
    var keyboard = [];
    keyboard.push(['📢 Поддержка'])

    if (user && user.offer_access()){
      keyboard.push(['☸ Создать Закупку', '☸ Активировать Закупку'])
      keyboard.push(['☸ Список Закупок', '☸ Список участников закупок'])
      keyboard.push(['☸ Отправить сообщение участникам'])
    }

    if (user && user.is_admin()){
      keyboard.push(['☸ Список Менеджеров'])
    }

    bot.hears('☸ Создать Закупку', ctx => ctx.scene.enter('offer-create-wizard'))
    bot.hears('☸ Активировать Закупку', ctx => ctx.scene.enter('offer-activate-wizard'))
    bot.hears('☸ Список Закупок', ctx => ctx.scene.enter('offer-list-wizard'))
    bot.hears('☸ Список участников закупок', ctx => ctx.scene.enter('offer-users-list-wizard'))
    bot.hears('☸ Отправить сообщение участникам', ctx => ctx.scene.enter('offer-users-notify-wizard'))
    
    //admin menu
    bot.hears('☸ Список Менеджеров', ctx => ctx.scene.enter('offer-managers-list-wizard'))


    bot.hears('📢 Поддержка', ctx => ctx.scene.enter('support-wizard'))

    return ctx.replyWithMarkdown(ctx.i18n.t('start_exist'), Markup
      .keyboard(keyboard)
      .oneTime()
      .resize()
      .extra()
    )
  }catch(error){
    logger.error("FAILED: sendMainMenu error: %s", error)
    return;
  }

}