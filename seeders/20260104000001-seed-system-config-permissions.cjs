'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		const resources = ['system-config'];
		const actions = ['read', 'update'];
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

		const existingPerms = await queryInterface.sequelize.query(
			'SELECT name FROM permission',
			{ type: Sequelize.QueryTypes.SELECT }
		);
		const existingPermNames = new Set(existingPerms.map(r => r.name));

		const toInsert = permissions.filter(p => !existingPermNames.has(p.name));

		if (toInsert.length > 0) {
			await queryInterface.bulkInsert('permission', toInsert, {});
		}

		const [roles] = await queryInterface.sequelize.query(
			"SELECT id FROM role WHERE name = 'Admin'"
		);

		const [newPerms] = await queryInterface.sequelize.query(
			"SELECT id FROM permission WHERE resource IN ('system-config')"
		);

		if (roles.length > 0 && newPerms.length > 0) {
			const adminRoleId = roles[0].id;

			const existingRolePerms = await queryInterface.sequelize.query(
				'SELECT "permissionId" FROM role_permission WHERE "roleId" = :roleId AND "permissionId" IN (:permIds)',
				{
					replacements: {
						roleId: adminRoleId,
						permIds: newPerms.map(p => p.id),
					},
					type: Sequelize.QueryTypes.SELECT,
				}
			);
			const existingPermIds = new Set(existingRolePerms.map(r => r.permissionId));

			const toAssign = newPerms
				.filter(p => !existingPermIds.has(p.id))
				.map(p => ({
					"roleId": adminRoleId,
					"permissionId": p.id,
					"createdAt": new Date(),
					"updatedAt": new Date(),
				}));

			if (toAssign.length > 0) {
				await queryInterface.bulkInsert('role_permission', toAssign, {});
			}
		}
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.sequelize.query(
			"DELETE FROM permission WHERE resource IN ('system-config')"
		);
	},
};
