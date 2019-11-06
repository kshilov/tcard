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
        var res = await offer.add_participant(tgId)
        if (res == OFFER_CODES.exist){
            ctx.replyWithMarkdown(ctx.i18n.t('apply_offer_apply_exist'))
            return ctx.scene.leave()    
        }
    
        if (!res || res <0){
            throw("Can't create participant")
        }

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

    }catch(error){
        logger.error("FAILED: offer_apply.apply_dialog %s", error)
        ctx.replyWithMarkdown(ctx.i18n.t('apply_offer_error'))
        return ctx.scene.leave()    
    }
    return ctx.wizard.next()
}

async function select_slot(ctx){

    try {
        var tgId = ctx.from.id;
        var offer = await db.Offer.get_offer(ctx.wizard.state.apply_offer_id)
        var participant = await offer.get_participant(tgId)

        var slot_selected = await offer.convert_callback_to_slot_value(ctx.update.callback_query.data)
        await participant.set_slot(slot_selected)

        var hello_message = await offer.get_hello_message()
        ctx.replyWithMarkdown(hello_message)
        return ctx.wizard.selectStep(SUM_STEP)   //!! We don't need to ask for slot selection
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
        var participant = await offer.get_participant(tgId)


        var hello_input = ctx.message.text;
        await participant.save_hello_input(hello_input)

        ctx.replyWithMarkdown(ctx.i18n.t('apply_offer_activated'))
        return ctx.scene.leave()
    }catch(error){
        logger.error("FAILED: offer_apply.get_input %s", error)
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
    get_input
)

logger.info("SUCCESS wizards: offer_apply initialized");


module.exports = apply_offer_wizard;