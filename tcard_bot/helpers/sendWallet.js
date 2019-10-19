'use strict';

module.exports = async function sendWallet(ctx) {
    await ctx.replyWithMarkdown(ctx.i18n.t('wallet'));
}
  