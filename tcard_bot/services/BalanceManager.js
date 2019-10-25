'use strict';

const tx_polling_interval = process.env.TX_POLLING_INTERVAL;

const {QueueStatus, QueueType, SETUP_STEPS} = require("../helpers/constants");

const {deposit_grams} = require("../helpers/tonMethods");

const TO_ADDRESS = 'ce709b5bfca589eb621b5a5786d0b562761144ac48f59e0b0d35ad0973bcdb86';

const db = require('../models')
const logger = require('../helpers/logger')


class BalanceManager {
    constructor(){
        this.db = db;

        this.tx_ids = new Set([]);

        this._action_polling_inprogress = false;
        this._tx_polling_inprogress = false;
        logger.info("... BalanceManager created, waiting for init")
    }

    async init(){
        setInterval(async ()=> {
            this._polling_actions()
            this._polling_transactions()
        }, tx_polling_interval) // we will start polling once an hour to fix if someone broken
        logger.info("STEP %d - SUCCESS: balancemanager.init success", SETUP_STEPS['balancemanager'])
    }

    async _polling_actions() {
        if (this._action_polling_inprogress){
            return;
        }else{
            this._action_polling_inprogress = true;
        }

        try {
            var new_sync = await this.db.RemoteServiceManagerQueue.findAll({
                where :{
                    status : QueueStatus.new,
                    type : QueueType.transactions
                },
                limit : 50
            })

            if (!new_sync){
                throw "There is no new syncs";
            }

            new_sync.array.forEach(async (action) => {
                var message = action.get_message()

                 message.array.forEach(async (transaction) => {
                    try {
                        await this.db.BalanceManagerQueue.create({
                            aggregated_transaction_id : transaction.id,
                            action_id : action.id,
                            status : QueueStatus.new,
                            data : transaction
                        })  
                    }catch(error){
                        logger.error("Can't create BalanceManagerQueue: %s", error)
                    }
                });
                
                action.done()
            });
        }catch(error){
            this._action_polling_inprogress = false;
            return;
        }

        this._action_polling_inprogress = false;
        return;
    }

    async _polling_transactions(){
        if (this._tx_polling_inprogress){
            return;
        }else{
            this._tx_polling_inprogress = true;
        }

        try {
            var new_txs = await this.db.BalanceManagerQueue.need_to_be_done()

            if (!new_txs){
                throw "There is no new transactions";
            }

            new_txs.array.forEach(async (sync_tx) => {
                var data = sync_tx.get_data()
                try {
                    var aff_user = await this.db.User.get_by_username(data.affId) 
                    var adv_user = await this.db.User.get_by_username(data.advId)
                    var user = await this.db.User.get_by_tgid(data.userTgId) 

                    await this._increase_balance(sync_tx, aff_user, data.aff_amount)

                    await this._increase_balance(sync_tx, user, data.user_amount)

                    await this._decrease_balance(sync_tx, adv_user, data.adv_amount)

                }catch(error){
                    logger.error("Can't handle BalanceManagerQueue: %s", error)
                }

                sync_tx.try_to_finish()
            });
        }catch(error){
            this._tx_polling_inprogress = false;
            return;
        }

        this._tx_polling_inprogress = false;
        return;
    }

    async _increase_balance(tx, user, amount){
        if (!tx || !user || tx.already_paid(user.usernmae)){
            return;
        }

        if (amount <= 0){
            return;
        }

        var to_username = user.username;

        try{
            var data = {
                message : 'affiliate commision'
            }
            var wallet_tx = await this.db.WalletTransaction.deposit(to_username, amount, data)
            if (wallet_tx < 0){
                throw "Can't deposot on WalletTransaction"
            }
            await tx.add_paid(to_username)
        }catch(error){
            logger.error("Can't deposit grams: %s", error)
        }
    }

    async _decrease_balance(tx, user, amount){
        if (!tx || !user || tx.already_paid(user.usernmae)){
            return;
        }

        if (amount >= 0){
            return;
        }

        amount = amount * -1;

        try{
            var data = {
                message : 'advert commision'
            }
            var withdraw_from_username = user.username
            var wallet_tx = await this.db.WalletTransaction.withdraw(withdraw_from_username, amount, data)
            if (wallet_tx < 0){
                throw "Can't deposot on WalletTransaction"
            }
            await tx.add_paid(withdraw_from_username)
        }catch(error){
            logger.error("Can't deposit grams: %s", error)
        }
    }
    
    async ready_to_sync_array(){
        var res =  await this.db.BalanceManagerQueue.findAll({
			attributes: ['aggregated_transaction_id'], 
			raw: true,
			where : {
				count : 3,
				status : QueueStatus.done
			},
			limit : 50
		})

		var arr = []
        res.forEach(element => {
            arr.add(element.aggregated_transaction_id)
        });

		return arr;
    }
}

let balance_manager = undefined;

async function setupBalanceManager(){
    if (balance_manager){
        return balance_manager;
    }

    balance_manager = new BalanceManager();

    return balance_manager;
}

module.exports = {
    setupBalanceManager
}
