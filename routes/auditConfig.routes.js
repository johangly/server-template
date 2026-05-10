import db from '../database/index.js';
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { hasPermission } from '../middleware/permissionMiddleware.js';
import { autoAudit, updateAuditConfigCache } from '../middleware/auditMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { auditConfigSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(autoAudit());

router.get('/', [verifyToken, hasPermission('audit-config', 'read')], async (req, res) => {
    try {
        const configs = await db.AuditConfig.findAll({
            order: [['resource', 'ASC'], ['action', 'ASC']],
        });
        res.json(configs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit config' });
    }
});

router.put('/', [verifyToken, hasPermission('audit-config', 'update'), validateRequest(auditConfigSchema)], async (req, res) => {
    try {
        const { configs } = req.body;

        await db.sequelize.transaction(async (t) => {
            for (const item of configs) {
                if (item.id) {
                    await db.AuditConfig.update(
                        { enabled: item.enabled },
                        { where: { id: item.id }, transaction: t }
                    );
                }
            }
        });

        const updatedConfigs = await db.AuditConfig.findAll({
            order: [['resource', 'ASC'], ['action', 'ASC']],
        });

        // Actualizar el cache en memoria
        updatedConfigs.forEach(config => {
            updateAuditConfigCache(config.resource, config.action, config.enabled);
        });

        res.json(updatedConfigs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update audit config' });
    }
});

export default router;
