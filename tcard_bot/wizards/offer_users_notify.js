const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const {add_offers_list} = require('../helpers/show_lists')
const extra = require('telegraf/extra')

const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')

const db = require('../models')
const {providers} = require('../providers')
const bot = providers.bot.bot

const steps = new Composer()


async function activate_dialog(ctx){
    // TODO: remove this on production
    var user = await db.User.get_user(ctx.from.id)
    if (!user.offer_access()){
        var m = "HACKED ATTEMPT offer_users_notify.activate_dialog: someone try to use offer_users_notify " + user.id
        logger.error(m)
        return ctx.scene.leave()
    }


    if (user.is_admin()){
        if (ctx.wizard.state.get_list_for){
            var input = ctx.message.text;
            if (Number(input) > 0){
                var offer_for_id = await db.User.get_user(input)
                if (!offer_for_id){
                    ctx.reply('No such user');
                    return ctx.scene.leave()
                }else{
                    ctx.wizard.state.offer_for_id = input;
                }
            }
        }

        if (!ctx.wizard.state.get_list_for){
            ctx.wizard.state.get_list_for = 1;
            ctx.reply(ctx.i18n.t('Введите ID пользователя'));
            return ctx.wizard.selectStep(ctx.wizard.cursor)
        }

    }

    
    ctx.replyWithMarkdown(ctx.i18n.t('offer_users_notify_dialog') , 
    Markup.inlineKeyboard([
        Markup.callbackButton('➡️ Начать', 'activate_start')
    ]).extra())
    return ctx.wizard.next()
}


async function activate_start(ctx){

    var telegram_id = ctx.from.id
    var user = await db.User.get_user(ctx.from.id)
    if (user.is_admin()){
        if (ctx.wizard.state.offer_for_id){
            telegram_id = ctx.wizard.state.offer_for_id;
        }
    }
    var exit = false;
    
    var data = await db.Offer.offers_for(telegram_id)
    
    var message = await i18n.t(i18n.current_locale, 'offer_users_notify_select');

    var message_list = add_offers_list(data.offer_list);

    message = message + message_list;

    if (Object.keys(data).length === 0){
        exit = true;
    }


    ctx.replyWithMarkdown(message)

    if (exit){
        return ctx.scene.leave()
    }
    return ctx.wizard.next()
}

async function id_selected(ctx){
    ctx.wizard.state.offerId = ctx.message.text;
    
    ctx.replyWithMarkdown(ctx.i18n.t('offer_users_notify_text'))    
    return ctx.wizard.next()
}

async function message_input(ctx){
    ctx.wizard.state.messageText = ctx.message.text;


    ctx.replyWithMarkdown(ctx.i18n.t('offer_users_list_approve_request'), 
        Markup.inlineKeyboard([
            Markup.callbackButton(ctx.i18n.t('yes'), 'offer_activate_approve'),
            Markup.callbackButton(ctx.i18n.t('no'), 'offer_activate_decline'),
    ]).extra())
    
    return ctx.wizard.next()
}

async function leave_scene(ctx){
    if (ctx.update.callback_query.data == 'offer_activate_approve'){
        var offer_id = ctx.wizard.state.offerId;
        var offer = await db.Offer.get_offer(offer_id)
        try {

            var participants = await offer.get_participants()
            if (!participants){
                ctx.reply(ctx.i18n.t('offer_users_list_no_participants'))
                return ctx.scene.leave()    
            }

            var message = ctx.wizard.state.messageText;
            await notify_participants(participants, message)

            ctx.replyWithMarkdown(ctx.i18n.t('offer_users_notify_sent_success'))
            return ctx.scene.leave()
        }catch(error){
            logger.error("FAILED: offer_users_notify.leave_scene %s", error)
            ctx.reply(ctx.i18n.t('error_message'))
            return ctx.scene.leave()
        }
    }

    ctx.reply(ctx.i18n.t('decline_action'))
    return ctx.scene.leave()
}

async function notify_participants(participants, message){
    Object.keys(participants).forEach(async function(key){
        if (!key || !participants[key]){
            return;
        }

        var user_tgId = participants[key].tgId
        var user = await db.User.get_user(user_tgId)
        var chat_id = user.chat_id;

        await bot.telegram.sendMessage(chat_id, message, extra.markdown())
    })
}


steps.action('activate_start', activate_start)

steps.action('offer_activate_approve', leave_scene)
steps.action('offer_activate_decline', leave_scene)


const offer_users_notify = new WizardScene('offer-users-notify-wizard',
    activate_dialog,
    steps,
    id_selected,
    message_input,
    leave_scene
)

logger.info("SUCCESS wizards: offer_users_notify initialized");


module.exports = offer_users_notify;