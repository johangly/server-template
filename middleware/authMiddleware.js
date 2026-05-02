import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token is not valid' });
        }
        req.user = user;
        next();
    });
};

export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role && req.user.role.name && req.user.role.name.toLowerCase() === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admins only.' });
    }
};

export const verifySysadmin = (req, res, next) => {
    const expectedToken = process.env.INSTANCE_API_TOKEN;
    const expectedInstanceName = process.env.INSTANCE_NAME;

    if (!expectedToken) {
        console.error('[verifySysadmin] INSTANCE_API_TOKEN is not configured');
        return res.status(500).json({ error: 'INSTANCE_API_TOKEN is not configured' });
    }
    if (!expectedInstanceName) {
        console.error('[verifySysadmin] INSTANCE_NAME is not configured');
        return res.status(500).json({ error: 'INSTANCE_NAME is not configured' });
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader || typeof authHeader !== 'string') {
        console.warn('[verifySysadmin] Missing or invalid authorization header');
        return res.status(401).json({ error: 'No authorization header provided' });
    }
    if (!authHeader.startsWith('Bearer ')) {
        console.warn('[verifySysadmin] Authorization header missing Bearer scheme');
        return res.status(401).json({ error: 'Authorization header must use Bearer scheme' });
    }
    const providedToken = authHeader.slice('Bearer '.length);
    if (!providedToken) {
        console.warn('[verifySysadmin] Bearer token is empty');
        return res.status(401).json({ error: 'No token provided' });
    }

    const providedInstanceName = req.headers['x-instance-name'];
    if (providedInstanceName === undefined || providedInstanceName === null) {
        console.warn('[verifySysadmin] Missing x-instance-name header');
        return res.status(400).json({ error: 'x-instance-name header is required' });
    }
    if (typeof providedInstanceName !== 'string') {
        console.warn('[verifySysadmin] x-instance-name is not a string');
        return res.status(400).json({ error: 'x-instance-name header must be a string' });
    }

    const safeFp = (value) => {
        const s = String(value ?? '');
        if (s.length <= 8) return `len=${s.length}`;
        return `${s.slice(0, 4)}...${s.slice(-4)}(len=${s.length})`;
    };

    console.log('[verifySysadmin] Incoming sysadmin request', {
        path: req.originalUrl,
        providedInstanceName,
        expectedInstanceName,
        providedToken: safeFp(providedToken),
        expectedToken: safeFp(expectedToken),
    });

    try {
        const expectedBuf = Buffer.from(String(expectedToken));
        const providedBuf = Buffer.from(String(providedToken));
        const tokenOk = expectedBuf.length === providedBuf.length
            && crypto.timingSafeEqual(expectedBuf, providedBuf);

        if (!tokenOk) {
            console.warn('[verifySysadmin] Token mismatch', {
                providedToken: safeFp(providedToken),
                expectedToken: safeFp(expectedToken),
            });
            return res.status(403).json({ error: 'Token is not valid' });
        }

        if (providedInstanceName !== expectedInstanceName) {
            console.warn('[verifySysadmin] Instance name mismatch', {
                providedInstanceName,
                expectedInstanceName,
            });
            return res.status(403).json({ error: 'Instance name is not valid' });
        }

        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token is not valid' });
    }
};
