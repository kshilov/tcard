const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const extra = require('telegraf/extra')

const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')

const db = require('../models')

async function apply_dialog(ctx){
    ctx.reply(ctx.i18n.t('support_ask'))
    return ctx.wizard.next()
}

async function leave_scene(ctx){
    ctx.wizard.state.supportMessage = ctx.message.text;
    
    try{
        var ticket = await db.Support.create_ticket(ctx.from.id, ctx.wizard.state.supportMessage);

    }catch(error){
        logger.error("ERROR: while asking for city %s", error)
    }
    
    ctx.reply(ctx.i18n.t('thank_you_support'))
    return ctx.scene.leave()    
}


const support_wizard = new WizardScene('support-wizard',
    apply_dialog,
    leave_scene
)

logger.info("SUCCESS wizards: user_city_wizard initialized");


module.exports = support_wizard;