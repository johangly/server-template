#!/usr/bin/env node

/**
 * Script maestro para ejecutar todos los seeders en orden
 * Uso: node scripts/seed-all.js
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// Lista de seeders en orden de ejecución
const seeders = [
  { file: '20251101155956-seed-roles.cjs', name: 'Roles base (Admin, User, Guest)' },
  { file: '20251101173023-seed-users.cjs', name: 'Usuario admin por defecto' },
  { file: '20260102000000-seed-permissions.cjs', name: 'Permisos base' },
  { file: '20260102000001-seed-admin-permissions.cjs', name: 'Asignar permisos a rol Admin' },
  { file: '20260103000000-seed-audit-config.cjs', name: 'Configuración de auditoría' },
  { file: '20260103000001-seed-audit-permissions.cjs', name: 'Permisos de auditoría' },
  { file: '20260104000000-seed-system-config.cjs', name: 'Configuración del sistema' },
  { file: '20260104000001-seed-system-config-permissions.cjs', name: 'Permisos de configuración' }
];

console.log('🌱 =========================================');
console.log('🌱  EJECUTANDO TODOS LOS SEEDERS');
console.log('🌱 =========================================\n');

let successCount = 0;
let failCount = 0;

for (const seeder of seeders) {
  try {
    console.log(`\n📦 ${successCount + 1}/${seeders.length} - ${seeder.name}`);
    console.log(`   Archivo: ${seeder.file}`);
    
    execSync(`npx sequelize-cli db:seed --seed ${seeder.file}`, {
      cwd: rootDir,
      stdio: 'inherit'
    });
    
    console.log(`   ✅ Completado\n`);
    successCount++;
  } catch (error) {
    console.error(`   ❌ Error (puede que ya existan los datos)`);
    failCount++;
  }
}

console.log('\n🎉 =========================================');
console.log('🎉  SEEDERS COMPLETADOS');
console.log('🎉 =========================================');
console.log(`\n✅ Exitosos: ${successCount}/${seeders.length}`);
if (failCount > 0) {
  console.log(`⚠️  Con errores: ${failCount}/${seeders.length}`);
  console.log('   (Probablemente los datos ya existen)');
}

console.log('\n📋 Datos creados:');
console.log('  • Roles: Admin, User, Guest');
console.log('  • Usuario: admin@example.com / admin123');
console.log('  • Permisos: CRUD para users, roles, permissions, audit, system-config');
console.log('  • Configuración: Auditoría activada, SMTP configurado');
console.log('\n🔑 Para iniciar sesión:');
console.log('   Email: admin@example.com');
console.log('   Password: admin123');
console.log('\n📚 Documentación API: http://localhost:3001/api-docs');
console.log('');

process.exit(failCount > 0 ? 1 : 0);