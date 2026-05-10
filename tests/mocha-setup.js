// Mocha root hooks for ESM
// Este archivo debe ser cargado con --import

import { before, after } from 'mocha';
import db from '../database/index.js';

// Make db available globally for tests
global.db = db;

console.log('📝 Loading mocha-setup.js...');
console.log('📝 Database imported:', Object.keys(db));

// Setup before all tests
before(async function() {
  this.timeout(30000);
  try {
    await db.initialize();
    console.log('✅ Test database initialized');
    console.log('Available models:', Object.keys(db).filter(k => k !== 'sequelize' && k !== 'Sequelize' && k !== 'initialize'));
  } catch (error) {
    console.error('❌ Failed to initialize test database:', error);
    throw error;
  }
});

// Cleanup after all tests
after(async function() {
  await db.sequelize.close();
  console.log('✅ Test database connection closed');
});