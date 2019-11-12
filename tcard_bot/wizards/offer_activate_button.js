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
    var admin_id = ctx.from.id;
    if (admin_id != '389959952'){
        var m = "HACKED ATTEMPT: someone try to use activate_dialog offer_activate_button" + admin_id
        logger.error(m)
        return ctx.scene.leave()
    }
    
    ctx.replyWithMarkdown(ctx.i18n.t('activate_offer_dialog') , 
    Markup.inlineKeyboard([
        Markup.callbackButton('➡️ Start', 'activate_start')
    ]).extra())
    return ctx.wizard.next()
}

async function step_1(ctx){
    const telegram_id = ctx.from.id;

    var data = await db.Offer.button_offers_for(telegram_id)
    var exit = false;
    var message = '';

    if (Object.keys(data).length === 0){
        message = await i18n.t(i18n.current_locale, 'activate_offer_select', {offer_list: 'There is no offers'});
        exit = true;
    }else{
        message = await i18n.t(i18n.current_locale, 'activate_offer_select', data);
    }

    ctx.replyWithMarkdown(message)

    if (exit){
        return ctx.scene.leave()
    }
    return ctx.wizard.next()
}

async function step_2(ctx){
    ctx.wizard.state.offerId = ctx.message.text;
    
    ctx.replyWithMarkdown('Введите ссылку на сообщение, к которому необходимо добавить кнопку')
    return ctx.wizard.next()
}

async function step_3(ctx){
    ctx.wizard.state.messageLink = ctx.message.text;

    ctx.replyWithMarkdown('Готовы добавить кнопку к сообщению?', 
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
            ctx.reply('Оффер не найден')
        }else{
            try {
                var offer_button = await offer.get_offer_button_keyboard()
                var message_data = await offer.get_message_source(ctx.wizard.state.messageLink) 
                
                var chat_id = message_data.chat_id;
                var message_id = message_data.message_id;
                
                logger.error("chat_id:%s message_id:%s", chat_id, message_id)

                var published = await bot.telegram.editMessageReplyMarkup(chat_id, message_id, 0, offer_button, extra.markup(offer_button).markdown())

                if (!published){
                    throw("offer_activate_button: leave_scene failed to published")
                }

                await offer.published(chat_id, message_id)
                
                await offer.activate()

                ctx.reply(`Оффер успешно опубликован chat_id:${chat_id} message_id:${message_id}`)
            }catch(error){
                logger.error("FAILED: offer_activate_button leave_scene %s", error)
                ctx.reply('Не получается опубликовать оффер')
            }
        }
    } else{
        ctx.reply('Чтобы начать сначала введите /activate_button_offer')
    }
    return ctx.scene.leave()
}


activate_steps.action('activate_start', step_1)

activate_steps.action('offer_activate_approve', step_final)
activate_steps.action('offer_activate_decline', step_final)


const activate_button_offer_wizard = new WizardScene('activate-button-offer-wizard',
    activate_dialog,
    activate_steps,
    step_2,
    step_3,
    step_final
)

logger.info("SUCCESS wizards: activate_button_offer_wizard initialized");


module.exports = activate_button_offer_wizard;