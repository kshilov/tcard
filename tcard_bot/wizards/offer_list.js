const Composer = require('telegraf/composer')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const {add_offers_list_id, add_offers_list} = require('../helpers/show_lists')

const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')

const db = require('../models')


async function activate_dialog(ctx){
    
    // TODO: remove this on production
    var user = await db.User.get_user(ctx.from.id)
    if (!user.offer_access()){
        var m = "HACKED ATTEMPT offer_update.activate_dialog: someone try to use offer_update_manual " + user.id
        logger.error(m)
        return ctx.scene.leave()
    }

    var data;
    var message = await i18n.t(i18n.current_locale, 'offer_list_show');
    var offers_message = '';

    if (user.is_admin()){
        data = await db.Offer.all_offers()
        offers_message = add_offers_list_id(data.offer_list);
    }else{
        data = await db.Offer.offers_for(ctx.from.id)
        offers_message = add_offers_list(data.offer_list)
    }


    message = message + offers_message;

    ctx.reply(message)
    
    return ctx.scene.leave()
}



const offer_list_wizard = new WizardScene('offer-list-wizard',
    activate_dialog
)

logger.info("SUCCESS wizards: offer_list_wizard initialized");


module.exports = offer_list_wizard;