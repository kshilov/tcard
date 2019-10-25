'use strict';

const {RSManagerQueueStatus, RSManagerQueueType, SETUP_STEPS} = require("../helpers/constants");


const polling_interval = process.env.POLLING_INTERVAL;

const axios = require('axios');

const {setupBalanceManager} = require('./BalanceManager')
const {setupChannelMessageManager} = require('./ChannelMessageManager')

const db = require('../models')


const GET_TRANSACTIONS = 'http://127.0.0.1:5000/balance/get/transactions'
const UPDATE_TRANSACTIONS_PAID = 'http://127.0.0.1:5000/balance/update/transactions/paid'

const GET_MESSAGES = 'http://127.0.0.1:5000/messages/get'
const UPDATE_MESSAGES_PUBLISHED = 'http://127.0.0.1:5000/messages/update/published'

class RemoteServiceManager {
    constructor(){
        this.db = db;
        console.log("... RemoteServiceManager created, waiting for init")
    }

    async init(){
        setInterval(async ()=> {
            this.get_transactions();
            this.get_messages();
            this.listen_updates();
        }, polling_interval)

        console.log("Step %d - SUCCESS: RemoteServiceManager initialized", SETUP_STEPS['RemoteServiceManager']);
        console.log("... waiting for init_managers");
    }

    async init_managers(){
        try {
            this.balance_manager = await setupBalanceManager()
            this.message_manager = await setupChannelMessageManager()

            await this.balance_manager.init()
            await this.message_manager.init()
        }catch(error){
            console.log("STEP %d - FAILED: RemoteServiceManager.init_managers error", SETUP_STEPS['RemoteServiceManager'], error)
        }finally{
            console.log("STEP %d - SUCCESS: RemoteServiceManager.init_managers", SETUP_STEPS['RemoteServiceManager'])
        }
    }

    async _handle_transactions(transactions){
        await this.db.RemoteServiceManagerQueue.create(
            {
                status : RSManagerQueueStatus.new,
                type : RSManagerQueueType.transactions,
                message : JSON.stringify(transactions)
            }
        )
    }

    async _handle_messages(messages){
        await this.db.RemoteServiceManagerQueue.create(
            {
                status : RSManagerQueueStatus.new,
                type : RSManagerQueueType.messages,
                message : JSON.stringify(messages)
            }
        )
    }

    async listen_updates(){
        var tx_updates = await this.balance_manager.ready_to_sync_array()
        if (tx_updates){
            var data = {
                'aggregated_transaction_ids' : tx_updates
            }
            this.update_transacitons(data)
        }

        var msg_updates = await this.message_manager.ready_to_sync_array()
        if (msg_updates){
            var data = {
                'aggregated_messages_ids' : msg_updates
            }
            this.update_messages(data)
        }

    }


    async update_transacitons(data){
        var aggregated_transaction_ids = data['aggregated_transaction_ids']
        if (aggregated_transaction_ids.length <= 0){
            return;
        }
        axios.post(UPDATE_TRANSACTIONS_PAID, 
            JSON.stringify(aggregated_transaction_ids))
        .then(response => {
            this.db.BalanceManagerQueue.sync_list(aggregated_transaction_ids)
        })
        .catch(error => {
          console.log(error);
        });
    }

    async update_messages(data){
        var aggregated_messages_ids = data['aggregated_messages_ids']
        if (remote_msgs_ids.length <= 0){
            return;
        }
        axios.post(UPDATE_MESSAGES_PUBLISHED, 
            JSON.stringify(aggregated_messages_ids))
        .then(response => {
            this.db.ChannelMessageManagerQueue.sync_list(aggregated_messages_ids)
        })
        .catch(error => {
          console.log(error);
        });

    }

    async get_transactions(){
        axios.get(GET_TRANSACTIONS)
        .then(response => {
            this._handle_transactions(response.data)
        })
        .catch(error => {
          console.log(error);
        });
    }

    async get_messages(){
        axios.get(GET_MESSAGES)
        .then(response => {
            this._handle_messages(response.data)
        })
        .catch(error => {
          console.log(error);
        });

    }
}

let aff_sync_manager = undefined;

async function init(){
    if (!aff_sync_manager){
        aff_sync_manager = new RemoteServiceManager();
    }

    await aff_sync_manager.init()
    await aff_sync_manager.init_managers()

}

module.exports = {
    init
}
