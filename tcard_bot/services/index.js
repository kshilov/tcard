'use strict';

const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);

const services = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const name = file.split('.').slice(0, -1).join('.')
    const load_name = './' + file.split('.').slice(0, -1).join('.')

    const manager = require(load_name)
    services[name] = manager;
  });


async function init(){
    Object.keys(services).forEach(serviceName => {
        if (services[serviceName].init) {
          services[serviceName].init();
        }
      });
}

async function start(){
    Object.keys(services).forEach(serviceName => {
        if (services[serviceName].start) {
          services[serviceName].start();
        }
      });      
}

services.init = init;
services.start = start;

module.exports = { 
    services
}