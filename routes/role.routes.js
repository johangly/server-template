import db from '../database/index.js';
import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const roles = await db.Role.findAll();
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
});

router.post('/create-role', async (req, res) => {
    const { name, description } = req.body;
    try {
        const newRole = await db.Role.create({
            name,
            description
        });
        res.status(201).json(newRole);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create role' });
    }
});
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const role = await db.Role.findByPk(id);
        if (role) {
            res.json(role);
        } else {
            res.status(404).json({ error: 'Role not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch role' });
    }
});
router.put('/update-role:id', async (req, res) => {
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
export default router;