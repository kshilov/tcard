'use strict';

const db = require("../models")


(async () => {
var res = await db.WalletTransaction.findAll({
    where : {
        status : 
            db.Sequelize.and(
               {$ne : TXWalletStatus.done},
               {$ne : TXWalletStatus.failed}
            )
    },
    limit : 50
})
console.log(res)
})()

