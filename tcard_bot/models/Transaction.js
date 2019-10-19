'use strict';

module.exports = function(sequelize, DataTypes) {
	var Transaction = sequelize.define('Transaction', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		ton_id : {
			type: DataTypes.STRING,
			allowNull: true
        },
		status : {
			type: DataTypes.STRING,
			allowNull: true
        }
	}, {
		timestamps: true,
		schema: 'public'
	});

	return Transaction;
};
