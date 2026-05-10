import request from 'supertest';
import app from '../index';
import db from '../database/index';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Roles Endpoints', () => {
  let adminUser;
  let adminToken;
  let testRole;

  beforeEach(async () => {
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
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create a test role
    testRole = await db.Role.create({
      name: 'Test Role',
      description: 'Role for testing'
    });
  });

  describe('GET /api/roles', () => {
    it('should get all roles', async () => {
      const res = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should include role permissions', async () => {
      // Add permission to role
      const permission = await db.Permission.create({
        name: 'users:read',
        resource: 'users',
        action: 'read'
      });

      await testRole.addPermission(permission);

      const res = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`);

      const foundRole = res.body.find(r => r.id === testRole.id);
      expect(foundRole).toBeTruthy();
    });
  });

  describe('GET /api/roles/:id', () => {
    it('should get role by id', async () => {
      const res = await request(app)
        .get(`/api/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testRole.id);
      expect(res.body.name).toBe('Test Role');
    });

    it('should return 404 for non-existent role', async () => {
      const res = await request(app)
        .get('/api/roles/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
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

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(newRole.name);
      expect(res.body.description).toBe(newRole.description);

      // Verify in database
      const createdRole = await db.Role.findOne({
        where: { name: newRole.name }
      });
      expect(createdRole).toBeTruthy();
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

      expect(res.status).toBe(400);
    });

    it('should require role name', async () => {
      const res = await request(app)
        .post('/api/roles/create-role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Missing name' });

      expect(res.status).toBe(400);
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

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(updates.name);
      expect(res.body.description).toBe(updates.description);
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

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/roles/delete-role/:id', () => {
    it('should delete role', async () => {
      const res = await request(app)
        .delete(`/api/roles/delete-role/${testRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('eliminado');

      // Verify deletion
      const deletedRole = await db.Role.findByPk(testRole.id);
      expect(deletedRole).toBeNull();
    });

    it('should not delete role with assigned users', async () => {
      // Assign user to role
      await adminUser.update({ role: testRole.id });

      const res = await request(app)
        .delete(`/api/roles/delete-role/${testRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('Role Permissions Management', () => {
    it('should get role permissions', async () => {
      const res = await request(app)
        .get(`/api/roles/${testRole.id}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should update role permissions', async () => {
      // Create permissions
      const perm1 = await db.Permission.create({
        name: 'users:read',
        resource: 'users',
        action: 'read'
      });

      const perm2 = await db.Permission.create({
        name: 'users:write',
        resource: 'users',
        action: 'write'
      });

      const res = await request(app)
        .put(`/api/roles/${testRole.id}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          permissions: [perm1.id, perm2.id]
        });

      expect(res.status).toBe(200);

      // Verify permissions were assigned
      const rolePerms = await testRole.getPermissions();
      expect(rolePerms.length).toBe(2);
    });
  });
});
