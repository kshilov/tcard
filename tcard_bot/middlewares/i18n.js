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

function setupI18N(bot) {
  bot.use(i18n.middleware())
}

module.exports = { setupI18N, i18n}
