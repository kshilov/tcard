const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')

const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')

const db = require('../models')


const check_offer_data = require('../helpers/check_offer_data')

const steps = new Composer()

async function start_offer_dialog(ctx){
    // TODO: remove this on production
    var admin_id = ctx.from.id;
    if (admin_id != '389959952'){
        var m = "HACKED ATTEMPT: someone try to use offer_create " + admin_id;
        logger.error(m)
        return ctx.scene.leave()
    }
    
    
    ctx.reply(ctx.i18n.t('create_button_offer_dialog') , 
    Markup.inlineKeyboard([
        Markup.callbackButton('➡️ Start', 'first_step')
    ]).extra())
    return ctx.wizard.next()
  }


async function step_1(ctx){
    ctx.reply(ctx.i18n.t('create_button_offer_title'))
    return ctx.wizard.next()
}

async function step_2(ctx){
    ctx.wizard.state.privateTitle = ctx.message.text;

    ctx.reply(ctx.i18n.t('create_button_offer_payment_message'))
    return ctx.wizard.next()
}

async function step_3(ctx){
    // Store the previous message
    ctx.wizard.state.messagePay = ctx.message.text;

    ctx.reply(ctx.i18n.t('create_button_offer_participants'))
    return ctx.wizard.next()
}

async function step_4(ctx){
    // Store the previous message
    ctx.wizard.state.amount = ctx.message.text;

    ctx.reply(ctx.i18n.t('create_button_offer_merchant_contact'))
    return ctx.wizard.next()
}

async function step_5(ctx){
    // Store the previous message
    ctx.wizard.state.merchantContact = ctx.message.text;

    ctx.reply(ctx.i18n.t('create_button_offer_message_link'))
    return ctx.wizard.next()
}

async function step_ask_preview(ctx){
    // Store the previous message
    ctx.wizard.state.offerMessageLink = ctx.message.text;
    
    ctx.reply(ctx.i18n.t('create_offer_preview') , 
    Markup.inlineKeyboard([
        Markup.callbackButton('➡️ Preview', 'offer_preview')
    ]).extra())

    return ctx.wizard.next()
}





async function step_show_preview(ctx){
    var data = ctx.wizard.state;
   
    logger.error(data)

    var message = await i18n.t(i18n.current_locale, 'offer_button_post_template', data)

    ctx.replyWithMarkdown(message, 
        Markup.inlineKeyboard([
            Markup.callbackButton(ctx.i18n.t('create_offer_approve'), 'offer_approve'),
            Markup.callbackButton(ctx.i18n.t('create_offer_decline'), 'offer_decline'),
    ]).extra())
    
    return ctx.wizard.next()
}

async function step_finished(ctx){
    if (ctx.update.callback_query.data == 'offer_approve'){
        var data = ctx.wizard.state
        const telegram_id = ctx.from.id;

        var bot_name = ctx.options.username;
        if (!bot_name){
            ctx.reply('bot_name не может быть пустым напишите в /support.')
            return ctx.scene.leave()
        }

        var offer = await db.Offer.new_button_offer(telegram_id, data)

        if (!offer || offer < 0){
            ctx.reply('Что-то пошло не так, не полуичлось создать оффер, попробуйте сначала /create_offer.')
        }else{
            await offer.set_url(bot_name)
            ctx.reply('Оффер успешно создан, выберите /offer_list из меню.')
        }
    } else{
        ctx.reply('Для того, чтобы начать создание оффера с нуля введите /create_button_offer')
    }
    return ctx.scene.leave()
}




steps.action('first_step', step_1)
steps.action('offer_preview',step_show_preview)
steps.action('offer_approve', step_finished)
steps.action('offer_decline', step_finished)
  

const create_button_offer_wizard = new WizardScene('create-button-offer-wizard',
    start_offer_dialog,
    steps,
    step_1,
    step_2,
    step_3,
    step_4,
    step_5,
    step_ask_preview,
    step_show_preview,
    step_finished
)

logger.info("SUCCESS wizards: create_button_offer_wizard initialized");


module.exports = create_button_offer_wizard;