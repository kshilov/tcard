const { TONClient } = require('ton-client-node-js');
const WalletContractPackage = require("../contracts/WalletContract");

const { ton_show_balance, 
    std_wallet_deploy_full, 
    ton_wallet_send_to,
    ton_show_tx_history } = require("./general_functions");

const giverDeployMsg = 'b5ee9c7241045301000000091e00035188019ce136b7f94b13d6c436b4af0da16ac4ec22895891eb3c161a6b5a12e779b70c11801590214db007020100000101c0030203cf2006040101de050003d0200041d80000000000000000000000000000000000000000000000000000000000000004017eff00f80089f40521c3018e158020fefe0173656c6563746f725f6a6d705f30f4a08e1b8020f40df2b48020fefc0173656c6563746f725f6a6d70f4a1f233e2080101c0090201200b0a0018ff8210d0a6aff0f001dcf0010202de520c0101300d020120290e0201201c0f0201201710020120161102016a131200a4b2e0784dfefe016765745f6d73675f7075626b65797021c7029670313171db308e2921d520c7019770045f0471db30e020810200821059b09094f0013321f901202225f91020f2a85f0470e2dc203131db300201201514003db10c31ef0421d9b9aa13e0024379e57840459193a10420ab7e793de002be050015b0fcdca6db91e80193daa90039b99b9aa13fdf602cecae8bec4c2d8c2dcc6cbda8ede20de2ede21b661002015819180073b6408f57bfbec0595b98dbd91959dc985b5cc81c2f6385882d80dde81e2a410808f2c0ccc848c89e2a33c04ccc255c08b2c0ccb8884c4c76cc200201201b1a00a1b4348f4cff7f00b1b430b733b2afb0b9392fb632b710c0107a474918d248b87110115f470a470890115e59906e18529011c0107a2d9819b8734f91b759cd119138d09240107a0b19ef7111022f826d984000efb45357f87f7e80b6b0b4b72fb2bc3a32b93730b610c1084c2d05c2780091c1087d703c26f80092638159ca126a189aef13939191c10806828f39f800926380c711ff7e00b6b9b3afb4b9afb2b6b83a3cb6e41090fa0064989076aa383838aac92f856d987012410808216251f8009090b82ac92f856d9840020120221d020120211e020120201f00bdb72bee62ffbf405b585a5b97da5b9d195c9b985b086084261682e13c004989889c20840341479cfc0048f1c02387485c2ea7e084171fb881dc085c155c97c236cc381c1c1c555897c1f6cc3808e0840410b128fc0048485c156097c276cc200091b634ead34875d24808afa74888b5c04d0809154c57c136cc38088875c60d08f50d49345b4d48340809496875c60cb20908738c4848738c4832740c4809f5c04c8809156057c276cc20001fb990214da610421f0fcdca7e003b6610020120282302015827240201202625005cb3615691fefc0173656e645f6578745f6d7367f8258210881607bdf001222222821065ffe8e7f0012070fb005f040048b3167d2e8101008210b0d3ab4df00180408210b0d3ab4df001308210f98618f7f001db300091b42d05c27f7e00b3b2ba2fb9b931afb0b2323910681069801910385eccb838382a912f81ed987010b8eb909910e980199169801a11c005c1082cd8484a78009111112aa92f836d98400019b902c0f7bda8ede20de31b6610020120402a020120352b020120302c0201202e2d009db754e559ffbf005cd95b9917da5b9d17db5cd9f21c8872c04c5c0872c00c5c0872c1cc488872ffcc4832740c6084220581ef7c007e08c9485c1c1c0a0a0a1c1c20841d23ac99bc00481c3ec017c22001edb723ac99bfbe00589d5a5b191b5cd9f21c0872c00c484872c00c488872c00c5c0872c00c48c8738c4908738c4809a08436408f57bc004c5c0872c00c4809e08436408f57bc004c480a208436408f57bc004c4a0872cfcc4a4872c7cc5c0872c00c4833cd4af5d25c6808486f265c08f2c00ccb08f38ce02f00348e107123cb0033c82d21ce3120c924cc3430e222c90d5f0ddb30020120343102012033320051b55fa4d8ff7e80b3b2ba2fb9b2b6332fb0b232394108440b03def800c005c1082cd8484a7800ed98400031b50968553876a3b788e87a02bc7a0749e9ffe8c8b8716d984000c3b77ffa39ffbf40589d5a5b1917d95e1d17db5cd9f21cc872c04c4848738c5c0872c04c488872cfcc5c0872c7cc5c0872c00c4833cd4935d25c6808486f265c08f2c00cc948f38ce3841c48f2c00cf20988738c483249330d0c3888b24197c1b6cc200201203f360201203c370201203b380201483a390049b184338bfdfc02e6cadcc8bed2dce8bedae6cebe64e04247024e210420faa72acfe002be05000db0fdc40e61b6610027b4d8484a1090eb909069ff99189001af81ed98400201203e3d003fb4df9e4f7f7d00b9b2b7322fb3b930b6b9b8109192c1083ea9cab3f800af81c00031b4ef31a7b8f6a3b788e87a02bc7a0749e9ffe8c8b8716d984000b7b8730fd55fdf802c8cac6dec8cabec2e4e4c2f2438e032e43a86641a06661bc43a6026640e375e5c0c845a63e6847e808430041e91d24634922e1c4464375e5c0c9fdfe02c8cac6dec8cabec2e4e4c2f2beded64444aac2be0fb66100201204841020120454202015844430075b409c48810c0107a474918d248b87138471010115cd9906e18111092c0107a074898cbe438016780e4e8711013671b185238731811822f826d98400039b488f3fa64129091e780989064e81890129292fa0b1a11832f836d984002012047460039b70b82c03fbf4059d95d17dc985b9917dcd959593b51dbc41bc5b6cc200031b7b7811e1cbb51dbc4743d015e3d03a4f4fff4645c38b6cc200201204e490201204b4a0067b6c209cf3fbf00595b98dbd91957d85c9c985e5c48f2c04cc860083d23a48c69245c38880932c7cd08893d000d08c117c136cc200201624d4c008fb09bed1443ae9240457d3a4445ae00684048aa62be09b661c04443ae306847a86a49a2da6a41a0404a4b43ae30659048439c6242439c624193a062404fae00644048ab02be13b6610031b085894641a60e6440e175e56e43a63e664442aa42be07b661020276514f01ffb00a3ce7fdfe02e6e8dee4cabee6d2cedcc2e8eae4cada42e044f102020104207223cfe9e0026244e244f102020104207223cfe9e0026246e444f102020104207223cfe9e0026248e644f102020104207223cfe9e002630420585c1601e0030421d9b9aa13e00390424396fe624193a0630420dd7e9363e00240e84cf102020150006a82103911e7f4f0013521752678f416352376267881010082103911e7f4f00135c82521f4003120c931ed4720226f8c3120ed575f0b0055b0e032244445ae306847a86a49a2da6a41a06a4847ae306d9046439c6242439c624193a04eaac2be0fb661001b20842f2bee62fc00773c0076cc20e7af7b3d';
const giverDeployMsgId = '641134d787db0c30809d62826b5ec343ed9ced58ccf83e5de55425494dd4acf9';

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

