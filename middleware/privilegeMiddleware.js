import db from '../database/index.js';

export const preventPrivilegeEscalation = async (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    const userPermissionIds = userPermissions.map((p) => p.id);

    const targetRole = await db.Role.findByPk(req.body.roleId, {
        include: [{
            model: db.Permission,
            as: 'permissions',
            through: { attributes: [] },
        }],
    });

    if (!targetRole) {
        return res.status(404).json({ error: 'Role not found' });
    }

    const targetRolePermissionIds = targetRole.permissions.map((p) => p.id);
    const hasMorePermissions = targetRolePermissionIds.some((id) => !userPermissionIds.includes(id));

    if (hasMorePermissions) {
        return res.status(403).json({
            error: 'Access denied. Cannot assign a role with more permissions than your own.',
        });
    }

    next();
};

export const canManageRole = async (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    const userPermissionIds = userPermissions.map((p) => p.id);
    const roleId = req.params.id;

    const targetRole = await db.Role.findByPk(roleId, {
        include: [{
            model: db.Permission,
            as: 'permissions',
            through: { attributes: [] },
        }],
    });

    if (!targetRole) {
        return res.status(404).json({ error: 'Role not found' });
    }

    const targetRolePermissionIds = targetRole.permissions.map((p) => p.id);
    const hasMorePermissions = targetRolePermissionIds.some((id) => !userPermissionIds.includes(id));

    if (hasMorePermissions) {
        return res.status(403).json({
            error: 'Access denied. Cannot manage a role with more permissions than your own.',
        });
    }

    next();
};
