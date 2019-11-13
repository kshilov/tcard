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

const FINISHED_ANSWER_STEP = 3;

const apply_steps = new Composer()

async function apply_dialog(ctx){

    if (!ctx.state.apply_offer_id){
        ctx.replyWithMarkdown(ctx.i18n.t('offer_apply_error_id'))
        return ctx.scene.leave()    
    }

    ctx.wizard.state.apply_offer_id = ctx.state.apply_offer_id

    var offer = await db.Offer.get_offer(ctx.wizard.state.apply_offer_id)
    if (!offer){
        ctx.replyWithMarkdown(ctx.i18n.t('offer_apply_error_offer'))
        return ctx.scene.leave()
    }

    if(offer.is_finished()){
        ctx.replyWithMarkdown(ctx.i18n.t('offer_apply_finished'))
        return ctx.scene.leave()
    }

    try{
        var tgId = ctx.from.id;
        var exist = await offer.get_participant(tgId)
        if (exist){
            ctx.replyWithMarkdown(ctx.i18n.t('offer_apply_exist'))
            return ctx.scene.leave()    
        }
    
        ctx.replyWithMarkdown(ctx.i18n.t('offer_apply_dialog'), Markup.inlineKeyboard([
            Markup.callbackButton('➡️ Начать', 'start_answer')
        ]).extra())
        return ctx.wizard.next()
    
    }catch(error){
        logger.error("FAILED: apply_offer_custom_dialog_wizard.apply_dialog %s", error)
        ctx.replyWithMarkdown(ctx.i18n.t('offer_apply_error_unknown'))
        return ctx.scene.leave()    
    }
}

async function start_answer(ctx){
    var offer_id = ctx.wizard.state.apply_offer_id;
    var offer = await db.Offer.get_offer(offer_id)
    
    ctx.wizard.state.questions_list = await offer.get_questions_list()

    if (!ctx.wizard.state.questions_list){
        ctx.replyWithMarkdown(ctx.i18n.t('offer_apply_error_no_questions'))
        return ctx.scene.leave()  
    }

    var question = ctx.wizard.state.questions_list.shift()
    ctx.wizard.state.answers_list = []

    ctx.replyWithMarkdown(question)
    return ctx.wizard.next()
}

async function progress_answer(ctx) {

    ctx.wizard.state.answers_list.push(ctx.message.text)

    var next_question = ctx.wizard.state.questions_list.shift()

    if (!next_question){
        show_preview(ctx)
        return ctx.wizard.next()
    }else{
        ctx.replyWithMarkdown(next_question)
        return ctx.wizard.selectStep(ctx.wizard.cursor)
    }
}

async function finished_answer(ctx) {
    
    if (ctx.update.callback_query && ctx.update.callback_query.data == 'answers_edit'){
        ctx.reply(ctx.i18n.t('offer_apply_questions_edit'));
        return ctx.wizard.next()
    }

    return finished(ctx)
}

async function edit_answer(ctx){
    ctx.wizard.state.edit_num = ctx.message.text;
    ctx.wizard.state.edit_num = ctx.wizard.state.edit_num - 1;

    var answer = ctx.wizard.state.answers_list[ctx.wizard.state.edit_num];

    var message = answer + '\n\n'
    message = message + 'заменить на - введите правильный вариант: \n\n';

    ctx.reply(message);
    return ctx.wizard.next()
}

async function apply_edit(ctx){
    var new_varian = ctx.message.text;

    ctx.wizard.state.answers_list[ctx.wizard.state.edit_num] = new_varian;
    
    show_preview(ctx)
    return ctx.wizard.selectStep(FINISHED_ANSWER_STEP)
}

async function finished(ctx){

    try {
        var tgId = ctx.from.id;
        var offer = await db.Offer.get_offer(ctx.wizard.state.apply_offer_id)

        var data = ctx.wizard.state;

        await join_qa(offer, data)

        var added = await offer.add_participant(tgId, data)

        if (added <= 0){
            throw("Can't add participant")
        }

        ctx.replyWithMarkdown(ctx.i18n.t('offer_apply_activated'))
    }catch(error){
        logger.error("FAILED: apply_offer_custom_dialog_wizard.finished %s", error)
        ctx.replyWithMarkdown(ctx.i18n.t('offer_apply_error_finished_unknown'))
    }

    return ctx.scene.leave()
}

async function join_qa(offer, data){
    var question_list = await offer.get_questions_list();
    var answers_list = data.answers_list;

    var i = 0;
    var new_data = []
    question_list.forEach(item => {
        new_data.push(
            {
                question:item,
                answer: answers_list[i]
            }
        )
        i = i + 1;
    })

    data.answers_list = new_data;
    return;
}

/* this is not a step - it's a working function */
function show_preview(ctx){
    var message = 'Проверим ответы: \n'

    var i = 1;
    ctx.wizard.state.answers_list.forEach(item => {
        message = message + ' ' + i + '. ' + item + '\n';
        i = i + 1;
    })

    ctx.replyWithMarkdown(message, 
    Markup.inlineKeyboard([
        Markup.callbackButton(ctx.i18n.t('offer_apply_edit'), 'answers_edit'),
        Markup.callbackButton(ctx.i18n.t('offer_apply_approve'), 'answers_approve'),
    ]).extra())


}



apply_steps.action('start_answer', start_answer)

apply_steps.action('answers_edit', finished_answer)
apply_steps.action('answers_approve', finished_answer)



const offer_apply_wizard = new WizardScene('offer-apply-wizard',
    apply_dialog,
    apply_steps,
    progress_answer,
    finished_answer,
    edit_answer,
    apply_edit
)

logger.info("SUCCESS wizards: offer_apply_wizard initialized");


module.exports = offer_apply_wizard;