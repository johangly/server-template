import { expect } from 'chai';
import request from 'supertest';
import app from '../../index.js';
import db from '../../database/index.js';
import bcrypt from 'bcrypt';

import jwt from 'jsonwebtoken';

// Initialize database before tests
before(async function() {
  this.timeout(30000);
  await db.initialize();
  
  // Ensure admin role exists
  await db.Role.findOrCreate({
    where: { id: 1 },
    defaults: { id: 1, name: 'Admin', description: 'Administrator role' }
  });
});

describe('Users Endpoints', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let userToken;

  beforeEach(async () => {
    // Clean up existing test users
    await db.Users.destroy({ where: { email: ['admin@example.com', 'user@example.com', 'newuser@example.com', 'updated@example.com'] }, force: true });
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    adminUser = await db.Users.create({
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      code: 'USR001',
      role: 1, // Admin role
      isActive: true
    });

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    regularUser = await db.Users.create({
      email: 'user@example.com',
      password: userPassword,
      name: 'Regular User',
      code: 'USR002',
      role: 2, // Regular role
      isActive: true
    });

    // Generate tokens
    adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, roleId: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { id: regularUser.id, email: regularUser.email, roleId: regularUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    // Clean up test users
    if (adminUser) {
      await db.Users.destroy({ where: { id: adminUser.id }, force: true });
    }
    if (regularUser) {
      await db.Users.destroy({ where: { id: regularUser.id }, force: true });
    }
  });

  describe('GET /api/users', () => {
    it('should get all users (admin)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('data');
      expect(Array.isArray(res.body.data)).to.equal(true);
      expect(res.body.data.length).to.be.at.least(2);
    });

    it('should reject access without token', async () => {
      const res = await request(app)
        .get('/api/users');

      expect(res.status).to.equal(401);
    });

    it('should reject access with invalid token', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).to.equal(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      const res = await request(app)
        .get(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.id).to.equal(regularUser.id);
      expect(res.body.email).to.equal('user@example.com');
      expect(res.body).not.to.have.property('password');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(404);
    });
  });

  describe('POST /api/users/create-user', () => {
    it('should create new user (admin)', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'newpassword123',
        name: 'New User',
        roleId: 2,
        isActive: true
      };

      const res = await request(app)
        .post('/api/users/create-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);

      expect(res.status).to.equal(201);
      expect(res.body.email).to.equal(newUser.email);
      expect(res.body.name).to.equal(newUser.name);
      expect(res.body).not.to.have.property('password');

      // Verify in database
      const createdUser = await db.Users.findOne({
        where: { email: newUser.email }
      });
      expect(createdUser).to.be.ok;
    });

    it('should reject duplicate email', async () => {
      const duplicateUser = {
        email: 'user@example.com', // Already exists
        password: 'password123',
        name: 'Duplicate User',
        roleId: 2
      };

      const res = await request(app)
        .post('/api/users/create-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateUser);

      expect(res.status).to.equal(500); // API returns 500 for validation errors
    });

    it('should require all mandatory fields', async function() {
      this.timeout(5000);
      const incompleteUser = {
        email: 'incomplete@example.com'
        // Missing password, name, role
      };

      const res = await request(app)
        .post('/api/users/create-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteUser);

      expect(res.status).to.equal(400); // Validation error from schema
    });
  });

  describe('PUT /api/users/update-user/:id', () => {
    it('should update user (admin)', async () => {
      const updates = {
        name: 'Updated User Name',
        isActive: false
      };

      const res = await request(app)
        .put(`/api/users/update-user/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(res.status).to.equal(200);
      expect(res.body.name).to.equal(updates.name);
      expect(res.body.isActive).to.equal(updates.isActive);
    });

    it('should not allow regular user to update profile (admin only)', async () => {
      const updates = {
        name: 'My New Name'
      };

      const res = await request(app)
        .put(`/api/users/update-user/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates);

      expect(res.status).to.equal(403); // Only admins can update users
    });

    it('should not allow user to update other users profile', async () => {
      const updates = {
        name: 'Hacked Name'
      };

      const res = await request(app)
        .put(`/api/users/update-user/${adminUser.id}`) // Trying to update admin
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates);

      expect(res.status).to.equal(403);
    });
  });

  describe('DELETE /api/users/delete-user/:id', () => {
    it('should delete user (admin)', async () => {
      const res = await request(app)
        .delete(`/api/users/delete-user/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.message).to.contain('deleted');

      // Verify deletion
      const deletedUser = await db.Users.findByPk(regularUser.id);
      expect(deletedUser).to.be.null;
    });

    it('should allow admin to delete any account (including own)', async () => {
      // Note: API allows admin to delete any account, including their own
      // In production, you might want to add a check to prevent self-deletion
      const res = await request(app)
        .delete(`/api/users/delete-user/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
    });
  });

  describe('PUT /api/users/unlock-user/:id', () => {
    it('should unlock locked account (admin)', async () => {
      // Lock the user first
      await regularUser.update({
        loginAttempts: 5,
        lockUntil: new Date(Date.now() + 3600000)
      });

      const res = await request(app)
        .put(`/api/users/unlock-user/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.message).to.contain('unlocked');

      // Verify unlock
      const unlockedUser = await db.Users.findByPk(regularUser.id);
      expect(unlockedUser.loginAttempts).to.equal(0);
      expect(unlockedUser.lockUntil).to.be.null;
    });
  });
});
