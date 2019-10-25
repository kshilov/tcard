'use strict';

const logger = require('../helpers/logger')

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



async function setupi18n(bot) {
  bot.use(i18n.middleware())
}

module.exports = { setupi18n, i18n}
