'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("audit_log", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			userId: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			userEmail: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			action: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			resource: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			resourceId: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			description: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			oldValues: {
				type: Sequelize.JSON,
				allowNull: true,
			},
			newValues: {
				type: Sequelize.JSON,
				allowNull: true,
			},
			ip: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			userAgent: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
		});

		await queryInterface.addIndex("audit_log", ["resource", "action"], {
			name: "idx_audit_resource_action",
		});
		await queryInterface.addIndex("audit_log", ["userId"], {
			name: "idx_audit_user",
		});
		await queryInterface.addIndex("audit_log", ["createdAt"], {
			name: "idx_audit_created",
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable("audit_log");
	},
};
