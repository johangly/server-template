'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('password_reset_tokens', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			userId: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			token: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
			},
			expiresAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			used: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		await queryInterface.addIndex('password_reset_tokens', ['token'], {
			name: 'idx_reset_token',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('password_reset_tokens');
	},
};
