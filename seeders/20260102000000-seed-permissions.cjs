'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const permissions = [];
		const resources = ['users', 'roles', 'permissions'];
		const actions = ['create', 'read', 'update', 'delete'];

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
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('permission', null, {});
	},
};
