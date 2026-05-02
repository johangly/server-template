'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("role_permission", {
			roleId: {
				allowNull: false,
				type: Sequelize.INTEGER,
				primaryKey: true,
				references: {
					model: "role",
					key: "id",
				},
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
			},
			permissionId: {
				allowNull: false,
				type: Sequelize.INTEGER,
				primaryKey: true,
				references: {
					model: "permission",
					key: "id",
				},
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
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

		await queryInterface.addIndex("role_permission", ["roleId", "permissionId"], {
			unique: true,
			name: "unique_role_permission",
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable("role_permission");
	},
};
