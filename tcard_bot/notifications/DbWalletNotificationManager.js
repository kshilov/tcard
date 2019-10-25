'use strict';

const db = require('../models')

const polling_interval = process.env.TX_WALLET_POLLING_INTERVAL;

const {TXWalletType, TXWalletStatus} = require("../helpers/constants");

const logger = require('../helpers/logger')

class DbWalletNotificationManager{
       
    constructor(){
        this.db = db;

        this._polling = false;
        this._handling = false;
    }

    async init() {
        this._polling = false;
        this._handling = false;

        await this._transactions_subscribe();
      
        setInterval(async ()=> {
            this._polling_transactions();
        }, polling_interval)
    }

    async _transactions_subscribe() {
        this.db.WalletTransaction.afterCreate( transaction => {
            this._handle_transaction(transaction)
        })
    }

    async _polling_transactions(){
        if (this._polling){
            return;
        }else{
            this._polling = true;
        }

        try {
            var new_txs = await this.db.WalletTransaction.need_to_be_done()
            
            new_txs.forEach(tx => {
                this._handle_transaction(tx)
            });
        
        }catch(err){
            logger.error("_polling_transactions error:", err)
        }

        this._polling = false;

    }

    async _handle_transaction(transaction){
        if (this._handling){
            return;
        }else{
            this._handling = true;
        }

        try {
            if (transaction.status == TXWalletStatus.done){
                throw "Attempt to handle TXWalletStatus.done twice"
            }

            if (transaction.type == TXWalletType.send){
                await this._handle_transfer(transaction)
            }else if (transaction.type == TXWalletType.deposit){
                await  this._handle_deposit(transaction)
            }else if (transaction.type == TXWalletType.withdraw){
                await this._handle_withdraw(transaction)
            }else if (transaction.type == TXWalletType.lottery_prize){
                await this._handle_lottery_prize(transaction)
            }
        }catch(err){
            logger.error("_handle_transaction error:", err)
        }

        this._handling = false;
    }

    async _handle_transfer(transaction){
        var to_username = transaction.to_username;
        var amount = transaction.amount;

        var to_user = this.db.User.get_user_by_name(to_username)
        var to_tgId = to_user.telegram_id

        var to_wallet = to_user.get_wallet()

        var res = await to_wallet.deposit(amount)

        if (res < 0){
            return await transaction.failed()
        }

        await transaction.done()

        var data = {
            from_username : transaction.from_username,
            amount : amount,
            to_username : to_username
        }

        /* NOTIFICATE USER - !!IMPORTANT */
        this.db.BotNotificationManagerQueue.received_money(to_tgId, data)
    }

    async _handle_deposit(transaction){
        var to_username = transaction.to_username;
        var amount = transaction.amount;

        var to_user = this.db.User.get_user_by_name(to_username)
        var to_tgId = to_user.telegram_id

        var to_wallet = to_user.get_wallet()

        var res = await to_wallet.deposit(amount)

        if (res < 0){
            return await transaction.failed()
        }

        await transaction.done()

        var data = {
            amount : amount,
            to_username : to_username,
            reason : await transaction.get_data()
        }

        /* NOTIFICATE USER - !!IMPORTANT */
        this.db.BotNotificationManagerQueue.deposit(to_tgId, data)
    }

    async _handle_withdraw(transaction){
        var withdraw_from_username = transaction.from_username;
        var amount = transaction.amount;

        var withdraw_from_user = this.db.User.get_user_by_name(withdraw_from_username)
        var withdraw_from_user_tgId = withdraw_from_user.telegram_id

        var withdraw_from_wallet = withdraw_from_user.get_wallet()

        var res = await withdraw_from_wallet.withdraw(amount)

        if (res < 0){
            return await transaction.failed()
        }

        await transaction.done()

        var data = {
            amount : amount,
            username : withdraw_from_username,
            reason : await transaction.get_data()
        }

        /* NOTIFICATE USER - !!IMPORTANT */
        this.db.BotNotificationManagerQueue.withdraw(withdraw_from_user_tgId, data)

    }

    async _handle_lottery_prize(transaction){
        var to_username = transaction.to_username;
        var amount = transaction.amount;

        var to_user = this.db.User.get_user_by_name(to_username)
        var to_tgId = to_user.telegram_id

        var to_wallet = to_user.get_wallet()

        var res = await to_wallet.deposit(amount)

        if (res < 0){
            return await transaction.failed()
        }

        await transaction.done()

        var data = {
            amount : amount,
            to_username : to_username,
            reason : await transaction.get_data()
        }

        /* NOTIFICATE USER - !!IMPORTANT */
        this.db.BotNotificationManagerQueue.received_prize(to_tgId, data)
    }





}


let db_notifcation_manager = undefined;
async function init() {
    if (!db_notifcation_manager){
        db_notifcation_manager = new DbWalletNotificationManager();
    }

    await db_notifcation_manager.init()
}
    

module.exports = {
    init
}