import db from '../database/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Test database configuration
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Global test utilities
global.testUtils = {
  // Create a test user
  async createTestUser(userData = {}) {
    const defaultUser = {
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Test User',
      code: 'USR001',
      role: 1,
      isActive: true,
      loginAttempts: 0,
      ...userData
    };
    
    return await db.Users.create(defaultUser);
  },

  // Generate JWT token for testing
  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  },

  // Clean up database after tests
  async cleanup() {
    // Delete in order to respect foreign keys
    await db.AuditLog?.destroy({ where: {}, truncate: true, cascade: true });
    await db.PasswordResetToken?.destroy({ where: {}, truncate: true, cascade: true });
    await db.SystemConfig?.destroy({ where: {}, truncate: true, cascade: true });
    await db.Users?.destroy({ where: {}, truncate: true, cascade: true });
  }
};

// Setup before all tests
beforeAll(async () => {
  try {
    await db.initialize();
    console.log('✅ Test database initialized');
  } catch (error) {
    console.error('❌ Failed to initialize test database:', error);
    throw error;
  }
});

// Clean up after each test
afterEach(async () => {
  await global.testUtils.cleanup();
});

// Close database connection after all tests
afterAll(async () => {
  await db.sequelize.close();
  console.log('✅ Test database connection closed');
});
