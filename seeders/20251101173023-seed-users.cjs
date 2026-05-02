'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { default: db } = await import('../database/index.js');
    const { hashPassword } = await import('../utils/hashedAndComparePassword.js');

    await db.initialize();
    const roles = await db.Role.findAll();

    await queryInterface.bulkInsert('users', [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        code: 'USR0001',
        password: await hashPassword('admin123'),
        role: roles.length > 0 ? roles[0].id : 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
