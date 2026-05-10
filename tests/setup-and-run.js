// tests/setup-and-run.js
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Set NODE_ENV if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

console.log('🔄 Initializing test database...');

// Import and initialize database
const { default: db } = await import('../database/index.js');
await db.initialize();
console.log('✅ Database initialized');

// Export db globally
global.db = db;

// Run Mocha
const mocha = spawn(process.execPath, [
  '--experimental-specifier-resolution=node',
  join(projectRoot, 'node_modules', '.bin', 'mocha'),
  '--experimental-specifier-resolution=node',
  join(projectRoot, 'tests', '**', '*.test.js')
], {
  stdio: 'inherit',
  cwd: projectRoot,
  env: { 
    ...process.env, 
    NODE_ENV: 'test',
    TEST_DB_INITIALIZED: 'true'
  }
});

mocha.on('close', async (code) => {
  await db.sequelize.close();
  console.log('✅ Database connection closed');
  process.exit(code);
});