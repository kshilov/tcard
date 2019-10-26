'use strict';

const axios = require('axios');


const db = require('../models')

const logger = require('../helpers/logger')

const aff_domain = process.env.AFF_FRONTEND_DOMAIN
const GET_TRANSACTIONS = aff_domain + '/balance/get/transactions'
const UPDATE_TRANSACTIONS_PAID = aff_domain + '/balance/update/transactions/paid'

const GET_MESSAGES = aff_domain + '/messages/get'
const UPDATE_MESSAGES_PUBLISHED = aff_domain + '/messages/update/published'

const {setupChannelMessageManager} = require('../services/ChannelMessageManager')


async function update_messages(data){
    var aggregated_messages_ids = data['aggregated_messages_ids']
    if (aggregated_messages_ids.length <= 0){
        return;
    }
      
    axios.post(UPDATE_MESSAGES_PUBLISHED, 
        { data : aggregated_messages_ids})
    .then(response => {

    })
    .catch(error => {
        logger.error(error);
    });

}

(async () => {

var message_manager = await setupChannelMessageManager()
var data = {}

var msg_updates = await message_manager.ready_to_sync_array()

msg_updates.push(2)
if (msg_updates){
    data = {
        'aggregated_messages_ids' : msg_updates
    }
}

console.log(data)

await update_messages(data)
})()

