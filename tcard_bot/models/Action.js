'use strict';

const {ActionType, ActionStatus} = require("../helpers/constants")


module.exports = function(sequelize, DataTypes) {
	var Action = sequelize.define('Action', {
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
        from_username : {
            type: DataTypes.STRING,
			allowNull: true  
        },
        to_username : {
            type: DataTypes.STRING,
			allowNull: true 
        }
	}, {
		timestamps: true,
		schema: 'public'
    });
    
    Action.prototype.get_message = async function() {
        return JSON.parse(this.message);
	}
	
	Action.prototype.done = async function() {
		this.status = ActionStatus.handled
		this.save()
    }

	return Action;
};
