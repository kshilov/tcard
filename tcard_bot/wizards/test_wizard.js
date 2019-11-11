const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')

const extra = require('telegraf/extra')


const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')

const db = require('../models')

const {providers} = require('../providers')
const bot = providers.bot.bot

async function activate_dialog(ctx){
    // TODO: remove this on production
    var admin_id = ctx.from.id;
    if (admin_id != '389959952'){
        var m = "HACKED ATTEMPT: someone try to use activate_dialog " + admin_id
        logger.error(m)
        return ctx.scene.leave()
    }
    
    ctx.reply("Введите любое сообщение: ");
    return ctx.wizard.next()
}


async function step_2(ctx){
    ctx.wizard.state.mm = ctx.message.text;

    logger.error("We are here")
    logger.error(ctx.wizard.state.mm)
    ctx.reply("Конец");

    return ctx.scene.leave()
}



const test_wizard = new WizardScene('test-wizard',
    activate_dialog,
    step_2
)

logger.info("SUCCESS wizards: test_wizard initialized");


module.exports = test_wizard;