const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const extra = require('telegraf/extra')


const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')

const db = require('../models')

const {providers} = require('../providers')
const bot = providers.bot.bot

const {OFFER_TYPE, OFFER_STATUS, OFFER_CODES} = require("../helpers/constants");

const SUM_STEP = 3;
const BUTTON_OFFER_STEP = 4;

const apply_steps = new Composer()

async function apply_dialog(ctx){

    if (!ctx.state.apply_offer_id){
        ctx.replyWithMarkdown(ctx.i18n.t('apply_offer_error'))
        return ctx.scene.leave()    
    }

    ctx.wizard.state.apply_offer_id = ctx.state.apply_offer_id

    var offer = await db.Offer.get_offer(ctx.wizard.state.apply_offer_id)
    if (!offer){
        ctx.replyWithMarkdown(ctx.i18n.t('apply_offer_error'))
        return ctx.scene.leave()
    }

    if(offer.is_finished()){
        ctx.replyWithMarkdown(ctx.i18n.t('apply_offer_finished'))
        return ctx.scene.leave()
    }

    try{
        var tgId = ctx.from.id;
        var exist = await offer.get_participant(tgId)
        if (exist){
            ctx.replyWithMarkdown(ctx.i18n.t('apply_offer_apply_exist'))
            return ctx.scene.leave()    
        }
    

        if (offer.type == OFFER_TYPE.button){
            ctx.replyWithMarkdown(ctx.i18n.t('offer_button_product_info'))
            return ctx.wizard.selectStep(BUTTON_OFFER_STEP)   //!! We don't need to ask for slot selection
        }else{
            //DEPRECATED: need to remove it in the near time
                if (!offer.is_sum()){
                    var hello_message = await offer.get_hello_message()
                    ctx.replyWithMarkdown(hello_message)
                    return ctx.wizard.selectStep(SUM_STEP)   //!! We don't need to ask for slot selection
                }else{
                    var values = await offer.get_slot_message()
                    var slot_message = values.message;
                    var keyboard = values.keyboard;
                    
                    ctx.replyWithMarkdown(slot_message, extra.markup(keyboard).markdown())
                    return ctx.wizard.next()
                }
        }

    }catch(error){
        logger.error("FAILED: offer_apply.apply_dialog %s", error)
        ctx.replyWithMarkdown(ctx.i18n.t('apply_offer_error'))
        return ctx.scene.leave()    
    }
}

async function select_slot(ctx){

    try {
        var offer = await db.Offer.get_offer(ctx.wizard.state.apply_offer_id)

        ctx.wizard.state.slot_selected = await offer.convert_callback_to_slot_value(ctx.update.callback_query.data)

        var hello_message = await offer.get_hello_message()
        ctx.replyWithMarkdown(hello_message)
        return ctx.wizard.selectStep(SUM_STEP)   //!! NTR: if we use next() here - select_slot called again
    }catch(error){
        logger.error("FAILED: offer_apply.select_slot %s", error)
        ctx.replyWithMarkdown(ctx.i18n.t('apply_offer_error'))
        return ctx.scene.leave()
    }
}


async function get_input(ctx){

    try {
        var tgId = ctx.from.id;
        var offer = await db.Offer.get_offer(ctx.wizard.state.apply_offer_id)

        ctx.wizard.state.hello_input = ctx.message.text;
     
        var added = await offer.add_participant(tgId, ctx.wizard.state)

        if (added <= 0){
            throw("Can't add participant")
        }

        ctx.replyWithMarkdown(ctx.i18n.t('apply_offer_activated'))
        return ctx.scene.leave()
    }catch(error){
        logger.error("FAILED: offer_apply.get_input %s", error)
        ctx.replyWithMarkdown(ctx.i18n.t('apply_offer_error'))
        return ctx.scene.leave()
    }
}

async function button_offer_step_1(ctx) {
    ctx.wizard.state.order_comment = ctx.message.text;
    
    ctx.replyWithMarkdown(ctx.i18n.t('offer_button_user_info'))
    return ctx.wizard.next()
}

async function button_offer_step_2(ctx) {
    ctx.wizard.state.user_info = ctx.message.text;
    
    ctx.replyWithMarkdown(ctx.i18n.t('offer_button_delivery_type'))
    return ctx.wizard.next()

}


async function button_offer_step_3(ctx) {
    ctx.wizard.state.delivery_type = ctx.message.text;
    
    ctx.replyWithMarkdown(ctx.i18n.t('offer_button_delivery_address'))
    return ctx.wizard.next()
}

async function button_offer_step_4(ctx) {

    try {
        var tgId = ctx.from.id;
        var offer = await db.Offer.get_offer(ctx.wizard.state.apply_offer_id)

        ctx.wizard.state.delivery_address = ctx.message.text;
     
        var added = await offer.add_participant(tgId, ctx.wizard.state)

        if (added <= 0){
            throw("Can't add participant")
        }

        ctx.replyWithMarkdown(ctx.i18n.t('apply_offer_activated'))
        return ctx.scene.leave()
    }catch(error){
        logger.error("FAILED: offer_apply.button_offer_step_4 %s", error)
        ctx.replyWithMarkdown(ctx.i18n.t('apply_offer_error'))
        return ctx.scene.leave()
    }
}



apply_steps.action('value-0', select_slot)
apply_steps.action('value-1', select_slot)
apply_steps.action('value-2', select_slot)
apply_steps.action('value-3', select_slot)
apply_steps.action('value-4', select_slot)


const apply_offer_wizard = new WizardScene('apply-offer-wizard',
    apply_dialog,
    apply_steps,
    select_slot,
    get_input,

    button_offer_step_1,
    button_offer_step_2,
    button_offer_step_3,
    button_offer_step_4

)

logger.info("SUCCESS wizards: offer_apply initialized");


module.exports = apply_offer_wizard;