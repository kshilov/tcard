'use strict';

const WalletContractPackage = require("../contracts/WalletContract");
const giverAddress = 'ce709b5bfca589eb621b5a5786d0b562761144ac48f59e0b0d35ad0973bcdb86';
const giverAbi =
{
    "ABI version": 0,
    "functions": [{
        "name": "constructor",
        "inputs": [],
        "outputs": []
    }, {
        "name": "sendGrams",
        "inputs": [
            {"name":"dest","type":"uint256"},
            {"name":"amount","type":"uint64"}
        ],
        "outputs": []
    }]
};


async function deposit_grams(ton, wallet_address, amount){
    await std_send_grams_from_giver(ton, wallet_address, amount)
}

async function ton_show_balance(ton, account) {
    const accounts = await ton.queries.accounts.query({
        id: { eq: account }
    }, `
        storage {
            balance {
                Grams
            }
        }
        addr {
            ...on MsgAddressIntAddrStdVariant {
                AddrStd { address }
            }
        }
    `);

    const r = {
        'balance' : accounts[0].storage.balance.Grams,
        'address' : accounts[0].addr.AddrStd.address
    }
    return r;
}

async function ton_generate_keys(ton) {
    const keys = await ton.crypto.ed25519Keypair();

    return keys;
}

async function ton_wallet_send_to(ton, keys, from_address, to_address, grams) {
    console.log("sending...:", keys, from_address, to_address, grams)

    const result = await ton.contracts.run({
        address: from_address,
        functionName: 'sendTransaction',
        abi: WalletContractPackage.abi,
        input: {
            recipient: `x${to_address}`,
            value: grams
        },
        keyPair: keys,
    });

    return result;
}

async function std_send_grams_from_giver(ton, to_address, amount=10000000000) {
    const result = await ton.contracts.run({
        address: giverAddress,
        functionName: 'sendGrams',
        abi: giverAbi,
        input: {
            dest: `0x${to_address}`,
            amount: amount
        },
        keyPair: null,
    });
}

async function std_wallet_deploy_full(ton, keys) {
    const message = await ton.contracts.createDeployMessage({
        package: WalletContractPackage,
        constructorParams: {},
        keyPair: keys,
    });

    await std_send_grams_from_giver(ton, message.address);

    const status = await ton.contracts.deploy({
        package: WalletContractPackage,
        constructorParams: {},
        keyPair: keys,
    });

    const r = {
        'address' : message.address,
        'status' : status
    }
    return r;
}

// Need already have grams on account
async function std_wallet_deploy_manual(ton, keys) {
    return await ton.contracts.deploy({
        package: WalletContractPackage,
        constructorParams: {},
        keyPair: keys,
    });
}

async function ton_show_tx_history(ton, account) {
    const tx = await ton.queries.transactions.query({
        account_addr: {eq : account}
    },`
        id status account_addr outmsg_cnt lt
    `);

    return tx;
}


async function ton_subcribe_incomming_messages(ton, addres_array) {
    const transactionWithAddresses = `
        account_addr
        status
    `;

    const subscription = await ton.queries.transactions.subscribe({}, transactionWithAddresses, (e, d) => {
        console.log("e: ", e)
        console.log("d: ", d)
    });

}




module.exports = { 
    ton_show_balance, 
    std_wallet_deploy_full,
    std_wallet_deploy_manual,
    ton_wallet_send_to,
    ton_show_tx_history,
    ton_subcribe_incomming_messages
 }