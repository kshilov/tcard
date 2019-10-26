'use strict';
const {TXWalletType, TXWalletStatus, WALLET_ERROR_CODES} = require("../helpers/constants");

var db = require('../models');


async function test_op() {
var res = await db.WalletTransaction.findAll({
    where : {
        status : {
            [db.WalletTransaction.Sequelize.Op.notIn] : [TXWalletStatus.done, TXWalletStatus.failed]
        }
    },
    limit : 50
})
console.log(res)
}

async function test_channel_messages() {
    var new_sync = await db.RemoteServiceManagerQueue.new_channel_messages() 

    await new_sync.forEach(async (action) => {
        var message = await action.get_message()
        console.log("*** :", message)
        
        await message.forEach(async (msg) => {
            console.log("++++ ", msg)
        });


    });
             
}

async function test_return(res){
    if (res){
        return;
    }

    await (async () => {
        console.log("not returned")
    })()
}


async function test_queue_request(){

    var res = await db.BalanceManagerQueue.need_to_be_done()

    console.log(res)
}

test_queue_request()

