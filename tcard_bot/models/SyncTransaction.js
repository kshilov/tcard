'use strict';

const {SyncDataStatus} = require("../helpers/constants");

/* 
We store list of aggregated transactions in Sync. 
Then each list we split and stor each transaction in SyncTransaction
The unique key aggregated_transaction_id
*/
module.exports = function(sequelize, DataTypes) {
	var SyncTransaction = sequelize.define('SyncTransaction', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		aggregated_transaction_id : {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: true
		},
		action_id : {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		status : {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		paid_usernames : {
			type: DataTypes.TEXT,
			allowNull: false
		},
		count : {
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
	
	SyncTransaction.prototype.done = async function () {
		this.status = SyncDataStatus.done;
		this.save()
	} 

	SyncTransaction.prototype.sync = async function () {
		this.status = SyncDataStatus.synced;
		this.save()
	} 

	SyncTransaction.prototype.get_data = async function() {
		return JSON.parse(this.data);
	}

	SyncTransaction.prototype.try_to_finish = async function(){
		if (this.count >= 3){
			this.done()
		}
	}

	SyncTransaction.prototype.add_paid = function (username) {
		var paid_usernames = JSON.parse(this.paid_usernames);
		if (!paid_usernames){
			paid_usernames = [];
		}

		paid_usernames.add(username)
		this.paid_usernames = paid_usernames;
		this.count = this.count + 1;
		this.save()
	}


	SyncTransaction.prototype.already_paid = function (username) {
		var paid_usernames = JSON.parse(this.paid_usernames);
		if (!paid_usernames){
			return false;
		}

		if (paid_usernames.includes(username)){
			return true;
		}

		return false;
	}

	SyncTransaction.sync_list = async function(aggregated_transaction_ids){
		SyncTransaction.update(
			{status: SyncDataStatus.synced},
			{where : { 
					aggregated_transaction_id : {
						$in : aggregated_transaction_ids
					}
				}
		})
	}


	SyncTransaction.ready_to_sync_array = async function() {
		var res =  await SyncTransaction.findAll({
			attributes: ['aggregated_transaction_id'], 
			raw: true,
			where : {
				count : 3,
				status : SyncDataStatus.done
			},
			limit : 50
		})

		var arr = []
        res.forEach(element => {
            arr.add(element.aggregated_transaction_id)
        });

		return arr;
	}

	SyncTransaction.need_to_be_done = async function() {
		var res = await SyncTransaction.findAll({
			where : {
				status : SyncDataStatus.new,
				count : {
					$lt : 3
				}
			},
			limit : 50
		})

		return res;
	}


	return SyncTransaction;
};
