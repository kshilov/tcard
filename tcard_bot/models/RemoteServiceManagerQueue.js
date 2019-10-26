'use strict';

var db = null;
const {QueueStatus, QueueType} = require("../helpers/constants")
const logger = require('../helpers/logger')

module.exports = function(sequelize, DataTypes) {
	var RemoteServiceManagerQueue = sequelize.define('RemoteServiceManagerQueue', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		status : {
			type: DataTypes.INTEGER,
			allowNull: true
        },
        type : {
			type: DataTypes.INTEGER,
			allowNull: true
        },
		message : {
			type: DataTypes.TEXT,
			allowNull: true
        },
	}, {
		timestamps: true,
		schema: 'public'
    });
    
    RemoteServiceManagerQueue.prototype.get_message = async function() {
        return JSON.parse(this.message);
	}
	
	RemoteServiceManagerQueue.prototype.done = async function() {
		this.status = QueueStatus.done
		this.save()
	}
	
	RemoteServiceManagerQueue.new_channel_messages = async function(){
		var res = await RemoteServiceManagerQueue.findAll({
			where :{
				status : QueueStatus.new,
				type : QueueType.messages
			},
			limit : 50
		})

		return res;
	}

	RemoteServiceManagerQueue.new_transactions = async function(){
		var res = await RemoteServiceManagerQueue.findAll({
			where :{
				status : QueueStatus.new,
				type : QueueType.transactions
			},
			limit : 50
		})

		return res;
	}


	return RemoteServiceManagerQueue;
};
