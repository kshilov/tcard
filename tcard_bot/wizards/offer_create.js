const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')

const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')

const db = require('../models')


const check_offer_data = require('../helpers/check_offer_data')

const steps = new Composer()

async function start_offer_dialog(ctx){
    ctx.reply(ctx.i18n.t('create_offer_dialog') , 
    Markup.inlineKeyboard([
        Markup.callbackButton('➡️ Start', 'first_step')
    ]).extra())
    return ctx.wizard.next()
  }


async function first_step_1(ctx){
    ctx.reply(ctx.i18n.t('create_offer_title'))
    return ctx.wizard.next()
}

async function enter_publictitle(ctx){
    ctx.wizard.state.privateTitle = ctx.message.text;

    ctx.reply(ctx.i18n.t('create_offer_public_title'))
    return ctx.wizard.next()
}

async function enter_description_2(ctx){
    // Store the previous message
    ctx.wizard.state.publicTitle = ctx.message.text;

    ctx.reply(ctx.i18n.t('create_offer_description'))
    return ctx.wizard.next()
}

async function type_steps_select(ctx){
    // Store the previous message
    ctx.wizard.state.offerDescription = ctx.message.text;

    ctx.reply(ctx.i18n.t('create_offer_type'), 
    Markup.inlineKeyboard([
        Markup.callbackButton(ctx.i18n.t('create_offer_type_number'), 'enter_num_4'),
        Markup.callbackButton(ctx.i18n.t('create_offer_type_sum'), 'enter_sum_4'),
    ]).extra())
    return ctx.wizard.next()
}


async function type_steps_process(ctx){
    /* 
        Here we need to create the logic based on type selected
        Each type can have different number of steps.
        Once we finished to process questions for type
        we need to set type_process_finished = 1

        1 - Ends on certain number of users
        2 - Ends on sertain amount of money collected
    */
   if (!ctx.wizard.state.offerType){
        ctx.wizard.state.offerType = ctx.update.callback_query.data;
   }

    if (ctx.wizard.state.offerType == 'enter_num_4') {

        if (!ctx.wizard.state.amount){
            if (ctx.wizard.state.asked_participants){
                ctx.wizard.state.amount = ctx.message.text;
                return;
            }
            ctx.wizard.state.asked_participants = 1;
            ctx.reply(ctx.i18n.t('create_offer_participants'))
            return;
        }

        if (!ctx.wizard.state.dicount_price){
            if (ctx.wizard.state.asked_price){
                ctx.wizard.state.dicount_price = ctx.message.text;
                ctx.reply(ctx.i18n.t('create_offer_hello'))
                return ctx.wizard.next()
            }
            ctx.wizard.state.asked_price = 1;
            ctx.reply(ctx.i18n.t('create_offer_discount_price'))
            return;
        }
    
    }else if (ctx.wizard.state.offerType == 'enter_sum_4'){
        
        if (!ctx.wizard.state.amount){
            if (ctx.wizard.state.asked_amount){
                ctx.wizard.state.amount = ctx.message.text;
                return;
            }
            ctx.wizard.state.asked_amount = 1;
            ctx.reply(ctx.i18n.t('create_offer_sum'))   
            return;
        }

        if (!ctx.wizard.state.slots){
            if (ctx.wizard.state.asked_slots){
                ctx.wizard.state.slots = ctx.message.text;
                ctx.reply(ctx.i18n.t('create_offer_hello'))
                return ctx.wizard.next() 
            }
            ctx.wizard.state.asked_slots = 1;
            ctx.reply(ctx.i18n.t('create_offer_sum_slot'))       
            return;
        }
    }

    return;

}

async function type_steps_completed(ctx){
    ctx.wizard.state.messageHello = ctx.message.text;
    ctx.reply(ctx.i18n.t('create_offer_pay'))
    return ctx.wizard.next()
}

async function enter_message_pay(ctx){
    // Store the previous message
    ctx.wizard.state.messagePay = ctx.message.text;

    ctx.reply(ctx.i18n.t('create_offer_pay_sucess'))
    return ctx.wizard.next()
}

async function enter_message_success(ctx){
    // Store the previous message
    ctx.wizard.state.messagePaid = ctx.message.text;

    ctx.reply(ctx.i18n.t('create_offer_start_amount'))
    return ctx.wizard.next()
    
}

async function enter_start_amount(ctx){
    // Store the previous message
    ctx.wizard.state.startAmount = ctx.message.text;

    ctx.reply(ctx.i18n.t('create_offer_due_date'))
    return ctx.wizard.next()
}

async function enter_due_date(ctx){
    // Store the previous message
    ctx.wizard.state.dueDate = ctx.message.text;
    
    ctx.reply(ctx.i18n.t('create_offer_preview') , 
    Markup.inlineKeyboard([
        Markup.callbackButton('➡️ Preview', 'offer_preview')
    ]).extra())

    return ctx.wizard.next()

}




async function final_offer_approved(ctx){
    var message = '';
    var data = ctx.wizard.state;
    data = await check_offer_data(data)

    if (ctx.wizard.state.offerType == 'enter_num_4'){
        message = await i18n.t(i18n.current_locale, 'offer_num_post_template', data)
    }else if (ctx.wizard.state.offerType == 'enter_sum_4'){
        message = await i18n.t(i18n.current_locale, 'offer_sum_post_template', data)
    }
    
    var messages = await i18n.t(i18n.current_locale, 'offer_messages_preview_template', data);
    message = message + messages;

    ctx.replyWithMarkdown(message, 
        Markup.inlineKeyboard([
            Markup.callbackButton(ctx.i18n.t('create_offer_approve'), 'offer_approve'),
            Markup.callbackButton(ctx.i18n.t('create_offer_decline'), 'offer_decline'),
    ]).extra())
    
    return ctx.wizard.next()
}

async function leave_scene(ctx){
    if (ctx.update.callback_query.data == 'offer_approve'){
        var data = ctx.wizard.state
        const telegram_id = ctx.from.id;

        var offer = await db.Offer.new_offer(telegram_id, data)

        if (!offer || offer < 0){
            ctx.reply('Что-то пошло не так, не полуичлось создать оффер, попробуйте сначала /create_offer.')
        }else{
            ctx.reply('Оффер успешно создан, выберите /offer_list из меню.')
        }
    } else{
        ctx.reply('Для того, чтобы начать создание оффера с нуля введите /create_offer')
    }
    return ctx.scene.leave()
}




steps.action('first_step', first_step_1)

steps.action('enter_num_4', type_steps_process)
steps.action('enter_sum_4', type_steps_process)
steps.action('offer_preview',final_offer_approved)

steps.action('offer_approve', leave_scene)
steps.action('offer_decline', leave_scene)
  

const create_offer_wizard = new WizardScene('create-offer-wizard',
    start_offer_dialog,
    steps,
    enter_publictitle,
    enter_description_2,
    type_steps_select,
    type_steps_process,
    type_steps_completed,
    enter_message_pay,
    enter_message_success,
    enter_start_amount,
    enter_due_date,
    final_offer_approved,
    leave_scene
)

logger.info("SUCCESS wizards: offer_create initialized");


module.exports = create_offer_wizard;