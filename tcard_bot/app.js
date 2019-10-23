'use strict';

var express = require('express');
var db = require('./models');

var app = express();

var { bot, startBot, secretPath } = require('./init/bot')
var { ton_client, connectTon } = require('./init/ton')


const setupAttachChat = require('./middlewares/attachChat')
const setupLogMessage = require('./middlewares/logMessages')
const { setupStart } = require('./commands/start')
const { setupMenu } = require('./commands/menu')
const { setupWallet } = require('./commands/wallet')

const {setupI18N} = require('./middlewares/i18n')
const { setupNotificationManager } = require('./helpers/NotificationManager')


//db.sequelize.sync({force: true})
db.sequelize.sync()
.then(() => {
    console.log('Connection has been established successfully.');
})
.catch(err => {
    console.error('Unable to connect to the database:', err);
});

// bot.command('validation', ctx => ctx.reply('success'));

async function main(){

await setupI18N(bot)
await setupStart(bot)
await setupLogMessage(bot)
await setupMenu(bot)


// Connect to Ton network
await connectTon();


await setupWallet(bot, ton_client)

/*
var nm = await setupNotificationManager(ton_client, db, bot)
await nm.init()
nm.listen_incoming_messages()
*/

// Let's start the bot
startBot();
}

main()

/*
app.use(bot.webhookCallback(`/${secretPath}`))
app.listen(5000, () => {
    console.log('Example app listening on port 5000 !')
})*/