'use strict';

const db = require('../models');

var { bot, startBot, secretPath } = require('../providers/bot')
var { ton_client, connectTon } = require('../providers/ton')


const setupAttachChat = require('../middlewares/attachChat')
const setupLogMessage = require('../middlewares/logMessages')
const { setupStart } = require('../commands/start')
const { setupMenu } = require('../commands/menu')
const { setupWallet } = require('../commands/wallet')

const {setupI18N} = require('../middlewares/i18n')
const { setupNotificationManager } = require('../notifications/TonWalletNotificationManager')

var {setupRemoteServiceManager} = require('../api/RemoteServiceManager')


//db.sequelize.sync({force: true})
db.sequelize.sync()
.then(() => {
    console.log('Connection has been established successfully.');
})
.catch(err => {
    console.error('Unable to connect to the database:', err);
});


async function main(){
    await setupI18N(bot)
    await setupStart(bot)
    await setupLogMessage(bot)
    await setupMenu(bot)
    
    
    // Connect to Ton network
    await connectTon();
    
    
    await setupWallet(bot, ton_client)

    var nm = await setupNotificationManager(ton_client, db, bot)
    await nm.init()
    nm.listen_incoming_messages()


    var aff_sync_manager = await setupRemoteServiceManager(ton_client, db, bot)
    await aff_sync_manager.init()
    await aff_sync_manager.init_managers()

// Let's start the bot
    startBot();
}

main()

