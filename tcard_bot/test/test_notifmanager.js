'use strict';

var db = require('../models');
var { ton_client, connectTon } = require('../init/ton')
var { setupNotificationManager } = require('../helpers/NotificationManager')

var { bot, startBot, secretPath } = require('../init/bot')

const setupAttachChat = require('./middlewares/attachChat')
const setupLogMessage = require('./middlewares/logMessages')
const { setupStart } = require('./commands/start')
const { setupMenu } = require('./commands/menu')
const { setupI18N } = require('./middlewares/i18n')



async function main(){
    await connectTon();
    const nm = await setupNotificationManager(ton_client, db, bot);

    await nm.init()
    nm.listen_incoming_messages()
}

main()