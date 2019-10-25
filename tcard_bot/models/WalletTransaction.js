'use strict';

let db = null;
const {TXWalletType, TXWalletStatus, WALLET_ERROR_CODES} = require("../helpers/constants");

module.exports = function(sequelize, DataTypes) {
	var WalletTransaction = sequelize.define('WalletTransaction', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		from_username : {
			type: DataTypes.STRING,
			allowNull: true
        },
        to_username : {
            type: DataTypes.STRING,
			allowNull: true
        },
        type : {
			type: DataTypes.INTEGER,
			allowNull: true
        },
        amount : {
            type: DataTypes.FLOAT,
			allowNull: false 
        },
        status : {
            type: DataTypes.INTEGER,
			allowNull: true
        },
        data : {
            type: DataTypes.TEXT,
			allowNull: true
        }
	}, {
		timestamps: true,
		schema: 'public'
	});

	WalletTransaction.associate = function(models) {
		db = models;
	};
    
    WalletTransaction.send_to = async function(from_username, to_username, amount){
        if (amount <= 0){
            return WALLET_ERROR_CODES.not_enough_balance;
        }

        if (!from_username){
            return WALLET_ERROR_CODES.no_such_sender;
        }

        if (!to_username){
            return WALLET_ERROR_CODES.no_such_receiver;
        }

        var tx = await WalletTransaction.create({
            from_username : from_username,
            to_username : to_username,
            amount : amount,
            type : TXWalletType.send,
            status : TXWalletStatus.new
        })

        return tx;
    }

    WalletTransaction.deposit = async function(to_username, amount, data){
        if (amount <= 0) {
            return WALLET_ERROR_CODES.not_enough_balance;
        }

        if (!to_username) {
            return WALLET_ERROR_CODES.undefined_user;
        }

        var tx = await WalletTransaction.create({
            to_username : to_username,
            amount : amount,
            type : TXWalletType.deposit,
            status : TXWalletStatus.new,
            data : data
        })

        return tx;
    }

    WalletTransaction.withdraw = async function(from_username, amount, data){
        if (amount <= 0){
            return WALLET_ERROR_CODES.not_enough_balance;
        } 
        
        if (!from_username){
            return WALLET_ERROR_CODES.undefined_user;
        }

        var tx = await WalletTransaction.create({
            from_username : from_username,
            amount : amount,
            type : TXWalletType.withdraw,
            status : TXWalletStatus.new,
            data : data
        })

        return tx;
    }

    WalletTransaction.need_to_be_done = async function() {
        var res = await WalletTransaction.findAll({
            where : {
                status : 
                    this.db.Sequelize.and(
                       {$ne : TXWalletStatus.done},
                       {$ne : TXWalletStatus.failed}
                    )
            },
            limit : 50
        })

        return res;
    }

    WalletTransaction.prototype.get_data = async function(){
        return await JSON.parse(this.data);
    }

    WalletTransaction.prototype.done = async function(){
        this.status = TXWalletStatus.done;
        this.save()
    }

    WalletTransaction.prototype.inprogress = async function(){
        this.status = TXWalletStatus.inprogress;
        this.save()
    }

    WalletTransaction.prototype.failed = async function(){
        this.status = TXWalletStatus.failed;
        this.save()
    }




	return WalletTransaction;
};
