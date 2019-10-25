'use strict';

const msg_polling_interval = process.env.MSG_POLLING_INTERVAL;

const {QueueStatus, QueueType} = require("../helpers/constants");

const db = require('../models')


class ChannelMessageManager {
    constructor(){
        this.db = db;

        this._action_polling_inprogress = false;
        this._msg_polling_inprogress = false;
        console.log("... ChannelMessageManager created, waiting for init")
    }

    async init(){
        setInterval(async ()=> {
            this._polling_actions()
            this._polling_messages()
        }, msg_polling_interval) // we will start polling once an hour to fix if someone broken
        console.log("STEP %d - SUCCESS: ChannelMessageManager.init success", SETUP_STEPS['ChannelMessageManager'])
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
                    type : QueueType.messages
                },
                limit : 50
            })

            if (!new_sync){
                throw "There is no new syncs";
            }

            new_sync.array.forEach(async (action) => {
                var message = action.get_message()

                await message.array.forEach(async (msg) => {
                    try {
                        await this.db.ChannelMessageManagerQueue.create({
                            aggregated_message_id : msg.id,
                            action_id : action.id,
                            status : QueueStatus.new,
                            data : msg
                        })  
                    }catch(error){
                        console.log("Can't create ChannelMessageManagerQueue:", error)
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

            new_msgs.array.forEach(async (msg) => {
                var data = await msg.get_data()
                try {
                    this._handle_message(msg, data)
                }catch(error){
                    console.log("Can't handle BalanceManagerQueue:", error)
                }
            });
        }catch(error){
            this._msg_polling_inprogress = false;
            return;
        }

        this._msg_polling_inprogress = false;
        return;
    }

    async _handle_message(msg, data){
        if (!msg || !data){
            console.log("_handle_message: WRONG parameters: msg, data:", msg, data)
            return;
        }

        try {
            var res = await this.db.BotNotificationManagerQueue.add_aff_channel_post(data)
            if (res < 0){
                throw "can't add_aff_channel_post"
            }
        }catch(err){
            console.log("Can't handle message", err)
        }finally{
            msg.done()
        }
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
            arr.add(element.aggregated_message_id)
        });

		return arr;

    }

}

let message_manager = undefined;

async function setupChannelMessageManager(){
    if (message_manager){
        return message_manager;
    }

    return new ChannelMessageManager();
}

module.exports = {
    setupChannelMessageManager
}
