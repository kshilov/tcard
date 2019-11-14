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

    if (user.offer_access()){
      keyboard.push(['☸ Создать Оффер', '☸ Активировать Оффер'])
    }

    bot.hears('☸ Создать Оффер', ctx => ctx.scene.enter('offer-create-wizard'))
    bot.hears('☸ Активировать Оффер', ctx => ctx.scene.enter('offer-activate-wizard'))
    bot.hears('📢 Поддержка', ctx => ctx.scene.enter('support-wizard'))

    return ctx.reply('Выберите пункт меню', Markup
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