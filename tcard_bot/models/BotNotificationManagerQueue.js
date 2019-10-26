'use strict';

const {NotificationStatus, NotificationType, BOT_NOTIFICATION_ERROR} = require("../helpers/constants");

const logger = require('../helpers/logger')

let db;

module.exports = function(sequelize, DataTypes) {
	var BotNotificationManagerQueue = sequelize.define('BotNotificationManagerQueue', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		status : {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		type : {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		data : {
			type: DataTypes.TEXT,
			allowNull: false,	
		},
		tgId : {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		username : {
			type: DataTypes.STRING,
			allowNull: true
		},
		period_length :{
			type: DataTypes.INTEGER,
			allowNull: true	
		},
		per_period : {
			type: DataTypes.INTEGER,
			allowNull: true	
		}
	}, {
		timestamps: true,
		schema: 'public'
	});

	BotNotificationManagerQueue.associate = function(models) {
		db = models;
	};

	BotNotificationManagerQueue.received_prize = async function(tgId, data){
		if (!data) {
			return BOT_NOTIFICATION_ERROR.wrong_data; 
		}

		var notification;
		try{
			var username = await db.User.get_username(tgId);
			notification = await BotNotificationManagerQueue._create_raw_notification(
				NotificationType.prize,
				tgId,
				username,
				NotificationStatus.new,
				data
			)
		}catch(err){
			logger.error("cant' BotNotificationManagerQueue.received_prize %s", err)
			return BOT_NOTIFICATION_ERROR.unknown_error;
		}
		
		return notification;
	}


	BotNotificationManagerQueue.add_aff_channel_post = async function(data){
		if (!data) {
			return BOT_NOTIFICATION_ERROR.wrong_data; 
		}

		var notification;
		try{
			notification =  await BotNotificationManagerQueue._create_raw_notification(
				NotificationType.aff_channel_post,
				0,
				'',
				NotificationStatus.new,
				data
			)
		}catch(err){
			logger.error("cant' add_aff_channel_post %s", err)
			return BOT_NOTIFICATION_ERROR.unknown_error;
		}
		
		return notification;
	}

	BotNotificationManagerQueue.received_money = async function(tgId, data){
		if (!data) {
			return BOT_NOTIFICATION_ERROR.wrong_data; 
		}

		var notification;
		try{
			var username = await db.User.get_username(tgId);
			notification = await BotNotificationManagerQueue._create_raw_notification(
				NotificationType.recieved,
				tgId,
				username,
				NotificationStatus.new,
				data
			)
		}catch(err){
			logger.error("cant' received_money %s", err)
			return BOT_NOTIFICATION_ERROR.unknown_error;
		}
		
		return notification;
	
	}

	BotNotificationManagerQueue.deposit = async function(tgId, data){
		if (!data) {
			return BOT_NOTIFICATION_ERROR.wrong_data; 
		}

		var notification;
		try{
			var username = await db.User.get_username(tgId);
			notification = await BotNotificationManagerQueue._create_raw_notification(
				NotificationType.deposit,
				tgId,
				username,
				NotificationStatus.new,
				data
			)
		}catch(err){
			logger.error("cant' deposit %s", err)
			return BOT_NOTIFICATION_ERROR.unknown_error;
		}

		return notification;
	}

	BotNotificationManagerQueue.withdraw = async function(tgId, data){
		if (!data) {
			return BOT_NOTIFICATION_ERROR.wrong_data; 
		}

		var notification;
		try{
			var username = await db.User.get_username(tgId);
			notification = await BotNotificationManagerQueue._create_raw_notification(
				NotificationType.withdraw,
				tgId,
				username,
				NotificationStatus.new,
				data
			)
		}catch(err){
			logger.error("cant' withdraw %s", err)
			return BOT_NOTIFICATION_ERROR.unknown_error;
		}
		
		return notification;
	}


	BotNotificationManagerQueue._create_raw_notification = async function(type, tgId, username, status, data){
		
		var notification;
		try {
			notification = await BotNotificationManagerQueue.create({
				status : status,
				type : type,
				data : JSON.stringify(data),
				tgId : tgId,
				username : username
			})
		}catch(err){
			logger.error("cant' BotNotificationManagerQueue._create_raw_notification %s", err)
			return BOT_NOTIFICATION_ERROR.unknown_error;
		}
		
		return notification;
	}

	BotNotificationManagerQueue.need_to_be_done = async function(){
		var res = await BotNotificationManagerQueue.findAll({
			where : {
				status : NotificationStatus.new
			},
			limit : 50
		})

		return res;

	}

	BotNotificationManagerQueue.prototype.get_data = async function(){
		return JSON.parse(this.data);
	}


	BotNotificationManagerQueue.prototype.done = async function(){
        this.status = NotificationStatus.done;
        this.save()
    }

    BotNotificationManagerQueue.prototype.failed = async function(){
        this.status = NotificationStatus.failed;
        this.save()
    }



	return BotNotificationManagerQueue;
};
