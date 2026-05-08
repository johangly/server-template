'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		const configs = [
			{
				key: 'password_recovery_enabled',
				value: 'true',
				type: 'boolean',
				description: 'Habilitar recuperación de contraseña por email',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				key: 'max_login_attempts',
				value: '5',
				type: 'number',
				description: 'Intentos máximos de login antes de bloqueo',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				key: 'lock_duration_minutes',
				value: '15',
				type: 'number',
				description: 'Duración del bloqueo de cuenta en minutos',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];

		const existingKeys = await queryInterface.sequelize.query(
			'SELECT "key" FROM system_config',
			{ type: Sequelize.QueryTypes.SELECT }
		);
		const existingKeySet = new Set(existingKeys.map(r => r.key));

		const toInsert = configs.filter(c => !existingKeySet.has(c.key));

		if (toInsert.length > 0) {
			await queryInterface.bulkInsert('system_config', toInsert, {});
		}
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('system_config', {
			key: ['password_recovery_enabled', 'max_login_attempts', 'lock_duration_minutes'],
		}, {});
	},
};
