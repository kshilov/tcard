'use strict';

const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);

const {providers} = require('../providers')

const bot = providers.bot.bot
 
const logger = require('../helpers/logger')

const commands = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const name = file.split('.').slice(0, -1).join('.')
    const load_name = './' + file.split('.').slice(0, -1).join('.')

    const command = require(load_name)
    commands[name] = command;
  });


async function init(){
    Object.keys(commands).forEach(cmdName => {
        if (commands[cmdName].init) {
            commands[cmdName].init(bot);
        }
      });
}

commands.init = init;

module.exports = { 
    commands
}