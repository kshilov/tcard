'use strict';

const msg_polling_interval = process.env.MSG_POLLING_INTERVAL;

const {SyncDataStatus, SyncStatus, SyncType} = require("../helpers/constants");


class MessageManager {
    constructor(db, bot){
        this.db = db;
        this.bot = bot;

        this._action_polling_inprogress = false;
        this._msg_polling_inprogress = false;
    }

    async init(){
        setInterval(async ()=> {
            this._polling_acitons()
            this._polling_messages()
        }, msg_polling_interval) // we will start polling once an hour to fix if someone broken
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
                    type : SyncType.messages
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
                        await this.db.SyncMessage.create({
                            aggregated_message_id : msg.id,
                            action_id : action.id,
                            status : SyncDataStatus.new,
                            data : msg
                        })  
                    }catch(error){
                        console.log("Can't create SyncMessage:", error)
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

    async _polling_messages(){
        if (this._msg_polling_inprogress){
            return;
        }else{
            this._msg_polling_inprogress = true;
        }

        try {
            var new_msgs = await this.db.SyncMessage.need_to_be_done()

            if (!new_msgs){
                throw "There is no new messages";
            }

            new_msgs.array.forEach(async (msg) => {
                var data = await msg.get_data()
                try {
                    this._handle_message(msg, data)
                }catch(error){
                    console.log("Can't handle SyncTransaction:", error)
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
        var message_text = data['message_text'];
        var channel_url = data['tgUrl'];

        if (!message_text || !channel_url){
            return;
        }

        //var aff_channel_id = await this.db.User.aff_channel_id(channel_url)

        var aff_channel_name = 'tcardtestchannel'

        if (!aff_channel_id){
            console.log("Can't find channel_id for affeliate")
            return;
        }

        await this.bot.telegram.sendMessage(aff_channel_name, message_text)

        msg.done()
    }

}

const message_manager = undefined;

async function setupMessageManager(db, bot){
    if (message_manager){
        return message_manager;
    }

    return new MessageManager(db, bot);
}

module.exports = {
    setupMessageManager
}
