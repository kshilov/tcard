'use strict';

const db = require('../models');
const AFF_LINK = 'http://127.0.0.1:5000/action'

const logger = require('../helpers/logger')

async function init(bot) {

    /*
    bot.command('task', async ctx => {
        const args = message.text.split(/ +/)
        const task_id = args[1];
        if (!task_id){
            return sendErrorLink(ctx)
        }

        const telegram_id = ctx.from.id;

        const task_url = AFF_LINK + '?' + 'task_id=' + task_id + '&user_id=' + telegram_id;

        return sendTaskLink(ctx, task_url);
    })
    */
}

async function sendErrorLink(ctx) {
    await ctx.replyWithMarkdown(ctx.i18n.t('task_broken_link'));
}

async function sendTaskLink(ctx, task_url) {
    await ctx.replyWithMarkdown(ctx.i18n.t('task_link_message', { task_url : task_url}));
}


  
  // Exports
module.exports = {
    init
}
