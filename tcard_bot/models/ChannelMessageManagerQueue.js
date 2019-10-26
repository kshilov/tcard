'use strict';

const {QueueStatus, QueueType, NotificationType} = require("../helpers/constants");

const logger = require('../helpers/logger')

let db = null;

module.exports = function(sequelize, DataTypes) {
	var ChannelMessageManagerQueue = sequelize.define('ChannelMessageManagerQueue', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		aggregated_message_id : {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: true
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

	ChannelMessageManagerQueue.associate = function(models) {
		db = models;
	};


	ChannelMessageManagerQueue.sync_list = async function(aggregated_message_ids){
		ChannelMessageManagerQueue.update(
			{status: QueueStatus.synced},
			{where : { 
				aggregated_message_id : {
					[db.Sequelize.Op.in] : aggregated_message_ids
					}
				}
		})
	}

	ChannelMessageManagerQueue.need_to_be_done = async function() {
		var res = await ChannelMessageManagerQueue.findAll({
			where : {
				status : QueueStatus.new
			},
			limit : 50
		})

		return res;
	}

	ChannelMessageManagerQueue.add_message = async function(message){
		if (!message){
			return;
		}

		var res = 0;
		try {
			await ChannelMessageManagerQueue.create({
				aggregated_message_id : message.id,
				status : QueueStatus.new,
				data : JSON.stringify(message)
			})  
		}catch(err){
			res = -1;
			logger.error("ChannelMessageManagerQueue.add_message bad message: %s", err)
		}

		return res;
	}

	ChannelMessageManagerQueue.prototype.done = async function () {
		this.status = QueueStatus.done;
		this.save()
	} 

	ChannelMessageManagerQueue.prototype.sync = async function () {
		this.status = QueueStatus.synced;
		this.save()
	} 

	ChannelMessageManagerQueue.prototype.get_data = async function() {
		return JSON.parse(this.data);
	}





	return ChannelMessageManagerQueue;
};
