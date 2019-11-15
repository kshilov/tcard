'use strict';

function add_offers_list(offer_list){
    if (!offer_list){
        return '';
    }

    var message = '\n';
    offer_list.forEach(item =>{
        message = message  + ' id=' + item.id +' ' + item.privateTitle + '\n';
    })

    return message;
}

function add_offers_list_id(offer_list){
    if (!offer_list){
        return '';
    }

    var message = '\n';
    offer_list.forEach(item =>{
        message = message + ' id=' + item.id + ' ' + item.privateTitle + '  (user_id: ' + item.user_id + ')\n';
    })

    return message;
}


module.exports = {
    add_offers_list,
    add_offers_list_id
}
