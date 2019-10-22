'use strict';

var express = require('express');
var db = require('../models');

var { bot, startBot, secretPath } = require('../init/bot')
var { ton_client, connectTon } = require('../init/ton')

var {setupAffSyncManager} = require('../affnetworkmanager/AffSyncManager')


//db.sequelize.sync({force: true})
db.sequelize.sync()
.then(() => {
    console.log('Connection has been established successfully.');
})
.catch(err => {
    console.error('Unable to connect to the database:', err);
});


async function main(){

// await setupI18N(bot)

var aff_sync_manager = await setupAffSyncManager(ton_client, db, bot)
aff_sync_manager.init()

// Let's start the bot
// startBot();
}

main()

