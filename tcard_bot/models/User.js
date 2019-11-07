'use strict';
const logger = require('../helpers/logger')

var db = null;

module.exports = function(sequelize, DataTypes) {
	const User = sequelize.define('User', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		username: {
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
