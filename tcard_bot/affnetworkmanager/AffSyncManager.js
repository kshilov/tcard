'use strict';

const {SyncStatus, SyncType} = require("../helpers/constants");


const polling_interval = process.env.POLLING_INTERVAL;

const axios = require('axios');

const GET_TRANSACTIONS = 'http://127.0.0.1:5000/balance/get/transactions'
const UPDATE_TRANSACTIONS_PAID = 'http://127.0.0.1:5000/balance/update/transactions/paid'

const GET_MESSAGES = 'http://127.0.0.1:5000/messages/get'
const UPDATE_MESSAGES_PUBLISHED = 'http://127.0.0.1:5000/messages/update/published'

class AffSyncManager {
    constructor(ton, db, bot){
        this.ton = ton;
        this.db = db;
        this.bot = bot;

    }

    async init(){
        setInterval(async ()=> {
            this.get_transactions();
            this.get_messages();
            this.listen_updates();
        }, polling_interval)
    }

    async _handle_transactions(transactions){
        await this.db.Sync.create(
            {
                status : SyncStatus.new,
                type : SyncType.transactions,
                message : JSON.stringify(transactions)
            }
        )
    }

    async _handle_messages(messages){
        await this.db.Sync.create(
            {
                status : SyncStatus.new,
                type : SyncType.messages,
                message : JSON.stringify(messages)
            }
        )
    }

    async listen_updates(){
        var tx_updates = await this.db.SyncTransaction.ready_to_sync_array()
        if (tx_updates){
            var data = {
                'aggregated_transaction_ids' : tx_updates
            }
            this.update_transacitons(data)
        }

        var msg_updates = await this.db.SyncMessage.ready_to_sync_array()
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
            this.db.SyncTransaction.sync_list(aggregated_transaction_ids)
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
            this.db.SyncMessage.sync_list(aggregated_messages_ids)
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

const aff_sync_manager = undefined;

async function setupAffSyncManager(ton, db, bot){
    if (aff_sync_manager){
        return aff_sync_manager;
    }

    return new AffSyncManager(ton, db, bot);
}

module.exports = {
    setupAffSyncManager
}
