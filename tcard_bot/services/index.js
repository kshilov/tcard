'use strict';

const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);

const api = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const name = file.split('.').slice(0, -1).join('.')
    const load_name = './' + file.split('.').slice(0, -1).join('.')

    const manager = require(load_name)
    api[name] = manager;
  });


async function init(){
    Object.keys(api).forEach(apiName => {
        if (api[apiName].init) {
            api[apiName].init();
        }
      });
}

async function start(){
    Object.keys(api).forEach(apiName => {
        if (api[apiName].start) {
            api[apiName].start();
        }
      });      
}

api.init = init;
api.start = start;

module.exports = { 
    api
}