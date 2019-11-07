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
        var m = "HACKED ATTEMPT: someone try to use activate_dialog " + admin_id
        logger.error(m)
        return ctx.scene.leave()
    }
    
    ctx.replyWithMarkdown(ctx.i18n.t('activate_offer_dialog') , 
    Markup.inlineKeyboard([
        Markup.callbackButton('➡️ Start', 'activate_start')
    ]).extra())
    return ctx.wizard.next()
}

async function activate_start(ctx){
    const telegram_id = ctx.from.id;

    var data = await db.Offer.offers_for(telegram_id)
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

async function id_selected(ctx){
    ctx.wizard.state.offerId = ctx.message.text;
    
    ctx.reply(ctx.i18n.t('activate_offer_channel_select'));
    return ctx.wizard.next()
}

async function channel_selected(ctx){
    ctx.wizard.state.offerChannel = ctx.message.text;
    
    ctx.replyWithMarkdown('Ready to publish?', 
        Markup.inlineKeyboard([
            Markup.callbackButton(ctx.i18n.t('yes'), 'offer_activate_approve'),
            Markup.callbackButton(ctx.i18n.t('no'), 'offer_activate_decline'),
    ]).extra())
    
    return ctx.wizard.next()
}

async function leave_scene(ctx){
    if (ctx.update.callback_query.data == 'offer_activate_approve'){
        var offer_id = ctx.wizard.state.offerId;
        var offer = await db.Offer.get_offer(offer_id);
        if (!offer){
            ctx.reply('Оффер не найден')
        }else{
            try {
                var channel_name = ctx.wizard.state.offerChannel;

                var message = await offer.get_message()

                var button_url = await offer.get_url()

                var kb = Markup.inlineKeyboard([Markup.urlButton(ctx.i18n.t('offer_button'), button_url)])
                var published = await bot.telegram.sendMessage(channel_name, message, extra.markup(kb).markdown())

                if (!published){
                    throw("offer_active:leave_scene failed to published")
                }

                var message_id = published.message_id;
                var chat_id = published.chat.id;
                
                await offer.published(chat_id, message_id)

                await offer.activate()

                ctx.reply(`Оффер успешно опубликован chat_id:${chat_id} message_id:${message_id}`)
            }catch(error){
                logger.error("FAILED: offer_activate leave_scene %s", error)
                ctx.reply('Не получается опубликовать оффер')
            }
        }
    } else{
        ctx.reply('Чтобы начать сначала введите /activate_offer')
    }
    return ctx.scene.leave()
}


activate_steps.action('activate_start', activate_start)

activate_steps.action('offer_activate_approve', leave_scene)
activate_steps.action('offer_activate_decline', leave_scene)


const activate_offer_wizard = new WizardScene('activate-offer-wizard',
    activate_dialog,
    activate_steps,
    id_selected,
    channel_selected,
    leave_scene
)

logger.info("SUCCESS wizards: offer_activate initialized");


module.exports = activate_offer_wizard;