'use strict';

var db = null;
const {SyncStatus, SyncType} = require("../helpers/constants")

module.exports = function(sequelize, DataTypes) {
	var Sync = sequelize.define('Sync', {
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
    
    Sync.prototype.get_message = async function() {
        return JSON.parse(this.message);
	}
	
	Sync.prototype.handled = async function() {
		this.status = SyncStatus.handled
		this.save()
    }

	return Sync;
};
