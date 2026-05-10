import db from '../database/index.js';
import express from 'express';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import { autoAudit } from '../middleware/auditMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { systemConfigSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(autoAudit());

router.get('/', [verifyToken, isAdmin], async (req, res) => {
    try {
        const configs = await db.SystemConfig.findAll({
            order: [['key', 'ASC']],
        });
        res.json(configs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch system config' });
    }
});

router.put('/', [verifyToken, isAdmin, validateRequest(systemConfigSchema)], async (req, res) => {
    try {
        const { configs } = req.body;

        await db.sequelize.transaction(async (t) => {
            for (const item of configs) {
                if (item.key) {
                    await db.SystemConfig.update(
                        { value: String(item.value) },
                        { where: { key: item.key }, transaction: t }
                    );
                }
            }
        });

        const updatedConfigs = await db.SystemConfig.findAll({
            order: [['key', 'ASC']],
        });

        res.json(updatedConfigs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update system config' });
    }
});

router.get('/public', async (req, res) => {
    try {
        const configs = await db.SystemConfig.findAll({
            where: { key: ['password_recovery_enabled'] },
        });
        const result = {};
        for (const config of configs) {
            result[config.key] = config.value;
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch public config' });
    }
});

export default router;
