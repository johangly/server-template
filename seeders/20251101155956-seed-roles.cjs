'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('role', [
      {
        name: 'Admin',
        description: 'Administrator with full access',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'User',
        description: 'Regular user with limited access',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Guest',
        description: 'Guest user with minimal access',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('role', null, {});

  }
};
