import db from '../database/index.js';

const responseBodies = new WeakMap();

const actionFromMethod = (method, path) => {
    const lower = path.toLowerCase();
    if (method === 'POST' && lower.includes('login')) return 'login';
    if (method === 'POST' && lower.includes('logout')) return 'logout';
    if (method === 'POST' && lower.includes('create')) return 'create';
    if (method === 'POST') return 'create';
    if (method === 'GET') return 'read';
    if (method === 'PUT') return 'update';
    if (method === 'DELETE') return 'delete';
    return method.toLowerCase();
};

const resourceFromPath = (path) => {
    const segments = path.replace(/^\/+|\/+$/g, '').split('/');
    const apiIndex = segments.findIndex((s) => s === 'api');
    if (apiIndex !== -1 && segments[apiIndex + 1]) {
        return segments[apiIndex + 1];
    }
    return segments[0] || 'unknown';
};

const resourceIdFromPath = (path) => {
    const segments = path.replace(/^\/+|\/+$/g, '').split('/');
    for (const seg of segments) {
        if (/^\d+$/.test(seg)) return seg;
    }
    return null;
};

const generateDescription = (action, resource, resourceId, email) => {
    const who = email || 'Unknown user';
    const what = {
        login: 'Inicio de sesión',
        logout: 'Cierre de sesión',
        create: 'Creación',
        read: 'Consulta',
        update: 'Actualización',
        delete: 'Eliminación',
    }[action] || action;

    const target = resourceId
        ? `${resource} #${resourceId}`
        : resource;

    return `${who} realizó "${what}" en ${target}`;
};

async function saveAudit(req, res, action, resource) {
    try {
        const AuditConfig = db.AuditConfig;
        if (AuditConfig) {
            const config = await AuditConfig.findOne({
                where: { resource, action },
            });
            if (config && !config.enabled) return;
        }

        const resourceId = resourceIdFromPath(req.originalUrl) || req.params?.id || null;

        let oldValues = null;
        if ((action === 'update' || action === 'delete') && resourceId && req.params?.id) {
            try {
                const modelMap = {
                    users: db.Users,
                    roles: db.Role,
                    permissions: db.Permission,
                };
                const Model = modelMap[resource];
                if (Model) {
                    const record = await Model.findByPk(req.params.id);
                    if (record) {
                        oldValues = record.toJSON();
                        delete oldValues.password;
                    }
                }
            } catch {
                // ignore
            }
        }

        const responseBody = responseBodies.get(res);

        const newValues = (action === 'create' || action === 'update') && responseBody
            ? responseBody
            : null;

        const description = generateDescription(
            action,
            resource,
            resourceId,
            req.user?.email
        );

        await db.AuditLog.create({
            userId: req.user?.id || null,
            userEmail: req.user?.email || null,
            action,
            resource,
            resourceId: resourceId?.toString() || null,
            description,
            oldValues,
            newValues,
            ip: req.ip || req.connection?.remoteAddress || null,
            userAgent: req.headers?.['user-agent'] || null,
        });
    } catch (err) {
        console.error('Audit save error:', err.message);
    }
}

export const autoAudit = () => {
    return (req, res, next) => {
        const resource = resourceFromPath(req.originalUrl);
        const action = actionFromMethod(req.method, req.originalUrl);

        const originalJson = res.json.bind(res);
        res.json = function (body) {
            responseBodies.set(res, body);
            return originalJson(body);
        };

        res.on('finish', () => {
            saveAudit(req, res, action, resource);
            responseBodies.delete(res);
        });

        next();
    };
};

export const audit = (resource, action) => {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            responseBodies.set(res, body);
            return originalJson(body);
        };

        res.on('finish', () => {
            saveAudit(req, res, action, resource);
            responseBodies.delete(res);
        });

        next();
    };
};
