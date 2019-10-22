'use strict';

const {SyncDataStatus} = require("../helpers/constants");


module.exports = function(sequelize, DataTypes) {
	var SyncMessage = sequelize.define('SyncMessage', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		aggregated_message_id : {
			type: DataTypes.INTEGER,
			allowNull: false,
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

	SyncMessage.sync_list = async function(aggregated_message_ids){
		SyncMessage.update(
			{status: SyncDataStatus.synced},
			{where : { 
				aggregated_message_id : {
						$in : aggregated_message_ids
					}
				}
		})
	}

	SyncMessage.need_to_be_done = async function() {
		var res = await SyncMessage.findAll({
			where : {
				status : SyncDataStatus.new
			},
			limit : 50
		})

		return res;
	}

	SyncMessage.ready_to_sync_array = async function() {
		var res =  await SyncMessage.findAll({
			attributes: ['aggregated_message_id'], 
			raw: true,
			where : {
				status : SyncDataStatus.done
			},
			limit : 50
		})

		var arr = []
        res.forEach(element => {
            arr.add(element.aggregated_message_id)
        });

		return arr;
	}

	SyncMessage.prototype.done = async function () {
		this.status = SyncDataStatus.done;
		this.save()
	} 




	return SyncMessage;
};
