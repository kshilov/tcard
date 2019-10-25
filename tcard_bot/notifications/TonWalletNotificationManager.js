'use strict';

/*
const { ton_subcribe_incomming_messages } = require("../helpers/tonMethods");

let notification_manager;

const {ActionType, ActionStatus} = require("../helpers/constants");

const { i18n } = require('../middlewares/i18n')

const {providers} = require('../providers')

const ton = providers.ton.ton
const bot = providers.bot.bot
const db = require('../models')

class TonWalletNotificationManager{
       
    constructor(ton, db, bot){
        this.ton = ton;
        this.db = db;
        this.bot = bot;

        this.wallets = new Set([])
        this.handled_messages_id = new Set([])

        this.subscription_inc_message = undefined
    }

    async _deserealize_wallet_recieved_message(message){

        var from_address = message.header.IntMsgInfo.src.AddrStd.address
        
        var from_username = await this.db.TonWallet.findOne({
            where : {
                wallet_address : from_address
            }
        });

        if (from_username){
            from_username = await from_username.getUser()
            from_username = from_username.username
        }

        var res = {
            from_username : from_username,
            from_address : from_address,
            to_address : message.header.IntMsgInfo.dst.AddrStd.address,
            grams : Number(message.header.IntMsgInfo.value.Grams),
            ihr_fee : message.header.IntMsgInfo.ihr_fee,
            fwd_fee : message.header.IntMsgInfo.fwd_fee
        }

        return res;
    }

    async init() {
        await this._load_wallets()
        await this._actions_subscribe()
    }

    async _load_wallets(){
        var res =  await this.db.TonWallet.findAll({attributes: ['wallet_address'], raw: true})
        
        res.forEach(element => {
            this.wallets.add(element.wallet_address)
        });
    }

    async _actions_subscribe() {
        this.db.TonWalletTransaction.afterCreate( action => {
            this._handle_action(action)
        })
    }

    async _handle_action(action) {
        try {
            if (action.status == ActionStatus.handled){
                return;
            }

            if (action.type == ActionType.wallet_recieved){
                this._handle_action_wallet_received(action)

            }else if (action.type == ActionType.wallet_creation) {
                // this._handle_action_wallet_creation(action)
            }
        } catch(e){
            console.log("_handle_action catch", e)
        }
    }
    
    async _handle_action_wallet_received(action){
        var message = await action.get_message();
        if (!message){
            return;
        }

        var data = await this._deserealize_wallet_recieved_message(message)

        var grams = data.grams
        var to_wallet = await this.db.TonWallet.findOne({
             where: {
                wallet_address : data.to_address
                }
        })

        if (!to_wallet){
            return;
        }

        var to_user = await this.db.User.findOne({
            where: {
                id : to_wallet.UserId
            }
        })

        if (!to_user){
            return;
        }

        this._send_chat_notification(to_user, data, ActionType.wallet_recieved)

        action.done()
    }
    
    async _get_notification_message(data, action_type){
        if (action_type == ActionType.wallet_recieved){
            return await i18n.t('wallet_received', data)
        }else if (action_type == ActionType.wallet_creation){

        }
    }

    async _send_chat_notification(to_user, data, action_type){
        var message = await this._get_notification_message(data, action_type)

        var chat_id = to_user.chat_id
        if (!chat_id){
            console.log("** There is no chat_id for user:", to_user.id)
            return;
        }

        this.bot.telegram.sendMessage(chat_id, message)
    }


    async log_wallet_send(user, to_username, message){
        action = await this.db.TonWalletTransaction.build(
            {
                type: ActionType.wallet_send,
                message: message,
                from_username : user.username,
                to_username : to_username
            }
        )
			
        action.UserId = user.id
        await action.save()
    }

    async add_wallet(wallet_address) {
       await this.wallets.add(wallet_address);

       await this.resubscribe()
    }

    async listen_incoming_transactions(){
        
        const format_t = `
            id
            status
            in_message {
            header {
                ... on MessageHeaderIntMsgInfoVariant {
                    IntMsgInfo {
                        created_lt
                        created_at
                        ihr_fee
                        fwd_fee
                        value {
                                Grams
                            }
                            src {
                                ...on MsgAddressIntAddrStdVariant {
                                    AddrStd {
                                        address
                                        }
                                    }
                            }
                            dst {
                                ...on MsgAddressIntAddrStdVariant{
                                    AddrStd {
                                        address
                                        }
                                    }
                            }
                        }
                    }
                    }
                }
       `;
    
    
        const subscription = await this.ton.queries.transactions.subscribe(
            { 
                status : {eq: 'Finalized'}, 
                account_addr : {in: arr},
                in_message : {
                    header: {
                        IntMsgInfo: {
                            created_at : {gt : 0}
                        }
                  }
                }
            }, 
                format_t, 
                (e, d) => {
            this._handle_incoming_transaction(e, d)
        });

        
    }

    async resubscribe() {
        if (!this.subscription_inc_message){
            return;
        }

        await this.subscription_inc_message.unsubscribe();

        await this.listen_incoming_messages()
    }

    async listen_incoming_messages(){
        const format_m = `
                id
                status
                transaction_id
                header {
                    ... on MessageHeaderIntMsgInfoVariant {
                        IntMsgInfo {
                            created_at
                            ihr_fee
                            fwd_fee
                            value {
                                    Grams
                                }
                                src {
                                    ...on MsgAddressIntAddrStdVariant {
                                        AddrStd {
                                            address
                                            }
                                        }
                                }
                                dst {
                                    ...on MsgAddressIntAddrStdVariant{
                                        AddrStd {
                                            address
                                            }
                                        }
                                }
                            }
                        }
                }
            `;

        var arr = Array.from(this.wallets)

        this.subscription_inc_message = await this.ton.queries.messages.subscribe(
            { 
                status : {eq: 'Finalized'}, 
                    header: {
                        IntMsgInfo: {
                            dst : {
                                AddrStd : {
                                    address : {in: arr}
                                }
                            }
                        }
                }
            }, 
                format_m, 
                (e, d) => {
                    this._handle_incoming_message(e, d)
                }
        );
    }

    async _handle_incoming_message(e, d) {
        if (this.handled_messages_id.has(d.id)){
            return;
        } else {
            this.handled_messages_id.add(d.id)
        }

        if (!d.header.IntMsgInfo){
            return;
        }

        var action = await this.db.TonWalletTransaction.create(
            {
                status : ActionStatus.new,
                type : ActionType.wallet_recieved,
                message : JSON.stringify(d)
            }
        )
    }


    async _handle_incoming_transaction(e, d) {
        //never tested
    }
}


async function init() {

    if (!notification_manager){
        notification_manager = new TonWalletNotificationManager(ton, db, bot);
    }

    await notification_manager.init()

}


module.exports = {
    init
}

*/