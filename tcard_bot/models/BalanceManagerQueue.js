'use strict';

const {QueueStatus} = require("../helpers/constants");

/* 
We store list of aggregated transactions in Sync. 
Then each list we split and stor each transaction in BalanceManagerQueue
The unique key aggregated_transaction_id
*/
module.exports = function(sequelize, DataTypes) {
	var BalanceManagerQueue = sequelize.define('BalanceManagerQueue', {
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
	
	BalanceManagerQueue.prototype.done = async function () {
		this.status = QueueStatus.done;
		this.save()
	} 

	BalanceManagerQueue.prototype.sync = async function () {
		this.status = QueueStatus.synced;
		this.save()
	} 

	BalanceManagerQueue.prototype.get_data = async function() {
		return JSON.parse(this.data);
	}

	BalanceManagerQueue.prototype.try_to_finish = async function(){
		if (this.count >= 3){
			this.done()
		}
	}

	BalanceManagerQueue.prototype.add_paid = function (username) {
		var paid_usernames = JSON.parse(this.paid_usernames);
		if (!paid_usernames){
			paid_usernames = [];
		}

		paid_usernames.add(username)
		this.paid_usernames = paid_usernames;
		this.count = this.count + 1;
		this.save()
	}


	BalanceManagerQueue.prototype.already_paid = function (username) {
		var paid_usernames = JSON.parse(this.paid_usernames);
		if (!paid_usernames){
			return false;
		}

		if (paid_usernames.includes(username)){
			return true;
		}

		return false;
	}

	BalanceManagerQueue.sync_list = async function(aggregated_transaction_ids){
		BalanceManagerQueue.update(
			{status: QueueStatus.synced},
			{where : { 
					aggregated_transaction_id : {
						$in : aggregated_transaction_ids
					}
				}
		})
	}

	BalanceManagerQueue.need_to_be_done = async function() {
		var res = await BalanceManagerQueue.findAll({
			where : {
				status : QueueStatus.new,
				count : {
					$lt : 3
				}
			},
			limit : 50
		})

		return res;
	}


	return BalanceManagerQueue;
};
