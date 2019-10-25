'use strict';

const db = require('./models');

const {commands} = require('./commands')
const {providers} = require('./providers')
const {notifications} = require('./notifications')
const {services} = require('./services')

const logger = require('./helpers/logger')

async function init_all(){
    try{
        await providers.init();
        await notifications.init();
        await services.init();
        await commands.init();

    }catch(error){
        logger.error("Can't init_all: %s", error)
    }

}

init_all();

module.exports = { 
    providers,
    notifications,
    services,
    db,
    commands
}
