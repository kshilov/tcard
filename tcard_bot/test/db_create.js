'use strict';

var db = require('../models');



db.sequelize.sync({force: true})
//db.sequelize.sync()
.then(() => {
    console.log('Connection has been established successfully.');
})
.catch(err => {
    console.error('Unable to connect to the database:', err);
});