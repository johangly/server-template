'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("audit_config", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			resource: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			action: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			enabled: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
		});

		await queryInterface.addIndex("audit_config", ["resource", "action"], {
			unique: true,
			name: "unique_audit_config",
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable("audit_config");
	},
};
