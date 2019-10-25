'use strict';

// Dependencies
const I18N = require('telegraf-i18n')

const i18n = new I18N({
  directory: `${__dirname}/../locales`,
  defaultLanguage: 'ru',
  sessionName: 'session',
  useSession: false,
  allowMissing: true,
  skipPluralize: true,
  fallbackToDefaultLanguage: true,
})

async function init(bot) {
  bot.use(i18n.middleware())
}

module.exports = { init, i18n}
