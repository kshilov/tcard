'use strict';

const logger = require('./helpers/logger')

const { providers,
        notifications,
        services,
        db
} = require('./init')

//const db = require('./models')

//db.sequelize.sync({force: true})
db.sequelize.sync()
.then(() => {
    logger.info('Connection has been established successfully.');
})
.catch(err => {
    logger.info('Unable to connect to the database:', err);
});


providers.bot.start()
notifications.start()
services.start()
