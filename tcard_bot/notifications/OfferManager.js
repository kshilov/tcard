'use strict';

const db = require('../models')
const Markup = require('telegraf/markup')
const extra = require('telegraf/extra')

const {providers} = require('../providers')
const bot = providers.bot.bot
const {i18n} = require('../middlewares/i18n')
const logger = require('../helpers/logger')

const {OFFER_TYPE, OFFER_STATUS, OFFER_CODES} = require("../helpers/constants");

class OfferManager{
       
    constructor(){
        this.db = db;
        this.bot = bot;
        this._handling = false;
        this.is_initialized = false;
        this.init_called = false;
    }

    async is_initialized(){
        return this.is_initialized;
    }

    async init() {
        if (this.init_called){
            return;
        }else{
            this.init_called = true;
        }
        
        this._handling = false;

        this.db.Offer.afterSave(async offer => {
            await this._handle_update(offer)
        })

        this.is_initialized = true;
    }

    async update_by_id(offer_id){
        var offer = await this.db.Offer.get_offer(offer_id)

        return this._offer_updated(offer)
    }


    async _handle_update(offer){
        if (this._handling){
            return;
        }else{
            this._handling = true;
        }        

        try {
            if (offer.status == OFFER_STATUS.updated){
                await this._offer_updated(offer)
            }else if (offer.status == OFFER_STATUS.finished){
                await this._offer_finished(offer)
            }
        }catch(err){
            logger.error("OfferManager._handle_update error: %s", err)
        }

        this._handling = false;
    }

    async _offer_updated(offer){

        if (offer.status != OFFER_STATUS.updated){
            return;
        }

        try{
            await this._update_offer_message(offer, true)            
            await offer.active()
        }catch(error){
            logger.error("FAILED: OfferManager._offer_updated failed error: %s", error)
        }
    }

    async _offer_finished(offer){
        if (offer.status != OFFER_STATUS.finished){
            return;
        }
        
        try{
            await this._update_offer_message(offer, false)            
        }catch(error){
            logger.error("FAILED: OfferManager._offer_finished failed error: %s", error)
            return;
        }

        try {
            await this._notify_participants_finished(offer)
        }catch(error){
            logger.error("FAILED: OfferManager._offer_finished failed error: %s", error)
        }
    }

    async _notify_participants_finished(offer){
        var partcipants = await offer.get_participants()
        var offer_success_message = await offer.get_success_message()
        
        Object.keys(partcipants).forEach(async function(key){
            if (!key || !partcipants[key]){
                return;
            }

            var user_tgId = partcipants[key].tgId
            var user = await db.User.get_user(user_tgId)
            var chat_id = user.chat_id;

            await bot.telegram.sendMessage(chat_id, offer_success_message, extra.markdown())
        })


    }


    async _update_offer_message(offer, is_kb){
            var publications = offer.get_publications()
            
            var updated_message = await offer.get_message()
            var kb = await offer.get_keyboard()

            Object.keys(publications).forEach(async function(key){
                if (!key || !publications[key]){
                    return;
                }

                var chat_id = publications[key].chat_id
                var message_id = publications[key].message_id

                if (offer.type == OFFER_TYPE.button){

                    var updated_kb = await offer.get_offer_button_updated_keyboard()
                    await bot.telegram.editMessageReplyMarkup(chat_id, message_id, 0, extra.markup(updated_kb).markdown())    
                }else{
                    if (is_kb){
                        await bot.telegram.editMessageText(chat_id, message_id, 0, updated_message, extra.markup(kb).markdown())
                    }else{
                        await bot.telegram.editMessageText(chat_id, message_id, 0, updated_message, extra.markdown())
                    }
                }
            })
    }



}


var offer_manager = undefined;
async function init() {
    try{
        if (!offer_manager){
            offer_manager = new OfferManager();
        }

        await offer_manager.init()
    }catch(error){
        logger.error("FAILED: can't init OfferManager: %s", error)
        return;
    }

    await offer_manager.init()

    logger.info("SUCCESS: OfferManager.init success")

    return offer_manager;
}
    

module.exports = {
    init,
    offer_manager
}