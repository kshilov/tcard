const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')
const db = require('../models')

const steps = new Composer()

const SHOW_PREVIEW_STEP = 7;

async function start_offer_dialog(ctx){
    // TODO: remove this on production

    var user = await db.User.get_user(ctx.from.id)

    if (!user.offer_access()){
        var m = "HACKED ATTEMPT offer_create.dialog: someone try to use offer_create " + user.id;
        logger.error(m)
        return ctx.scene.leave()
    }
    
    if (user.is_admin()){
        if (ctx.wizard.state.create_for){
            var input = ctx.message.text;
            if (Number(input) > 0){
                var create_for_user = await db.User.get_user(input)
                if (!create_for_user){
                    ctx.reply('No such user');
                    return ctx.scene.leave()
                }else{
                    ctx.wizard.state.create_for_id = input;
                }
            }
        }

        if (!ctx.wizard.state.create_for){
            ctx.wizard.state.create_for = 1;
            ctx.reply(ctx.i18n.t('Введите ID пользователя для которого создаем оффер'));
            return ctx.wizard.selectStep(ctx.wizard.cursor)
        }

    }

    ctx.reply(ctx.i18n.t('offer_create_dialog') , 
    Markup.inlineKeyboard([
        Markup.callbackButton('➡️ Начать', 'step_1')
    ]).extra())

    return ctx.wizard.next();
}

async function step_1(ctx){
    ctx.reply(ctx.i18n.t('offer_create_title'))
    return ctx.wizard.next()
}

async function step_2(ctx){
    ctx.wizard.state.privateTitle = ctx.message.text;

    ctx.reply(ctx.i18n.t('offer_create_success_message'))
    return ctx.wizard.next()
}

async function step_3(ctx){
    // Store the previous message
    ctx.wizard.state.messagePay = ctx.message.text;

    ctx.reply(ctx.i18n.t('offer_create_participants'))
    return ctx.wizard.next()
}

async function step_4(ctx){
    // Store the previous message
    ctx.wizard.state.amount = ctx.message.text;

    ctx.reply(ctx.i18n.t('offer_create_contact'))
    return ctx.wizard.next()
}

async function step_5(ctx){
    // Store the previous message
    ctx.wizard.state.merchantContact = ctx.message.text;

    ctx.wizard.state.questions_list = [];
    ctx.reply(ctx.i18n.t('offer_create_questions_start'))
    return ctx.wizard.next()
}


async function step_progress(ctx){

    if (ctx.update.callback_query && ctx.update.callback_query.data == 'stop'){
        ctx.reply(ctx.i18n.t('offer_create_preview') , 
        Markup.inlineKeyboard([
            Markup.callbackButton('➡️ Смотреть', 'offer_preview')
        ]).extra())    
        return ctx.wizard.selectStep(SHOW_PREVIEW_STEP)
    }
    
     
    ctx.wizard.state.questions_list.push(ctx.message.text)

  
    ctx.reply(ctx.i18n.t('offer_create_questions_next') , 
    Markup.inlineKeyboard([
        Markup.callbackButton('Завершить', 'stop'),
    ]).extra())
    return ctx.wizard.selectStep(ctx.wizard.cursor)
}


async function step_show_preview(ctx){
    var data = ctx.wizard.state;

    var message = await i18n.t(i18n.current_locale, 'offer_create_preview_template', data)

    ctx.replyWithMarkdown(message, 
        Markup.inlineKeyboard([
            Markup.callbackButton(ctx.i18n.t('offer_create_approve'), 'offer_approve'),
            Markup.callbackButton(ctx.i18n.t('offer_create_decline'), 'offer_decline'),
    ]).extra())
    
    return ctx.wizard.next()
}


async function step_finished(ctx){
    if (ctx.update.callback_query.data == 'offer_approve'){
        var data = ctx.wizard.state
        const telegram_id = ctx.from.id;

        var bot_name = ctx.options.username;
        if (!bot_name){
            ctx.reply(ctx.i18n.t('fatal_error_bot_name'))
            return ctx.scene.leave()
        }

        var current_user = await db.User.get_user(ctx.from.id)

        if (current_user && current_user.is_admin()){
            if (ctx.wizard.state.create_for_id){
                telegram_id = ctx.wizard.state.create_for_id;
            }
        }


        var offer = await db.Offer.new_offer(telegram_id, data)

        if (!offer || offer < 0){
            ctx.reply(ctx.i18n.t('fatal_error_create_offer'))
        }else{
            await offer.set_bot(bot_name)
            ctx.reply(ctx.i18n.t('create_offer_success'))
        }

    } else{
        ctx.reply(ctx.i18n.t('decline_action'))
    }

    return ctx.scene.leave()
}




steps.action('step_1', step_1)
steps.action('offer_preview',step_show_preview)
steps.action('offer_approve', step_finished)
steps.action('offer_decline', step_finished)

steps.action('stop',step_show_preview)

  

const offer_create_wizard = new WizardScene('offer-create-wizard',
    start_offer_dialog,
    steps,
    step_2,
    step_3,
    step_4,
    step_5,
    step_progress,
    step_show_preview,
    step_finished
)

logger.info("SUCCESS wizards: offer_create_wizard initialized");


module.exports = offer_create_wizard;