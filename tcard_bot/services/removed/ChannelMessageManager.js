'use strict';

const msg_polling_interval = process.env.MSG_POLLING_INTERVAL;

const {QueueStatus, QueueType, SETUP_STEPS} = require("../helpers/constants");

const db = require('../models')
const logger = require('../helpers/logger')


class ChannelMessageManager {
    constructor(){
        this.db = db;

        this._action_polling_inprogress = false;
        this._msg_polling_inprogress = false;
        logger.info("... ChannelMessageManager created, waiting for init")
    }

    async init(){
        setInterval(async ()=> {
            this._polling_actions()
            this._polling_messages()
        }, msg_polling_interval) // we will start polling once an hour to fix if someone broken
        logger.info("STEP %d - SUCCESS: ChannelMessageManager.init success", SETUP_STEPS['ChannelMessageManager'])
    }

    async _polling_actions() {
        if (this._action_polling_inprogress){
            return;
        }else{
            this._action_polling_inprogress = true;
        }

        try {
            var new_actions = await this.db.RemoteServiceManagerQueue.new_channel_messages() 

            if (!new_actions){
                throw "There is no new syncs";
            }

            await new_actions.forEach(async (action) => {
                var message_array = await action.get_message()
                
                var success = true;
                await message_array.forEach(async (message) => {
                    try {
                       var res = await this.db.ChannelMessageManagerQueue.add_message(message)
                       if (res < 0){
                           success = false;
                       }
                    }catch(error){
                        logger.error("ChannelMessageManager._polling_actions: %s", error)
                        success = false;
                    }
                });
                if (success){
                    action.done()
                }
            });
        
        }catch(error){
            this._action_polling_inprogress = false;
            return;
        }

        this._action_polling_inprogress = false;
        return;
    }

    async _polling_messages(){
        if (this._msg_polling_inprogress){
            return;
        }else{
            this._msg_polling_inprogress = true;
        }

        try {
            var new_msgs = await this.db.ChannelMessageManagerQueue.need_to_be_done()

            if (!new_msgs){
                throw "There is no new messages";
            }

            await new_msgs.forEach(async (msg) => {
                var data = await msg.get_data()
                try {
                    this._handle_message(msg, data)
                }catch(error){
                    logger.error("Catch 1 ChannelMessageManager._polling_messages: %s", error)
                }
            });
        }catch(error){
            this._msg_polling_inprogress = false;
            logger.error("Catch 2: ChannelMessageManager._polling_messages: %s", error)
            return;
        }

        this._msg_polling_inprogress = false;
        return;
    }

    async _handle_message(msg, data){
        if (!msg || !data){
            logger.error("ChannelMessageManager._handle_message: WRONG parameters: msg, data: %s, %s", msg, data)
            return;
        }

        try {
            var res = await this.db.BotNotificationManagerQueue.add_aff_channel_post(data)
            if (res < 0){
                throw "can't add_aff_channel_post"
            }
        }catch(err){
            logger.error("Catch 2 Can't ChannelMessageManager._handle_message %s", err)
            return;
        }
        
        msg.done()
    }

    async ready_to_sync_array(){
        var res =  await this.db.ChannelMessageManagerQueue.findAll({
			attributes: ['aggregated_message_id'], 
			raw: true,
			where : {
				status : QueueStatus.done 
			},
			limit : 50
		})

		var arr = []
        res.forEach(element => {
            arr.push(element.aggregated_message_id)
        });

		return arr;

    }

}

let message_manager = undefined;

async function setupChannelMessageManager(){
    if (message_manager){
        return message_manager;
    }

    message_manager = new ChannelMessageManager();
    
    return message_manager;
}

module.exports = {
    setupChannelMessageManager
}
