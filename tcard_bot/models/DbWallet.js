'use strict';

let db = null;

const {WALLET_ERROR_CODES} = require("../helpers/constants");

module.exports = function(sequelize, DataTypes) {
	var DbWallet = sequelize.define('DbWallet', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		balance : {
			type: DataTypes.INTEGER,
			allowNull: true
        }
	}, {
		timestamps: true,
		schema: 'public'
	});

	DbWallet.associate = function(models) {
		DbWallet.belongsTo(models.User);
		db = models;
	};
	

	DbWallet.prototype.get_balance = async function () {
        return this.balance;
	}
        
	DbWallet.prototype.send_to = async function (to_username, amount) {
        if (amount > this.balance){
            return WALLET_ERROR_CODES.not_enough_balance;
        }

        const to_user = await db.User.findOne({ where: {username : to_username} })
        if (!to_user){
            return WALLET_ERROR_CODES.no_such_receiver;
        }

        try {
            var my_username = await this.getUser().username
            if (!my_username){
                throw "There is no such user"
            } 

            var tx = await db.WalletTransaction.send_to(my_username, to_username, amount)
            if (!tx) {
                throw "Can't create send_to transaction"
            }

            this.balance = this.balance - amount;
            
            await this.save();
        }catch(err){
            console.log("SEND_TO_ERROR can't send_to: ", err)
            return WALLET_ERROR_CODES.unknown_error;
        }finally{
            return WALLET_ERROR_CODES.no_error;
        }
    }

    DbWallet.prototype.deposit = async function (amount) {
        if (amount <= 0){
            return WALLET_ERROR_CODES.not_enough_balance;
        }

        try{
            this.balance = this.balance + amount;
            await this.save()
        }catch(err){
            console.log("Can't deposit", err)
            return WALLET_ERROR_CODES.not_enough_balance;
        }finally{
            return WALLET_ERROR_CODES.no_error;
        }

    }

    DbWallet.prototype.withdraw = async function (amount) {
        if (amount <= 0){
            return WALLET_ERROR_CODES.not_enough_balance;
        }

        try{
            this.balance = this.balance - amount;
            await this.save()
        }catch(err){
            console.log("Can't withdraw", err)
            return WALLET_ERROR_CODES.not_enough_balance;
        }finally{
            return WALLET_ERROR_CODES.no_error;
        }

    }


	return DbWallet;
};
