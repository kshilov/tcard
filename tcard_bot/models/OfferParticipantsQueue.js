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
        slot_selected : {
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

	OfferParticipantsQueue.get_participant = async function(tgId, offer_id){
		var is_exist = await db.OfferParticipantsQueue.findOne({
			where : {
				tgId : tgId,
				OfferId : offer_id
			}
		})
		return is_exist;
	}


	return OfferParticipantsQueue;
};
