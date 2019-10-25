'use strict';

const { providers,
        notifications,
        api,
        db
} = require('./init')

//db.sequelize.sync({force: true})
db.sequelize.sync()
.then(() => {
    console.log('Connection has been established successfully.');
})
.catch(err => {
    console.error('Unable to connect to the database:', err);
});

console.log(notifications)

providers.ton.start()
providers.bot.start()
notifications.start()
api.start()

