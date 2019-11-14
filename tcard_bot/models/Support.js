'use strict';
const Markup = require('telegraf/markup')
const extra = require('telegraf/extra')

const logger = require('../helpers/logger')
const {i18n} = require('../middlewares/i18n')


/*
The core difference is the type of an offer:
0 - finished when the number of users are ready
1 - finished when the total amount are collected (f.e. here you can buy by slots)

data - we use this field to store fields of an offer. Different views know how to show it.
*/

let db = null
module.exports = function(sequelize, DataTypes) {
	var Support = sequelize.define('Support', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		status : {
			type: DataTypes.INTEGER,
            allowNull: true,
			defaultValue: 0
        },
        type : {
			type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        username : {
			type: DataTypes.STRING,
			allowNull: true
        },
        tgId : {
            type: DataTypes.INTEGER,
			allowNull: true
        },
        internal_user_id : {
            type: DataTypes.INTEGER,
			allowNull: true
        },
        message : {
            type: DataTypes.TEXT,
			allowNull: true,        
        }
	}, {
		timestamps: true,
		schema: 'public'
	});
	
	Support.associate = function(models) {
		db = models;
	};
	
	Support.create_ticket = async function(user_tg_id, message){
		let ticket;

		try {
            var internal_id = -1;
            var username = '';

			var current_user = await db.User.get_user(user_tg_id)
            if (current_user){
                internal_id = current_user.id;
                username = current_user.username;
            }

			ticket = await Support.create(
				{
                    username : username,
                    tgId : user_tg_id,
                    internal_user_id:  internal_id,
                    message : JSON.stringify(message)
				}
			)
		}catch(error){
			logger.error("Support.create_ticket: Can't create ticket %s", error)
			return -1;
		}

		return ticket;
	}


	return Support;
};
