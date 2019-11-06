const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')

const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')

const db = require('../models')

const {providers} = require('../providers')
const bot = providers.bot.bot

const apply_steps = new Composer()

async function apply_dialog(ctx){
    if (!ctx.state.apply_offer_id){
        ctx.replyWithMarkdown(ctx.i18n.t('apply_offer_error'))
        return ctx.scene.leave()    
    }

    var offer = await db.Offer.get_offer(ctx.state.apply_offer_id)
    if (!offer){
        ctx.replyWithMarkdown(ctx.i18n.t('apply_offer_error'))
        return ctx.scene.leave()
    }

    // REGISTER APPLY here
    var offer_hello_message = await offer.get_hello_message()
    ctx.replyWithMarkdown(offer_hello_message)
    return ctx.wizard.next()
}

async function get_input(ctx){
    ctx.wizard.state.offer_hello_input = ctx.message.text;
    return ctx.scene.leave()
}

const apply_offer_wizard = new WizardScene('apply-offer-wizard',
    apply_dialog,
    apply_steps,
    get_input
)

logger.info("SUCCESS wizards: offer_apply initialized");


module.exports = apply_offer_wizard;