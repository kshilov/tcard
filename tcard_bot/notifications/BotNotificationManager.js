'use strict';

const db = require('../models')

const polling_interval = process.env.BOT_NOTIFICATION_POLLING_INTERVAL;

const {NotificationStatus, NotificationType, BOT_NOTIFICATION_ERROR} = require("../helpers/constants");

const {providers} = require('../providers')
const {middlewares} = require('../middlewares')

const bot = providers.bot.bot
const i18n = middlewares.i18n.i18n


class BotNotificationManager{
       
    constructor(){
        this.db = db;
        this.bot = bot;
        this._polling = false;
        this._handling = false;
    }

    async init() {
        this._polling = false;
        this._handling = false;

        await this._notifications_subscribe();
      
        setInterval(async ()=> {
            this._polling_notifications();
        }, polling_interval)
    }

    async _polling_notifications(){
        if (this._polling){
            return;
        }else{
            this._polling = true;
        }

        try {
            var new_ntfs = await this.db.BotNotificationManagerQueue.need_to_be_done()
            
            new_ntfs.forEach(ntf => {
                this._handle_notification(ntf)
            });
        
        }catch(err){
            console.log("_polling_notifications error:", err)
        }

        this._polling = false;

    }

    async _notifications_subscribe() {
        this.db.BotNotificationManagerQueue.afterCreate( notification => {
            this._handle_notification(notification)
        })
    }

    async _handle_notification(notification){
        if (this._handling){
            return;
        }else{
            this._handling = true;
        }

        try {
            if (notification.status == NotificationStatus.done){
                throw "Attempt to handle notification twice"
            }

            if (notification.type == NotificationType.recieved){
                await this._handle_recieved(notification)
            }else if (notification.type == NotificationType.deposit){
                await this._handle_deposit(notification)
            }else if (notification.type == NotificationType.withdraw){
                await this._handle_withdraw(notification)
            }else if (notification.type == NotificationType.prize){
                await this._handle_prize(notification)
            }else if (notification.type == NotificationType.aff_channel_post){
                await this._handle_aff_channel_post(notification)
            }

        }catch(err){
            console.log("_handle_notification error:", err)
        }

        this._handling = false;
    }

    async _handle_recieved(notification){
        var tgId = notification.tgId;
        if (!tgId){
            console.log("_handle_recieved ERROR: There is no tgId");
            return;
        }

        try{
            var user = await this.db.User.get_user(tgId)
            var chat_id = user.chat_id
            var data = await notification.get_data()

            var message = await i18n.t('notification_recieved', data)


            await this.bot.telegram.sendMessage(chat_id, message)
        }catch(err){
            console.log("_handle_recieved ERROR: ", err);
        }finally{
            await notification.done()
        }
    }

    async _handle_aff_channel_post(notification){
        var data = await notification.get_data()
        if (!data){
            console.log("_handle_aff_channel_post ERROR: There is no data");
            return;
        }

        try{
            var channel_name = data['tgUrl']
            var message = await i18n.t('aff_channel_message', data)


            await this.bot.telegram.sendMessage(channel_name, message)
        }catch(err){
            console.log("_handle_aff_channel_post ERROR: ", err);
        }finally{
            await notification.done()
        }

    }

    async _handle_prize(notification){
        var tgId = notification.tgId;
        if (!tgId){
            console.log("_handle_prize ERROR: There is no tgId");
            return;
        }

        try{
            var user = await this.db.User.get_user(tgId)
            var chat_id = user.chat_id
            var data = await notification.get_data()

            var message = await i18n.t('notification_prize', data)


            await this.bot.telegram.sendMessage(chat_id, message)
        }catch(err){
            console.log("_handle_prize ERROR: ", err);
        }finally{
            await notification.done()
        }
    }

    async _handle_withdraw(notification){
        var tgId = notification.tgId;
        if (!tgId){
            console.log("_handle_withdraw ERROR: There is no tgId");
            return;
        }

        try{
            var user = await this.db.User.get_user(tgId)
            var chat_id = user.chat_id
            var data = await notification.get_data()

            var message = await i18n.t('notification_withdraw', data)


            await this.bot.telegram.sendMessage(chat_id, message)
        }catch(err){
            console.log("_handle_withdraw ERROR: ", err);
        }finally{
            await notification.done()
        }
    }

    async _handle_deposit(notification){
        var tgId = notification.tgId;
        if (!tgId){
            console.log("_handle_deposit ERROR: There is no tgId");
            return;
        }

        try{
            var user = await this.db.User.get_user(tgId)
            var chat_id = user.chat_id
            var data = await notification.get_data()

            var message = await i18n.t('notification_deposit', data)


            await this.bot.telegram.sendMessage(chat_id, message)
        }catch(err){
            console.log("_handle_deposit ERROR: ", err);
        }finally{
            await notification.done()
        }

    }


}


let bot_notifcation_manager = undefined;
async function init() {
    if (!bot_notifcation_manager){
        bot_notifcation_manager = new BotNotificationManager();
    }

    await bot_notifcation_manager.init()
}
    

module.exports = {
    init
}