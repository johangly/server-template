import jwt from 'jsonwebtoken';
import db from '../database/index.js';

export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        if (decoded.roleId) {
            const role = await db.Role.findByPk(decoded.roleId, {
                include: [{
                    model: db.Permission,
                    as: 'permissions',
                    through: { attributes: [] },
                }],
            });

            if (role) {
                req.user.permissions = role.permissions.map((p) => ({
                    id: p.id,
                    name: p.name,
                    resource: p.resource,
                    action: p.action,
                }));
            } else {
                req.user.permissions = [];
            }
        } else {
            req.user.permissions = [];
        }

        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token is not valid' });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role && req.user.role.name && req.user.role.name.toLowerCase() === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admins only.' });
    }
};
