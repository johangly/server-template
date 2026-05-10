import { expect } from 'chai';
import request from 'supertest';
import app from '../../index.js';
import db from '../../database/index.js';
import bcrypt from 'bcrypt';

// Initialize database before tests
before(async function() {
  this.timeout(30000);
  await db.initialize();
});

describe('Authentication Endpoints', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create a test user before each test
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await db.Users.create({
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      code: 'USR001',
      role: 1,
      isActive: true,
      loginAttempts: 0
    });
  });

  describe('POST /api/users/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user.email).to.equal('test@example.com');
      expect(res.body.user).not.to.have.property('password');
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error');
      expect(res.body).to.have.property('remainingAttempts');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error');
    });

    it('should reject login for inactive user', async () => {
      await testUser.update({ isActive: false });

      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('error');
    });

    it('should lock account after max failed attempts', async () => {
      // Make 5 failed login attempts (assuming max is 5)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/users/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          });
      }

      // Next attempt should return locked status
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).to.equal(429);
      expect(res.body.error).toContain('bloqueada');
    });

    it('should decrement remaining attempts on failed login', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).to.equal(401);
      expect(res.body.remainingAttempts).toBeLessThan(5);
      expect(res.body.remainingAttempts).toBeGreaterThanOrEqual(0);
    });
  });

  describe('POST /api/users/logout', () => {
    beforeEach(async () => {
      // Login to get token
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      authToken = loginRes.body.token;
    });

    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/users/logout')
        .send({ email: 'test@example.com' });

      expect(res.status).to.equal(200);
      expect(res.body.message).toContain('logout');
    });
  });

  describe('Password Recovery', () => {
    it('should request password reset', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(res.status).to.equal(200);
      expect(res.body.message).toContain('email');

      // Verify token was created
      const token = await db.PasswordResetToken.findOne({
        where: { userId: testUser.id }
      });
      expect(token).to.be.ok;
    });

    it('should reject password reset for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      // Should return 200 even if email doesn't exist (security)
      expect(res.status).to.equal(200);
    });

    it('should reset password with valid token', async () => {
      // Create reset token
      const token = await db.PasswordResetToken.create({
        userId: testUser.id,
        token: 'valid-token-123',
        expiresAt: new Date(Date.now() + 3600000) // 1 hour
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'valid-token-123',
          password: 'newpassword123'
        });

      expect(res.status).to.equal(200);
      expect(res.body.message).toContain('actualizada');

      // Verify password was changed
      const updatedUser = await db.Users.findByPk(testUser.id);
      const isMatch = await bcrypt.compare('newpassword123', updatedUser.password);
      expect(isMatch).to.equal(true);
    });

    it('should reject invalid reset token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'newpassword123'
        });

      expect(res.status).to.equal(400);
    });
  });
});
