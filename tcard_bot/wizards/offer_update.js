const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')

const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')

const db = require('../models')
var {init, offer_manager} = require('../notifications/OfferManager')
const update_manual_steps = new Composer()


async function activate_dialog(ctx){
    // TODO: remove this on production
    var user = await db.User.get_user(ctx.from.id)
    if (!user.is_admin()){
        var m = "HACKED ATTEMPT offer_update.activate_dialog: someone try to use offer_update_manual " + user.id
        logger.error(m)
        return ctx.scene.leave()
    }
    
    ctx.replyWithMarkdown(ctx.i18n.t('offer_update_start') , 
    Markup.inlineKeyboard([
        Markup.callbackButton('➡️ Start', 'activate_start')
    ]).extra())
    return ctx.wizard.next()
}

async function activate_start(ctx){

    var user = await db.User.get_user(ctx.from.id)
    var data = await db.Offer.status_update(user.id)
    
    var exit = false;
    var message = '';

    if (Object.keys(data).length === 0){
        message = await i18n.t(i18n.current_locale, 'offer_update_select', {offer_list: 'Офферов не найдено'});
        exit = true;
    }else{
        message = await i18n.t(i18n.current_locale, 'offer_update_select', data);
    }

    ctx.replyWithMarkdown(message)

    if (exit){
        return ctx.scene.leave()
    }
    return ctx.wizard.next()
}

async function id_selected(ctx){
    ctx.wizard.state.offerId = ctx.message.text;
    
    ctx.replyWithMarkdown(ctx.i18n.t('offer_update_approve_request'), 
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
                logger.error("offer_update.leave_scene: offer_manager not init");
                offer_manager = await init()
            }

            await offer_manager.update_by_id(offer_id)

            ctx.reply(ctx.i18n.t('offer_update_success'))
            return ctx.scene.leave()
        }catch(error){
            logger.error("FAILED: offer_update.leave_scene %s", error)
            ctx.reply(ctx.i18n.t('error_message'))
            return ctx.scene.leave()
        }
    }

    ctx.reply(ctx.i18n.t('decline_action'))
    return ctx.scene.leave()
}


update_manual_steps.action('activate_start', activate_start)

update_manual_steps.action('offer_activate_approve', leave_scene)
update_manual_steps.action('offer_activate_decline', leave_scene)


const offer_update_wizard = new WizardScene('offer-update-wizard',
    activate_dialog,
    update_manual_steps,
    id_selected,
    leave_scene
)

logger.info("SUCCESS wizards: offer_update_wizard initialized");


module.exports = offer_update_wizard;