'use strict'

class myPromise {
    constructor(f){

        var bound_resolve = this.resolve.bind(this)
        var bound_reject = this.resolve.bind(this)

        this.if_resolve = undefined;
        this.if_reject = undefined;

        f(bound_resolve, bound_reject)
    }

    resolve(res){
        this.if_resolve = res;
    }

    reject(res){
        this.if_reject = res;
    }

    then(res) {
        if (this.if_resolve){
            res(this.if_resolve)
        }

        return this;
    }

    catch(res){
        if (this.if_reject){
            res(this.if_reject)
        }
        return this
    }
}

/*
let clean_promise = new myPromise(function(resolve, reject){
    let is_clean = false;
    if (is_clean){
        resolve("is Clean")
    }else{
        reject("Not clean")
    }
})

clean_promise.then(function(res){
    console.log("Room + ", res)
}).catch(function(res){
    console.log("Room + ", res)
}) */


function sleep(period) {
    return new myPromise ( (resolve,e) => setTimeout( () => resolve(console.log('The first')), period) );
}

async function test() {
    await sleep(1000);
    console.log("The second")
}

test()
