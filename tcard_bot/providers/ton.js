'use strict';
/*
const { TONClient } = require('ton-client-node-js');
const TON_URL = process.env.TON_URL || 'http://157.230.108.75';
const {SETUP_STEPS} = require("../helpers/constants");


const ton = new TONClient();
ton.config.setData({
    servers: [TON_URL]
});

async function start() {
    try {
        await ton.setup();
    }catch(err){
        console.log("STEP %d - FAILED: can't start ton:",SETUP_STEPS['ton'], err);
        return;
    }
        console.log("STEP %d - SUCCESS: ton connected to URL:",SETUP_STEPS['ton'], TON_URL);

}



// Export bot
module.exports = { ton, start }

*/