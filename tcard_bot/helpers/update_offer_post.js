'use strict';

const logger = require('./logger')


module.exports = async function updateOffer(ctx, off) {   
    await ctx.replyWithMarkdown(ctx.i18n.t('shop_bot_start_exist'));
}