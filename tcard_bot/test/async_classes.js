'use strict'

function sleep(period) {
    return new Promise ( (resolve,e) => setTimeout( () => resolve(console.log('The first')), period) );
}


class NotificationManager {
    constructor(ton, db) {
        this.ton = ton;
        this.db = db;
    }

    async log_token_transfer(){
        await sleep(1000);
        console.log("...Should be after", this.ton, this.db)
    }
}

function setupNotiFicationManager(ton, db) {
    return new NotificationManager(ton, db);
}


function test1(){
    test()
}

async function test() {
    await sleep(1000);
    console.log("The second")

}

console.log("The third")