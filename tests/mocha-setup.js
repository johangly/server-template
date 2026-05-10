// Mocha setup file
import db from './database/index.js';

// Make db available globally for tests
global.db = db;

// Setup before all tests
before(async function() {
  this.timeout(30000);
  try {
    await db.initialize();
    console.log('✅ Test database initialized');
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