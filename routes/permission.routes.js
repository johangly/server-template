import db from '../database/index.js';
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { hasPermission } from '../middleware/permissionMiddleware.js';
import { autoAudit } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.use(autoAudit());

router.get('/', [verifyToken, hasPermission('permissions', 'read')], async (req, res) => {
    try {
        const permissions = await db.Permission.findAll();
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch permissions' });
    }
});

router.post('/create-permission', [verifyToken, hasPermission('permissions', 'create')], async (req, res) => {
    const { name, description, resource, action } = req.body;
    try {
        const newPermission = await db.Permission.create({
            name,
            description,
            resource,
            action,
        });
        res.status(201).json(newPermission);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create permission' });
    }
});

router.get('/:id', [verifyToken, hasPermission('permissions', 'read')], async (req, res) => {
    const { id } = req.params;
    try {
        const permission = await db.Permission.findByPk(id);
        if (permission) {
            res.json(permission);
        } else {
            res.status(404).json({ error: 'Permission not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch permission' });
    }
});

router.put('/update-permission/:id', [verifyToken, hasPermission('permissions', 'update')], async (req, res) => {
    const { id } = req.params;
    const { name, description, resource, action } = req.body;
    try {
        const permission = await db.Permission.findByPk(id);
        if (!permission) {
            return res.status(404).json({ error: 'Permission not found' });
        }
        await permission.update({ name, description, resource, action });
        res.json(permission);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update permission' });
    }
});

router.delete('/delete-permission/:id', [verifyToken, hasPermission('permissions', 'delete')], async (req, res) => {
    const { id } = req.params;
    try {
        const permission = await db.Permission.findByPk(id);
        if (!permission) {
            return res.status(404).json({ error: 'Permission not found' });
        }
        await permission.destroy();
        res.json({ message: 'Permission deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete permission' });
    }
});

export default router;
