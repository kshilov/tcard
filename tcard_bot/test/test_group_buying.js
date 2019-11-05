'use strict';

const logger = require('../helpers/logger')

const { providers,
        notifications,
        db
} = require('../init')

const {setupi18n} = require('../middlewares/i18n')
const {setupStages} = require('../middlewares/stage')

const bot = providers.bot.bot


db.sequelize.sync()
.then(() => {
    logger.info('Connection has been established successfully.');
})
.catch(err => {
    logger.info('Unable to connect to the database: %s', err);
});

async function main(){

    await setupi18n(bot);
    await setupStages(bot);

    providers.bot.start()
//    notifications.start()
}

main()