#!/usr/bin/env node

/**
 * Script para ejecutar comandos con el archivo .env.test cargado
 * Uso: node run-with-test-env.js <comando>
 */

import { spawn } from 'child_process';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env.test explícitamente
config({ path: join(__dirname, '.env.test') });

// Obtener el comando a ejecutar
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Error: Debes especificar un comando para ejecutar');
  console.error('Ejemplo: node run-with-test-env.js npx sequelize-cli db:create');
  process.exit(1);
}

console.log('🧪 Usando configuración de .env.test');
console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
console.log(`🔌 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
console.log('');

// Ejecutar el comando
const [command, ...commandArgs] = args;
const child = spawn(command, commandArgs, {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'test' }
});

child.on('exit', (code) => {
  process.exit(code);
});