
class MyPromise {
    the_func = null;

    constructor(f) {
        this.the_func = f;
    }

    then(v){
        return new Promise( (r, e) => this.the_func(v))
    }
}


function sleep(period) {
    return new Promise ( (resolve,e) => setTimeout( () => resolve('Just finished to sleep'), period) );
}

var sleep1 = new MyPromise(sleep);

async function test(){
    console.log("First step");
    await sleep;
    console.log("second.step");
}

test();