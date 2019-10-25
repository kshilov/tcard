'use strict';

/*
var db = null;
const { std_wallet_deploy_full, 
		ton_show_balance,
		ton_wallet_send_to,
		ton_show_tx_history } = require('../helpers/tonMethods')

module.exports = function(sequelize, DataTypes) {
	var TonWallet = sequelize.define('TonWallet', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		wallet_address : {
			type: DataTypes.STRING,
			allowNull: true
		},
		public_key : {
			type: DataTypes.STRING,
			allowNull: true
		},
		private_key : {
			type: DataTypes.STRING,
			allowNull: true
		}
	}, {
		timestamps: true,
		schema: 'public'
	});

	TonWallet.associate = function(models) {
		TonWallet.belongsTo(models.User);
		db = models;
	};
	
	TonWallet.prototype._get_keys = function () {
	
		return {
			'public' : this.public_key,
			'secret' : this.private_key
		}

	}

	TonWallet.prototype.deployed = function(){
		if(this.wallet_address){
			return true;
		}

		return false;
	}

	TonWallet.prototype.deploy_wallet = async function (ton) {
		//console.log("Inside deploy_wallet")
		if (!this.public_key || !this.private_key) {
			var keys = await ton.crypto.ed25519Keypair();
			if (!keys) {
				throw("Can't gnerate key pair for wallet_id: ", this.id);
			}

			this.public_key = keys.public;
			this.private_key = keys.secret;
			
			//console.log("Keys created:", this.public_key, this.private_key)

			await this.save()

			//console.log("Keys saved")

		}

		if (!this.wallet_address){
			//console.log("creating wallet address")
			const keys = this._get_keys();
			const res = await std_wallet_deploy_full(ton, keys);
			if (!res || !res.address){
				throw("Can't deploy wallet contract for wallet_id: ", this.id)
			}

			this.wallet_address = res.address;

			//console.log("wallet_address saved")

			await this.save()
		}

	}

	TonWallet.prototype.get_balance = async function (ton) {

		if (!this.wallet_address){
			throw("Wallet is not initialized")
		}

		return await ton_show_balance(ton, this.wallet_address);
	}
	

	TonWallet.prototype.send_grams = async function (ton, to_address, amount) {
		
		if (!this.wallet_address){
			throw("Wallet is not initialized")
		}

		const keys = this._get_keys();
		return await ton_wallet_send_to(ton, keys, this.wallet_address, to_address, amount);
	}

	TonWallet.prototype.send_grams_by_username = async function (ton, to_username, amount) {
		const to_user = await db.User.findOne({ where: {username : to_username} })
		if (!to_user){
			throw("There is no such user")
		}

		const to_wallet = await to_user.get_wallet()
		if (!to_wallet || !to_wallet.wallet_address){
			throw("There is no wallet for an user")
		}

		return await this.send_grams(ton, to_wallet.wallet_address, amount)
	}

	TonWallet.prototype.tx_history = async function (ton, limit=10) {
		return await ton_show_tx_history(ton, this.wallet_address)
	}


	return TonWallet;
};
*/