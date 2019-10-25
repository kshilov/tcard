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

	return RemoteServiceManagerQueue;
};
