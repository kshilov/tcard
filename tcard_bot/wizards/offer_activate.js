const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const extra = require('telegraf/extra')

const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')

const db = require('../models')

const {providers} = require('../providers')
const bot = providers.bot.bot

const activate_steps = new Composer()

async function activate_dialog(ctx){
    // TODO: remove this on production
    var user = await db.User.get_user(ctx.from.id)

    if (!user.offer_access()){
        var m = "HACKED ATTEMPT: someone try to use activate_dialog offer_activate_button" + user.id
        logger.error(m)
        return ctx.scene.leave()
    }
    
    ctx.replyWithMarkdown(ctx.i18n.t('offer_activate_dialog') , 
    Markup.inlineKeyboard([
        Markup.callbackButton('➡️ Начать', 'step_1')
    ]).extra())
    return ctx.wizard.next()
}

async function step_1(ctx){
    const telegram_id = ctx.from.id;

    var data = await db.Offer.offers_for(telegram_id)
    var exit = false;
    var message = '';

    if (Object.keys(data).length === 0){
        message = await i18n.t(i18n.current_locale, 'offer_activate_select', {offer_list: 'Офферов не найдено'});
        exit = true;
    }else{
        message = await i18n.t(i18n.current_locale, 'offer_activate_select', data);
    }

    ctx.replyWithMarkdown(message)

    if (exit){
        return ctx.scene.leave()
    }
    return ctx.wizard.next()
}

async function step_2(ctx){
    ctx.wizard.state.offerId = ctx.message.text;
    
    ctx.replyWithMarkdown(ctx.i18n.t('offer_activate_message_link'))
    return ctx.wizard.next()
}

async function step_3(ctx){
    ctx.wizard.state.messageLink = ctx.message.text;

    ctx.replyWithMarkdown(ctx.i18n.t('offer_activate_approve_reuqest'), 
    Markup.inlineKeyboard([
        Markup.callbackButton(ctx.i18n.t('yes'), 'offer_activate_approve'),
        Markup.callbackButton(ctx.i18n.t('no'), 'offer_activate_decline'),
    ]).extra())
    return ctx.wizard.next()
}

async function step_final(ctx){
    if (ctx.update.callback_query.data == 'offer_activate_approve'){
        var offer_id = ctx.wizard.state.offerId;
        var offer = await db.Offer.get_offer(offer_id);
        if (!offer){
            ctx.reply(ctx.i18n.t('offer_activate_not_found'))
        }else{
            try {

                var current_user = await db.User.get_user(ctx.from.id);

                var chat_id = message_data.chat_id;
                var message_id = message_data.message_id;

                var ref = offer.generate_ref(chat_id, message_id)

                var offer_button = await offer.get_button(updated=false, ref=ref)
                var message_data = await offer.get_message_source(ctx.wizard.state.messageLink) 
                
                if (!current_user.is_admin()){
                    var is_owner = await bot.telegram.getChatMember(chat_id, ctx.from.id);
                    if (!user.is_channel_admin(is_owner.status)){
                        ctx.replyWithMarkdown(ctx.i18n.t('offer_activate_not_channel_owner'))
                        return ctx.scene.leave() 
                    }
                }
                
                var published = await bot.telegram.editMessageReplyMarkup(chat_id, message_id, 0, offer_button, extra.markup(offer_button).markdown())

                if (!published){
                    throw("offer_activate_button: leave_scene failed to published")
                }

                await offer.published(chat_id, message_id)
                
                await offer.activate()

                ctx.reply(`Оффер успешно активировн chat_id:${chat_id} message_id:${message_id}`)
            }catch(error){
                logger.error("FAILED: offer_activate_button leave_scene %s", error)
                ctx.reply('Не получается опубликовать оффер')
            }
        }
    } else{
        ctx.reply(ctx.i18n.t('decline_action'))
    }
    return ctx.scene.leave()
}


activate_steps.action('step_1', step_1)

activate_steps.action('offer_activate_approve', step_final)
activate_steps.action('offer_activate_decline', step_final)


const offer_activate_wizard = new WizardScene('offer-activate-wizard',
    activate_dialog,
    activate_steps,
    step_2,
    step_3,
    step_final
)

logger.info("SUCCESS wizards: offer_activate_wizard initialized");


module.exports = offer_activate_wizard;