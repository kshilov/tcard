'use strict';

const q = {
    a : 1,
    b : 2
}


async function try_catch(err){
    try{
        if (err){
            throw "Ooops error"
        }
    }catch(err){
        console.log("Error: ", err)
        return;
    }
    
    console.log("Finally: ")
    
    
    console.log("End...");
}

(async () => {
    await try_catch(1)
})()