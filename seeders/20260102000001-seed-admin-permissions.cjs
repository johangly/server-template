'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const [roles] = await queryInterface.sequelize.query(
			'SELECT id FROM role WHERE name = "Admin"'
		);

		const [permissions] = await queryInterface.sequelize.query(
			'SELECT id FROM permission'
		);

		if (roles.length > 0 && permissions.length > 0) {
			const adminRoleId = roles[0].id;
			const rolePermissions = permissions.map((p) => ({
				roleId: adminRoleId,
				permissionId: p.id,
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			await queryInterface.bulkInsert('role_permission', rolePermissions, {});
		}
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('role_permission', null, {});
	},
};
