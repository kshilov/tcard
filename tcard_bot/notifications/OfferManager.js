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
    }

    async init() {
        this._handling = false;

        this.db.Offer.afterUpdate( offer => {
            this._handle_update(offer)
        })

    }

    async _handle_update(offer){
        if (this._handling){
            return;
        }else{
            this._handling = true;
        }

        try {
            if (offer.status == OFFER_STATUS.updated){
                this._offer_updated(offer)
            }else if (offer.status == OFFER_STATUS.finished){
                this._offer_finished(offer)
            }
        }catch(err){
            logger.error("OfferManager._handle_update error: %s", err)
        }

        this._handling = false;
    }

    async _offer_updated(offer){
        var publications = offer.get_publications()
        
        var updated_message = await offer.get_message()

        publications.forEaach(async function(item){
            try{
                var chat_id = item.chat_id
                var message_id = item.message_id

                await bot.telegram.editMessageText(chat_id, message_id, updated_message)
            }catch(error){
                logger.error("FAILED: OfferManager._offer_updated failed error: %s", error)
            }
        })
    }

    async _offer_finished(offer){

    }



}


let offer_manager = undefined;
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

    logger.info("SUCCESS: OfferManager.init succes")
}
    

module.exports = {
    init
}