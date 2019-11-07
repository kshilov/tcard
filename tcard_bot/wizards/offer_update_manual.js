const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const extra = require('telegraf/extra')


const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')

const db = require('../models')

const {providers} = require('../providers')
const bot = providers.bot.bot

const update_manual_steps = new Composer()

var {init, offer_manager} = require('../notifications/OfferManager')

async function activate_dialog(ctx){
    // TODO: remove this on production
    var admin_id = ctx.from.id;
    if (admin_id != '389959952'){
        var m = "HACKED ATTEMPT: someone try to use offer_update_manual " + admin_id
        logger.error(m)
        return ctx.scene.leave()
    }
    
    ctx.replyWithMarkdown("Ready to start manual offer update?" , 
    Markup.inlineKeyboard([
        Markup.callbackButton('➡️ Start', 'activate_start')
    ]).extra())
    return ctx.wizard.next()
}

async function activate_start(ctx){

    var data = await db.Offer.status_update()
    var exit = false;
    var message = '';

    if (Object.keys(data).length === 0){
        message = await i18n.t(i18n.current_locale, 'manual_update_offer_select', {offer_list: 'There is no offers'});
        exit = true;
    }else{
        message = await i18n.t(i18n.current_locale, 'manual_update_offer_select', data);
    }

    ctx.replyWithMarkdown(message)

    if (exit){
        return ctx.scene.leave()
    }
    return ctx.wizard.next()
}

async function id_selected(ctx){
    ctx.wizard.state.offerId = ctx.message.text;
    
    ctx.replyWithMarkdown('Ready to update?', 
        Markup.inlineKeyboard([
            Markup.callbackButton(ctx.i18n.t('yes'), 'offer_activate_approve'),
            Markup.callbackButton(ctx.i18n.t('no'), 'offer_activate_decline'),
    ]).extra())
    
    return ctx.wizard.next()
}


async function leave_scene(ctx){
    if (ctx.update.callback_query.data == 'offer_activate_approve'){
        var offer_id = ctx.wizard.state.offerId;
        try {

            if (!offer_manager){
                logger.error("offer_update_manual leave_scene: offer_manager not init");
                offer_manager = await init()
            }

            await offer_manager.update_by_id(offer_id)

            ctx.reply("Оффер успешно Обновлен")
            return ctx.scene.leave()
        }catch(error){
            logger.error("FAILED: offer_update_manual leave_scene %s", error)
            ctx.reply('Не получается обновить оффер')
            return ctx.scene.leave()
        }
    }

    ctx.reply('Ok не обновляем')
    return ctx.scene.leave()
}


update_manual_steps.action('activate_start', activate_start)

update_manual_steps.action('offer_activate_approve', leave_scene)
update_manual_steps.action('offer_activate_decline', leave_scene)


const update_manual_offer_wizard = new WizardScene('update-manual-offer-wizard',
    activate_dialog,
    update_manual_steps,
    activate_start,
    id_selected,
    leave_scene
)

logger.info("SUCCESS wizards: offer_update_manual initialized");


module.exports = update_manual_offer_wizard;