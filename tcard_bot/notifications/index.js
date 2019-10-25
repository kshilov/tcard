'use strict';

const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);

const notifications = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const name = file.split('.').slice(0, -1).join('.')
    const load_name = './' + file.split('.').slice(0, -1).join('.')

    const manager = require(load_name)
    notifications[name] = manager;
  });


async function init(){
    Object.keys(notifications).forEach(managerName => {
        if (notifications[managerName].init) {
          notifications[managerName].init();
        }
      });
}

async function start(){
    Object.keys(notifications).forEach(managerName => {
        if (notifications[managerName].start) {
          notifications[managerName].start();
        }
      });      
}

notifications.init = init;
notifications.start = start;

module.exports = { 
  notifications
}
