'use strict';

const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);

const providers = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const name = file.split('.').slice(0, -1).join('.')
    const load_name = './' + file.split('.').slice(0, -1).join('.')

    const provider = require(load_name)
    providers[name] = provider;

  });


async function init(){
    Object.keys(providers).forEach(providerName => {
        if (providers[providerName].init) {
            providers[providerName].init();
        }
      });
}

async function start(){
    Object.keys(providers).forEach(providerName => {
        if (providers[providerName].start) {
            providers[providerName].start();
        }
      });      
}

providers.init = init;
providers.start = start;

module.exports = { 
    providers
}