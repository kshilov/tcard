'use strict';

var db = require('../models');
var { ton_client, connectTon } = require('../init/ton')



//db.sequelize.sync({force: true})
db.sequelize.sync()
.then(() => {
    console.log('Connection has been established successfully.');
})
.catch(err => {
    console.error('Unable to connect to the database:', err);
});


async function main(telegram_id) {
    const from = {
        'id' : telegram_id,
        'username' : 'kakamacha'
    }
    const chat_id = -1;

    var user = await db.User.get_user(telegram_id);
    if (!user){
        console.log("No such user tg_id", telegram_id)
        user = await db.User.complete_creation(from, chat_id);
        console.log("User created succes: ", user)
    }

    console.log("Let's get the wallet fir user id:", user.id)

    const wallet = await user.get_wallet();

    console.log("Received wallet: ", wallet.id);
}

async function send_from_to(ton, telegram_id_1, to_username, amount){
    var user1 = await db.User.get_user(telegram_id_1)
    var wallet1 = await user1.get_wallet()

    wallet1.send_grams_by_username(ton, to_username, amount)
}


async function create_2_users(ton, telegram_id_1, telegram_id_2) {

    const from1 = {
        'id' : telegram_id_1,
        'username' : 'user1'
    }

    const from2 = {
        'id' : telegram_id_2,
        'username' : 'user2'
    }

    var chat_id = 12

    var user1 = await db.User.get_user(telegram_id_1)
    if (!user1) {
        user1 = await db.User.complete_creation(from1, chat_id)
    }
    var wallet1 = await user1.get_wallet()
    await wallet1.deploy_wallet(ton)

    var user2 = await db.User.get_user(telegram_id_2)
    if (!user2) {
        user2 = await db.User.complete_creation(from2, chat_id)
    }
    var wallet2 = await user2.get_wallet()
    await wallet2.deploy_wallet(ton)
}

async function deploy_wallet(ton, telegram_id) {
    var user = await db.User.get_user(telegram_id);
    var wallet = await user.get_wallet();

    await wallet.deploy_wallet(ton);
}

async function show_balance(ton, telegram_id) {
    var user = await db.User.get_user(telegram_id);
    var wallet = await user.get_wallet();

    const res = await wallet.get_balance(ton);
    console.log("Balance: ", res)

}

async function send_grams_to_giver(ton, telegram_id, amount) {
    var user = await db.User.get_user(telegram_id);
    var wallet = await user.get_wallet();

    const to_address = 'ce709b5bfca589eb621b5a5786d0b562761144ac48f59e0b0d35ad0973bcdb86';
    const res = await wallet.send_grams(ton, to_address, amount);
    console.log("Sent success: ", res)

}

async function show_tx_history(ton, telegram_id) {

    var user = await db.User.get_user(telegram_id);
    var wallet = await user.get_wallet();

    const res = await wallet.tx_history(ton);
    console.log(res)

}

async function delete_o() {
    const telegram_id = -1;
/*
    await db.User.destroy({
        where : {
            telegram_id : telegram_id
        }
    });
*/
    await db.TonWallet.destroy({
        where : {
            id : 1
        }
    });

}

async function all_wallets() {
    var wallets = new Set([])

    const res =  await db.TonWallet.findAll({attributes: ['wallet_address'], raw: true})
    
    res.forEach(element => {
        wallets.add(element.wallet_address)
    });

    console.log(res)
    console.log(wallets)
}


connectTon();

//create_2_users(ton_client, -1, -2)

send_from_to(ton_client, -1, "ksshilov", 44);

(async () => {
    var wallet = await db.TonWallet.findOne({
        where : {
            wallet_address : "979c263ba9c2eab903f94dbd955b8aaa69201d484f780f4ab16ef9a28945e427"
        }
    })

   // console.log("wallet found:", wallet)

    var user = await wallet.getUser()

    console.log("user found", user)

})

// deploy_wallet(ton_client, -2);
//const telegram_id = -1;
//const amount = 100;

//show_tx_history(ton_client, telegram_id)

//show_balance(ton_client, telegram_id)
//send_grams_to_giver(ton_client, telegram_id, amount)
//show_balance(ton_client, telegram_id)

// all_wallets()

//delete_o()
//main(-2);