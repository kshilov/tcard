const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')

const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')

const db = require('../models')

const steps = new Composer()


async function activate_dialog(ctx){
    // TODO: remove this on production
    var user = await db.User.get_user(ctx.from.id)
    if (!user.is_admin()){
        var m = "HACKED ATTEMPT offer_managers_list.activate_dialog: someone try to use offer_managers_list " + user.id
        logger.error(m)
        return ctx.scene.leave()
    }
    
    ctx.replyWithMarkdown(ctx.i18n.t('Список активных менеджеров') , 
    Markup.inlineKeyboard([
        Markup.callbackButton('➡️ Начать', 'activate_start')
    ]).extra())
    return ctx.wizard.next()
}

async function activate_start(ctx){

    var managers = await db.User.all_channel_owners()
    
    var message = '';

    if (Object.keys(managers).length === 0){
        message = await i18n.t(i18n.current_locale, 'offer_managers_list_show', {managers_list: 'Нет активных менеджеров'});
    }else{
        message = await i18n.t(i18n.current_locale, 'offer_managers_list_show', {managers_list: data});
    }

    ctx.replyWithMarkdown(message)
    return ctx.scene.leave()
}



steps.action('activate_start', activate_start)


const offer_managers_list_wizard = new WizardScene('offer-managers-list-wizard',
    activate_dialog,
    steps
)

logger.info("SUCCESS wizards: offer_managers_list_wizard initialized");


module.exports = offer_managers_list_wizard;