'use strict';

const tx_polling_interval = process.env.TX_POLLING_INTERVAL;

const {SyncDataStatus, SyncStatus, SyncType} = require("../helpers/constants");

const {deposit_grams} = require("../helpers/tonMethods");

const TO_ADDRESS = 'ce709b5bfca589eb621b5a5786d0b562761144ac48f59e0b0d35ad0973bcdb86';

class BalanceManager {
    constructor(ton, db, bot){
        this.ton = ton;
        this.db = db;
        this.bot = bot;

        this.tx_ids = new Set([]);

        this._action_polling_inprogress = false;
        this._tx_polling_inprogress = false;
    }

    async init(){
        setInterval(async ()=> {
            this._polling_acitons()
            this._polling_transactions()
        }, tx_polling_interval) // we will start polling once an hour to fix if someone broken
    }

    async _polling_acitons() {
        if (this._action_polling_inprogress){
            return;
        }else{
            this._action_polling_inprogress = true;
        }

        try {
            var new_sync = await this.db.Sync.findAll({
                where :{
                    status : SyncStatus.new,
                    type : SyncType.transactions
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
                        await this.db.SyncTransaction.create({
                            aggregated_transaction_id : transaction.id,
                            action_id : action.id,
                            status : SyncDataStatus.new,
                            data : transaction
                        })  
                    }catch(error){
                        console.log("Can't create SyncTransaction:", error)
                    }
                });
                
                action.handled()
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
            var new_txs = await this.db.SyncTransaction.need_to_be_done()

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
                    console.log("Can't handle SyncTransaction:", error)
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

        var wallet = await user.get_wallet()

        try{
            await deposit_grams(this.ton, wallet.wallet_address, amount);
            await tx.add_paid(user.username)
        }catch(error){
            console.log("Can't deposit grams:", error)
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
        var wallet = await user.get_wallet()

        try{
            await wallet.send_grams(this.ton, TO_ADDRESS, amount)
            await tx.add_paid(user.username)
        }catch(error){
            console.log("Can't deposit grams:", error)
        }
    }    
}

const balance_manager = undefined;

async function setupBalanceManager(ton, db, bot){
    if (balance_manager){
        return balance_manager;
    }

    return new BalanceManager(ton, db, bot);
}

module.exports = {
    setupBalanceManager
}
