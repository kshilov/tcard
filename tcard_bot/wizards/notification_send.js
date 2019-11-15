const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const extra = require('telegraf/extra')

const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')

const db = require('../models')

const {providers} = require('../providers')
const bot = providers.bot.bot

const steps = new Composer()

async function activate_dialog(ctx){
    // TODO: remove this on production
    var user = await db.User.get_user(ctx.from.id)
    if (!user.is_admin()){
        var m = "HACKED ATTEMPT: someone try to use activate_dialog offer_activate_button" + user.id
        logger.error(m)
        return ctx.scene.leave()
    }
    
    ctx.replyWithMarkdown('Старт отправки сообщений', 
    Markup.inlineKeyboard([
        Markup.callbackButton('➡️ Начать', 'step_1')
    ]).extra())
    return ctx.wizard.next()
}

async function step_1(ctx){
    ctx.reply('Введите сообщения для отправки')
    return ctx.wizard.next()
}

async function step_2(ctx){
    ctx.wizard.state.notificationMessage = ctx.message.text;

    ctx.reply('Введите список chat_id пользователей через запятую')
    return ctx.wizard.next()
}


async function step_3(ctx){
    ctx.wizard.state.usersList = ctx.message.text;
    
    var list = ctx.wizard.state.usersList.split(',')

    var message = 'Отправляем по этому списку/сообщение?\n'
    message = message + list;

    message = message + '\n\n' + ctx.wizard.state.notificationMessage;

    ctx.replyWithMarkdown(message, 
    Markup.inlineKeyboard([
        Markup.callbackButton(ctx.i18n.t('yes'), 'offer_activate_approve'),
        Markup.callbackButton(ctx.i18n.t('no'), 'offer_activate_decline'),
    ]).extra())
    return ctx.wizard.next()
}

async function step_final(ctx){
    if (ctx.update.callback_query.data == 'offer_activate_approve'){
            try {
                var list = ctx.wizard.state.usersList.split(',')
                var message = ctx.wizard.state.notificationMessage;

                var cant_sent = [];
                list.forEach(async item => {
                    try{
                        if (!item){
                            var m = "Can't send to: " + item
                            logger.error(m)
                            return;
                        }

                        
                        var res = await bot.telegram.sendMessage(item, message, extra.markdown())
                    }catch(error){
                        cant_sent.push(item)
                    }
                })

                var success = 'Не смогли отправить: ' + cant_sent;
                ctx.reply(success)
                return ctx.scene.leave()
            }catch(error){
                logger.error("FAILED: notification_send step_final %s", error)
                ctx.reply('Не отправить уведомление')
                return ctx.scene.leave()
            }
    }

    ctx.reply('Отмена действия')
    return ctx.scene.leave()
}


steps.action('step_1', step_1)

steps.action('offer_activate_approve', step_final)
steps.action('offer_activate_decline', step_final)


const notification_send_wizard = new WizardScene('notification-send-wizard',
    activate_dialog,
    steps,
    step_2,
    step_3,
    step_final
)

logger.info("SUCCESS wizards: notification_send_wizard initialized");


module.exports = notification_send_wizard;