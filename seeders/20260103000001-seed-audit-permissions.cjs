'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const resources = ['audit-logs', 'audit-config'];
		const actions = ['create', 'read', 'update', 'delete'];
		const permissions = [];

		for (const resource of resources) {
			for (const action of actions) {
				permissions.push({
					name: `${resource}:${action}`,
					description: `Permission to ${action} ${resource}`,
					resource,
					action,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			}
		}

		await queryInterface.bulkInsert('permission', permissions, {});

		const [roles] = await queryInterface.sequelize.query(
			"SELECT id FROM role WHERE name = 'Admin'"
		);

		const [newPerms] = await queryInterface.sequelize.query(
			"SELECT id FROM permission WHERE resource IN ('audit-logs', 'audit-config')"
		);

		if (roles.length > 0 && newPerms.length > 0) {
			const adminRoleId = roles[0].id;
			const rolePermissions = newPerms.map((p) => ({
				roleId: adminRoleId,
				permissionId: p.id,
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			await queryInterface.bulkInsert('role_permission', rolePermissions, {});
		}
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.sequelize.query(
			"DELETE FROM permission WHERE resource IN ('audit-logs', 'audit-config')"
		);
	},
};
