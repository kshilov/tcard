const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const extra = require('telegraf/extra')

const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')

const db = require('../models')

async function apply_dialog(ctx){
    ctx.reply(ctx.i18n.t('user_city_ask'))
    return ctx.wizard.next()
}

async function leave_scene(ctx){
    ctx.wizard.state.city = ctx.message.text;
    
    try{
        var user = await db.User.get_user(ctx.from.id);
        await user.add_city(ctx.wizard.state.city);

    }catch(error){
        logger.error("ERROR: while asking for city %s", error)
    }

    
    ctx.reply(ctx.i18n.t('thank_you'))
    return ctx.scene.leave()    
}


const user_city_wizard = new WizardScene('user-city-wizard',
    apply_dialog,
    leave_scene
)

logger.info("SUCCESS wizards: user_city_wizard initialized");


module.exports = user_city_wizard;