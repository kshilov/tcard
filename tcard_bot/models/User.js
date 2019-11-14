'use strict';
const logger = require('../helpers/logger')
const {USER_ROLE} = require("../helpers/constants");
var db = null;

module.exports = function(sequelize, DataTypes) {
	const User = sequelize.define('User', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		role: {
            type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0
		},
		username: {
			type: DataTypes.STRING,
			allowNull: true
		},
		city: {
			type: DataTypes.STRING,
			allowNull: true
        },
        telegram_id:{
            type: DataTypes.INTEGER,
			allowNull: true
		},
		chat_id:{
            type: DataTypes.INTEGER,
			allowNull: true
        },
		email: {
			type: DataTypes.STRING,
			allowNull: true
        },
        phone: {
			type: DataTypes.STRING,
			allowNull: true
		},
		deleted: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		aff_channel_id: {
			type: DataTypes.INTEGER,
			allowNull: true	
		},
		aff_channel_url : {
			type: DataTypes.STRING,
			allowNull: true	
		},
		referrals : {
			type: DataTypes.STRING,
			allowNull: true
		}
	}, {
		timestamps: true,
		schema: 'public'
	});

/*
All methods start here
*/
	User.associate = function(models) {
		User.hasOne(models.DbWallet, {onDelete: 'restrict'});
		User.hasMany(models.Offer, {onDelete: 'restrict'});
		
		db = models;
	};
	

	User.all_channel_owners = async function(){
		var list = await User.findAll({
			attributes: ['id', 'username', 'telegram_id'], 
			raw: true,
			where: {
				role: USER_ROLE.channel_owner
			}
		});

		return list;
	}

	User.get_user = async function (telegram_id) {
		var user = await User.findOne({where: {telegram_id}});

		return user;
	};

	User.get_user_by_name = async function (username) {
		var user = await User.findOne({
			where: {
				username : username}
			});

		return user;
	};


	User.get_username = async function (telegram_id) {
		var user = await User.findOne({where: {telegram_id}});

		if (!user){
			return ''
		}

		return user.username
	};

	User.complete_creation = async function (from, chat_id) {
		const user = await User.create(
			{
				telegram_id : from.id,
				username : from.username,
				chat_id : chat_id
			}
		)

		return user;
	}

	User.prototype.add_city = async function(ct){
		this.city = ct;
		this.save()
	}

	User.prototype.has_city = function(){
		if (this.city){
			return true;
		}

		return false;
	}

	User.prototype.set_role = async function(role){
		this.role = role;
		this.save()
	}

	User.prototype.offer_access = function(){
		
		if (this.role >= USER_ROLE.channel_owner){
			return true;
		}

		return false;
	}

	User.prototype.is_channel_admin = function(telgeram_chat_memmber_data){
		
		if (telgeram_chat_memmber_data == 'creator' || telgeram_chat_memmber_data == 'administrator'){
			return true;
		}

		return false;
	}

	User.prototype.is_admin = function(){
		if (this.role == USER_ROLE.admin){
			return true;
		}

		return false;
	}
	User.prototype.add_ref = async function(ref){
		this.referrals = this.referrals + ref + '|';
		this.save()
	}

	User.prototype.get_wallet = async function () {

		var wallet = await this.getDbWallet()
		
		if (!wallet){
			wallet = await db.DbWallet.create({
				balance : 0,
				UserId : this.id
			})

			if (!wallet){
				throw "Can't create wallet"
			}
		}

		return wallet;
	}
	
	return User;
};
