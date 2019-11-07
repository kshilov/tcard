'use strict';

const logger = require('../helpers/logger')


let db = null
module.exports = function(sequelize, DataTypes) {
	var BotInstalls = sequelize.define('BotInstalls', {
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
		channel_name : {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		timestamps: true,
		schema: 'public'
	});
	
	BotInstalls.associate = function(models) {
        BotInstalls.belongsTo(models.User);
        db = models;
	};


	return BotInstalls;
};
