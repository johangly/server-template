'use strict';

const { execSync } = require('child_process');
const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🌱 Ejecutando seeders maestros...\n');

    // Lista de seeders en orden de ejecución
    const seeders = [
      '20251101155956-seed-roles.cjs',              // 1. Roles (Admin, User, Guest)
      '20251101173023-seed-users.cjs',              // 2. Usuario admin por defecto
      '20260102000000-seed-permissions.cjs',        // 3. Permisos base
      '20260102000001-seed-admin-permissions.cjs',  // 4. Asignar permisos a rol Admin
      '20260103000000-seed-audit-config.cjs',       // 5. Configuración de auditoría
      '20260103000001-seed-audit-permissions.cjs',  // 6. Permisos de auditoría
      '20260104000000-seed-system-config.cjs',      // 7. Configuración del sistema
      '20260104000001-seed-system-config-permissions.cjs' // 8. Permisos de configuración
    ];

    // Ejecutar cada seeder
    for (const seeder of seeders) {
      try {
        console.log(`📦 Ejecutando: ${seeder}`);
        execSync(`npx sequelize-cli db:seed --seed ${seeder}`, {
          cwd: path.resolve(__dirname, '..'),
          stdio: 'inherit'
        });
        console.log(`✅ Completado: ${seeder}\n`);
      } catch (error) {
        console.error(`❌ Error en ${seeder}:`, error.message);
        // Continuar con el siguiente seeder aunque uno falle
      }
    }

    console.log('🎉 Todos los seeders han sido ejecutados!');
    console.log('\n📋 Resumen de datos creados:');
    console.log('  • Roles: Admin, User, Guest');
    console.log('  • Usuario: admin@example.com / admin123');
    console.log('  • Permisos: CRUD completo para users, roles, permissions');
    console.log('  • Auditoría: Configuración activada');
    console.log('  • Configuración: SMTP y parámetros del sistema');
  },

  async down(queryInterface, Sequelize) {
    console.log('⚠️  Revirtiendo todos los seeders...');
    
    // Eliminar en orden inverso para respetar dependencias
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
    await queryInterface.bulkDelete('audit_configs', null, {});
    await queryInterface.bulkDelete('system_configs', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('role', null, {});
    
    console.log('✅ Todos los datos de seed han sido eliminados');
  }
};