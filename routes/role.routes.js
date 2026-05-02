import db from '../database/index.js';
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { hasPermission } from '../middleware/permissionMiddleware.js';
import { canManageRole, preventPrivilegeEscalation } from '../middleware/privilegeMiddleware.js';
import { autoAudit } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.use(autoAudit());

router.get('/', [verifyToken, hasPermission('roles', 'read')], async (req, res) => {
    try {
        const roles = await db.Role.findAll({
            include: [{
                model: db.Permission,
                as: 'permissions',
                through: { attributes: [] },
            }],
        });
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
});

router.post('/create-role', [verifyToken, hasPermission('roles', 'create')], async (req, res) => {
    const { name, description, permissionIds } = req.body;
    try {
        const userPermissions = req.user.permissions || [];
        const userPermissionIds = userPermissions.map((p) => p.id);

        if (permissionIds && permissionIds.length > 0) {
            const hasUnauthorized = permissionIds.some((id) => !userPermissionIds.includes(id));
            if (hasUnauthorized) {
                return res.status(403).json({
                    error: 'Access denied. Cannot assign permissions you do not possess.',
                });
            }
        }

        const newRole = await db.Role.create({
            name,
            description,
        });

        if (permissionIds && permissionIds.length > 0) {
            const rolePermissions = permissionIds.map((permissionId) => ({
                roleId: newRole.id,
                permissionId,
            }));
            await db.RolePermission.bulkCreate(rolePermissions);
        }

        const createdRole = await db.Role.findByPk(newRole.id, {
            include: [{
                model: db.Permission,
                as: 'permissions',
                through: { attributes: [] },
            }],
        });

        res.status(201).json(createdRole);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create role' });
    }
});

router.get('/:id', [verifyToken, hasPermission('roles', 'read')], async (req, res) => {
    const { id } = req.params;
    try {
        const role = await db.Role.findByPk(id, {
            include: [{
                model: db.Permission,
                as: 'permissions',
                through: { attributes: [] },
            }],
        });
        if (role) {
            res.json(role);
        } else {
            res.status(404).json({ error: 'Role not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch role' });
    }
});

router.put('/update-role/:id', [verifyToken, hasPermission('roles', 'update'), canManageRole], async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        const role = await db.Role.findByPk(id);
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }
        await role.update({ name, description });
        res.json(role);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update role' });
    }
});

router.delete('/delete-role/:id', [verifyToken, hasPermission('roles', 'delete'), canManageRole], async (req, res) => {
    const { id } = req.params;
    try {
        const role = await db.Role.findByPk(id);
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }
        const userCount = await db.Users.count({ where: { role: id } });
        if (userCount > 0) {
            return res.status(400).json({ error: 'Cannot delete role that has users assigned' });
        }
        await role.destroy();
        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete role' });
    }
});

router.get('/:id/permissions', [verifyToken, hasPermission('roles', 'read')], async (req, res) => {
    const { id } = req.params;
    try {
        const role = await db.Role.findByPk(id, {
            include: [{
                model: db.Permission,
                as: 'permissions',
                through: { attributes: [] },
            }],
        });
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.json(role.permissions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch role permissions' });
    }
});

router.put('/:id/permissions', [verifyToken, hasPermission('roles', 'update'), canManageRole], async (req, res) => {
    const { id } = req.params;
    const { permissionIds } = req.body;
    try {
        const role = await db.Role.findByPk(id);
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        if (!Array.isArray(permissionIds)) {
            return res.status(400).json({ error: 'permissionIds must be an array' });
        }

        const userPermissions = req.user.permissions || [];
        const userPermissionIds = userPermissions.map((p) => p.id);
        const hasUnauthorized = permissionIds.some((pid) => !userPermissionIds.includes(pid));
        if (hasUnauthorized) {
            return res.status(403).json({
                error: 'Access denied. Cannot assign permissions you do not possess.',
            });
        }

        await db.sequelize.transaction(async (t) => {
            await db.RolePermission.destroy({ where: { roleId: id }, transaction: t });

            if (permissionIds.length > 0) {
                const rolePermissions = permissionIds.map((permissionId) => ({
                    roleId: id,
                    permissionId,
                }));
                await db.RolePermission.bulkCreate(rolePermissions, { transaction: t });
            }
        });

        const updatedRole = await db.Role.findByPk(id, {
            include: [{
                model: db.Permission,
                as: 'permissions',
                through: { attributes: [] },
            }],
        });

        res.json(updatedRole);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update role permissions' });
    }
});

export default router;
