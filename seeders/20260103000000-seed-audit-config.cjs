'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const resources = ['users', 'roles', 'permissions', 'auth', 'audit-logs', 'audit-config'];
		const actions = ['create', 'read', 'update', 'delete'];

		const configs = [];
		for (const resource of resources) {
			for (const action of actions) {
				// Skip auth delete — not applicable
				if (resource === 'auth' && action === 'delete') continue;
				configs.push({
					resource,
					action,
					enabled: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			}
		}

		// Add login/logout for auth
		configs.push({
			resource: 'auth',
			action: 'login',
			enabled: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		configs.push({
			resource: 'auth',
			action: 'logout',
			enabled: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await queryInterface.bulkInsert('audit_config', configs, {});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('audit_config', null, {});
	},
};
