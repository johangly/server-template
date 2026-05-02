export const hasPermission = (resource, action) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions) {
            return res.status(403).json({ error: 'Access denied. No permissions loaded.' });
        }

        const userPermissions = req.user.permissions;
        const hasAccess = userPermissions.some(
            (p) => p.resource === resource && (p.action === action || p.action === '*')
        );

        if (hasAccess) {
            next();
        } else {
            res.status(403).json({
                error: `Access denied. Required permission: ${resource}:${action}`,
            });
        }
    };
};

export const hasAnyPermission = (permissions) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions) {
            return res.status(403).json({ error: 'Access denied. No permissions loaded.' });
        }

        const userPermissions = req.user.permissions;
        const hasAccess = permissions.some(({ resource, action }) =>
            userPermissions.some(
                (p) => p.resource === resource && (p.action === action || p.action === '*')
            )
        );

        if (hasAccess) {
            next();
        } else {
            res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
    };
};
