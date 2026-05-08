'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.addColumn('users', 'loginAttempts', {
			type: Sequelize.INTEGER,
			allowNull: false,
			defaultValue: 0,
		});

		await queryInterface.addColumn('users', 'lockUntil', {
			type: Sequelize.DATE,
			allowNull: true,
		});

		await queryInterface.addIndex('users', ['lockUntil'], {
			name: 'idx_user_lock',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.removeColumn('users', 'loginAttempts');
		await queryInterface.removeColumn('users', 'lockUntil');
	},
};