async function check_giver(client) {
    const ton = client;
    const accounts = await ton.queries.accounts.query({
        id: { eq: giverAddress }
    }, `
        storage {
            state {
                ...on AccountStorageStateAccountActiveVariant {
                    AccountActive { split_depth } 
                }
            }
            balance {
                Grams
            }
        }
    `);

    if ((accounts.length === 0) || !(accounts[0].storage.state.AccountActive)) {
        console.log('No giver. Deploy');
        const base64Msg = Buffer.from(giverDeployMsg, 'hex').toString('base64');
        const base64Id = Buffer.from(giverDeployMsgId, 'hex').toString('base64');

        const transaction = await ton.contracts.processMessage({
            messageId: giverDeployMsgId,
            messageIdBase64: base64Id,
            messageBodyBase64: base64Msg,
        },
        'id status description { ...on TransactionDescriptionOrdinaryVariant { Ordinary { aborted } } }',
        );
        const ordinary = transaction.description.Ordinary;
        if (ordinary.aborted) {
            throw {
                code: 3050,
                message: 'Deploy failed',
            };
        }
        console.log('Giver deployed');
    }
}

async function get_grams_from_giver(client, account) {
    await check_giver(client);

    const result = await client.contracts.run({
        address: giverAddress,
        functionName: 'sendGrams',
        abi: giverAbi,
        input: {
            dest: `0x${account}`,
            amount: 10000000000
        },
        keyPair: null,
    });

    console.log(result);

    const wait = await client.queries.accounts.waitFor(
        {
            id: { eq: account },
            storage: {
                balance: {
                    Grams: { gt: "0" }
                }
            }
        },
		'id storage {balance {Grams}}'
    );
    console.log(wait.storage.balance);
};


async function deploy_wallet_contract(client) {
    const keys = await client.crypto.ed25519Keypair();

    const message = await client.contracts.createDeployMessage({
        package: WalletContractPackage,
        constructorParams: {},
        keyPair: keys,
    });

    console.log("message: ", message);

    await get_grams_from_giver(client, message.address);

    await client.contracts.deploy({
        package: WalletContractPackage,
        constructorParams: {},
        keyPair: keys,
    });

}


async function show_tx(client) {
    const queries = client.queries;
    const docs = await queries.accounts.query({}, 'id storage { balance { Grams } }');
    console.log(docs);
}

// Copy from console: 

const myAddress = '5ee30155ce6ecef2a1d11df8c1e5b84ee1ea32887adcfd5bb9b23ed72b75f295';
async function show_balance(client){
    const accounts = await client.queries.accounts.query({
        id: { eq: myAddress }
    }, `
        storage {
            balance {
                Grams
            }
        }
    `);

    console.log("Balance of myAddress:", accounts[0].storage.balance);
}



(async () => {
    try {
        const w1 = '7e071e391cf7ef167f96a2d3385844615626ddf6dc2cb40bfae78a5abb784a2d';
        const keys1 = {
            public: 'db59396efde4b23a451091b4ee35975d5eab6eb524aaf6a16624f4a4f665f672',
            secret: 'ca82a9b57bf4ce52aa0787ad9c630a61d0920e07d876b75f22d439b046a31c56'
        };
        

        const client = new TONClient();
        client.config.setData({
            servers: ['http://157.230.108.75']
        });
        await client.setup();
        //await deploy_wallet_contract(client);
        //await show_balance(client);
        // await show_balance(client);
        //await check_giver(client);
        
        //accounts = await ton_show_balance(client, myAddress);
        //console.log("myAddress: ", myAddress);
        //console.log(accounts);
        console.log('Hello TON Done');

        if (0) {
            const keys = await client.crypto.ed25519Keypair();
            console.log("keys:", keys);
            
            res = await std_wallet_deploy_full(client, keys);
            console.log("res:", res);
        } else {
            console.log("*** scenary 2");
            
            /*
            balance = await ton_show_balance(client, w1);
            console.log("myAddress: ", balance);

            r2 = await ton_wallet_send_to(client, keys1, w1, giverAddress, 1);
            console.log(r2); 
            */
           txs = await ton_show_tx_history(client);
           console.log(txs);
        }
    } catch (error) {
        console.error(error);
    }
})();