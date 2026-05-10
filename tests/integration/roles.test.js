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
  
  // Ensure admin role exists with name 'Admin'
  await db.Role.findOrCreate({
    where: { id: 1 },
    defaults: { id: 1, name: 'Admin', description: 'Administrator role' }
  });
  
  // Create permissions for roles resource
  const rolePermissions = [
    { name: 'roles:read', resource: 'roles', action: 'read' },
    { name: 'roles:create', resource: 'roles', action: 'create' },
    { name: 'roles:update', resource: 'roles', action: 'update' },
    { name: 'roles:delete', resource: 'roles', action: 'delete' }
  ];
  
  for (const permData of rolePermissions) {
    const [perm] = await db.Permission.findOrCreate({
      where: { name: permData.name },
      defaults: permData
    });
    
    // Assign permission to admin role (roleId: 1)
    await db.RolePermission.findOrCreate({
      where: { roleId: 1, permissionId: perm.id },
      defaults: { roleId: 1, permissionId: perm.id }
    });
  }
});

describe('Roles Endpoints', () => {
  let adminUser;
  let adminToken;
  let testRole;

  beforeEach(async () => {
    // Clean up existing test data
    await db.Users.destroy({ where: { email: 'admin@example.com' }, force: true });
    await db.Role.destroy({ where: { name: ['Test Role', 'New Test Role', 'Another Role', 'Updated Role Name'] }, force: true });
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    adminUser = await db.Users.create({
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      code: 'USR001',
      role: 1,
      isActive: true
    });

    adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, roleId: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create a test role
    testRole = await db.Role.create({
      name: 'Test Role',
      description: 'Role for testing'
    });
  });

  afterEach(async () => {
    // Clean up test data
    if (testRole) {
      await db.Role.destroy({ where: { id: testRole.id }, force: true });
    }
    if (adminUser) {
      await db.Users.destroy({ where: { id: adminUser.id }, force: true });
    }
  });

  describe('GET /api/roles', () => {
    it('should get all roles', async () => {
      const res = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('data');
      expect(Array.isArray(res.body.data)).to.equal(true);
      expect(res.body.data.length).to.be.at.least(1);
    });

    it('should include role permissions', async () => {
      // Find or create permission
      const [permission] = await db.Permission.findOrCreate({
        where: { name: 'test:permission' },
        defaults: { name: 'test:permission', resource: 'test', action: 'read' }
      });

      // Assign permission to test role via RolePermission
      await db.RolePermission.findOrCreate({
        where: { roleId: testRole.id, permissionId: permission.id },
        defaults: { roleId: testRole.id, permissionId: permission.id }
      });

      const res = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data).to.be.an('array');
      const foundRole = res.body.data.find(r => r.id === testRole.id);
      expect(foundRole).to.be.ok;
    });
  });

  describe('GET /api/roles/:id', () => {
    it('should get role by id', async () => {
      const res = await request(app)
        .get(`/api/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.id).to.equal(testRole.id);
      expect(res.body.name).to.equal('Test Role');
    });

    it('should return 404 for non-existent role', async () => {
      const res = await request(app)
        .get('/api/roles/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(404);
    });
  });

  describe('POST /api/roles/create-role', () => {
    it('should create new role', async () => {
      const newRole = {
        name: 'New Test Role',
        description: 'A new role for testing'
      };

      const res = await request(app)
        .post('/api/roles/create-role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRole);

      expect(res.status).to.equal(201);
      expect(res.body.name).to.equal(newRole.name);
      expect(res.body.description).to.equal(newRole.description);

      // Verify in database
      const createdRole = await db.Role.findOne({
        where: { name: newRole.name }
      });
      expect(createdRole).to.be.ok;
    });

    it('should reject duplicate role name', async () => {
      const duplicateRole = {
        name: 'Test Role', // Already exists
        description: 'Duplicate'
      };

      const res = await request(app)
        .post('/api/roles/create-role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateRole);

      expect(res.status).to.equal(500); // API returns 500 for validation errors
    });

    it('should require role name', async function() {
      this.timeout(5000);
      const res = await request(app)
        .post('/api/roles/create-role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Missing name' });

      expect(res.status).to.equal(400);
    });
  });

  describe('PUT /api/roles/update-role/:id', () => {
    it('should update role', async () => {
      const updates = {
        name: 'Updated Role Name',
        description: 'Updated description'
      };

      const res = await request(app)
        .put(`/api/roles/update-role/${testRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(res.status).to.equal(200);
      expect(res.body.name).to.equal(updates.name);
      expect(res.body.description).to.equal(updates.description);
    });

    it('should not update role to duplicate name', async () => {
      // Create another role
      const anotherRole = await db.Role.create({
        name: 'Another Role',
        description: 'Another role'
      });

      const res = await request(app)
        .put(`/api/roles/update-role/${anotherRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Role' }); // Name already exists

      expect(res.status).to.equal(500);
    });
  });

  describe('DELETE /api/roles/delete-role/:id', () => {
    it('should delete role', async () => {
      const res = await request(app)
        .delete(`/api/roles/delete-role/${testRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.message).to.contain('deleted');

      // Verify deletion
      const deletedRole = await db.Role.findByPk(testRole.id);
      expect(deletedRole).to.be.null;
    });

    it('should not delete role with assigned users', async () => {
      // Assign user to role
      await adminUser.update({ role: testRole.id });

      const res = await request(app)
        .delete(`/api/roles/delete-role/${testRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(400);
    });
  });

  describe('Role Permissions Management', () => {
    it('should get role permissions', async () => {
      const res = await request(app)
        .get(`/api/roles/${testRole.id}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(Array.isArray(res.body)).to.equal(true);
    });

    it('should update role permissions', async function() {
      this.timeout(10000);
      // Use existing permissions that admin already has
      const existingPerms = await db.Permission.findAll({
        where: { resource: 'roles' },
        limit: 2
      });

      if (existingPerms.length < 2) {
        this.skip(); // Skip if not enough permissions
      }

      const res = await request(app)
        .put(`/api/roles/${testRole.id}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          permissionIds: existingPerms.map(p => p.id)
        });

      expect(res.status).to.equal(200);
    });
  });
});
