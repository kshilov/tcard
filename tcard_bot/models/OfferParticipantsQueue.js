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
        slot_selected : {
            type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0
        },
        status : {
            type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0   
		},
		hello_input : {
			type: DataTypes.TEXT,
			allowNull: true,        
		}
	}, {
		timestamps: true,
		schema: 'public'
	});
	
	OfferParticipantsQueue.associate = function(models) {
		OfferParticipantsQueue.belongsTo(models.Offer);
		db = models;
	};

	OfferParticipantsQueue.prototype.set_slot = async function(slot){
		this.slot_selected = slot;
		this.save()
	}

	OfferParticipantsQueue.prototype.save_hello_input = async function(data){
		this.hello_input = JSON.stringify(data)
		this.save()
	}

	return OfferParticipantsQueue;
};
