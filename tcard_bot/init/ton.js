'use strict';

const { TONClient } = require('ton-client-node-js');
const TON_URL = process.env.TON_URL || 'http://157.230.108.75';


const ton_client = new TONClient();
ton_client.config.setData({
    servers: [TON_URL]
});

async function connectTon() {
    await ton_client.setup();
}



// Export bot
module.exports = { ton_client, connectTon }