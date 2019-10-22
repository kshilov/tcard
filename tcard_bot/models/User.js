'use strict';

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
		User.hasOne(models.TonWallet, {onDelete: 'restrict'});
		User.hasMany(models.Action, {onDelete: 'restrict'});
		db = models;
	};
	
/*
Class methods
*/
	User.aff_channel_id = async function(channel_url) {
		var user = await User.findOne({
			where: {
				aff_channel_url : channel_url
			}
		});

		if (user) {
			return user.aff_channel_id
		}

		return undefined;

	}

	User.get_user = async function (telegram_id) {
		var user = await User.findOne({where: {telegram_id}});

		return user;
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


/*
Instance method
*/

	User.prototype.get_wallet = async function () {

		var wallet = await this.getTonWallet()
		
		if (!wallet){
			wallet = await db.TonWallet.build()
			
			wallet.UserId = this.id
			
			await wallet.save()
		}

		return wallet;
	}
	
	return User;
};
