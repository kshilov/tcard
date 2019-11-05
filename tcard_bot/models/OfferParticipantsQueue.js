'use strict';

const logger = require('../helpers/logger')

/*
status:
 0 - agreed
 1 - paid
 2 - received
 -1 - blocked
*/

let db = null
module.exports = function(sequelize, DataTypes) {
	var OfferParticipantsQueue = sequelize.define('OfferParticipantsQueue', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		tgId : {
			type: DataTypes.INTEGER,
			allowNull: false
        },
        username : {
			type: DataTypes.STRING,
			allowNull: true
        },
        slot : {
            type: DataTypes.INTEGER,
			allowNull: true
        },
        status : {
            type: DataTypes.INTEGER,
			allowNull: true        
        }
	}, {
		timestamps: true,
		schema: 'public'
	});
	
	OfferParticipantsQueue.associate = function(models) {
		OfferParticipantsQueue.belongsTo(models.Offer);
		db = models;
	};


	return OfferParticipantsQueue;
};
