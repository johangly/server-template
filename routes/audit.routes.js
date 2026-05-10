import db from '../database/index.js';
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { hasPermission } from '../middleware/permissionMiddleware.js';
import { autoAudit } from '../middleware/auditMiddleware.js';
import { validateRequest, sanitizeRequest } from '../middleware/validateRequest.js';
import { auditLogsQuerySchema } from '../validators/schemas.js';

const router = express.Router();

router.use(autoAudit());
router.use(sanitizeRequest);

router.get('/', [verifyToken, hasPermission('audit-logs', 'read'), validateRequest(auditLogsQuerySchema, 'query')], async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = (page - 1) * limit;

        const where = {};
        if (req.query.resource) where.resource = req.query.resource;
        if (req.query.action) where.action = req.query.action;
        if (req.query.userId) where.userId = req.query.userId;
        if (req.query.search) {
            where.description = { [db.Sequelize.Op.like]: `%${req.query.search}%` };
        }
        if (req.query.from || req.query.to) {
            where.createdAt = {};
            if (req.query.from) where.createdAt[db.Sequelize.Op.gte] = new Date(req.query.from);
            if (req.query.to) where.createdAt[db.Sequelize.Op.lte] = new Date(req.query.to);
        }

        const { count, rows } = await db.AuditLog.findAndCountAll({
            where,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        res.json({
            data: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

router.get('/:id', [verifyToken, hasPermission('audit-logs', 'read')], async (req, res) => {
    try {
        const log = await db.AuditLog.findByPk(req.params.id);
        if (!log) return res.status(404).json({ error: 'Audit log not found' });
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit log' });
    }
});

router.delete('/cleanup', [verifyToken, hasPermission('audit-logs', 'delete')], async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 90;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const deleted = await db.AuditLog.destroy({
            where: { createdAt: { [db.Sequelize.Op.lt]: cutoff } },
        });

        res.json({ message: `Deleted ${deleted} audit logs older than ${days} days` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cleanup audit logs' });
    }
});

router.get('/filters', [verifyToken, hasPermission('audit-logs', 'read')], async (req, res) => {
    try {
        const [resources] = await db.sequelize.query(
            'SELECT DISTINCT resource FROM audit_log ORDER BY resource ASC'
        );
        const [actions] = await db.sequelize.query(
            'SELECT DISTINCT action FROM audit_log ORDER BY action ASC'
        );
        res.json({
            resources: resources.map(r => r.resource),
            actions: actions.map(a => a.action),
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit filters' });
    }
});

export default router;
