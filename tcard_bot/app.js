'use strict';

const logger = require('./helpers/logger')

const { providers,
        notifications,
        services,
        db
} = require('./init')

const {setupi18n} = require('./middlewares/i18n')

const bot = providers.bot.bot

//const db = require('./models')

//db.sequelize.sync({force: true})
db.sequelize.sync()
.then(() => {
    logger.info('Connection has been established successfully.');
})
.catch(err => {
    logger.info('Unable to connect to the database: %s', err);
});

async function main(){

    await setupi18n(bot);

    providers.bot.start()
    notifications.start()
    services.start()
}

main()