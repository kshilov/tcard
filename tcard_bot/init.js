'use strict';

const db = require('./models');

const {commands} = require('./commands')
const {providers} = require('./providers')
const {notifications} = require('./notifications')
const {api} = require('./api')
const {middlewares} = require('./middlewares')

async function init_all(){
    await providers.init();
    await notifications.init();
    await api.init();
    await commands.init();
    await middlewares.init();
}

init_all();

module.exports = { 
    providers,
    notifications,
    api,
    db,
    commands
}
