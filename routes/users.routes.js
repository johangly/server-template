import db from '../database/index.js'
import express from 'express'
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword } from '../utils/hashedAndComparePassword.js'
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';
import { preventPrivilegeEscalation } from '../middleware/privilegeMiddleware.js';
import logger from "../utils/logger.js";
import { autoAudit } from '../middleware/auditMiddleware.js';
import { paginate } from '../utils/paginate.js';

const router = express.Router()

router.use(autoAudit());

const generateUserCode = () => 'USR' + Math.floor(1000 + Math.random() * 9000);

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Demasiados intentos de inicio de sesión, por favor intente de nuevo en 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
});

router.get('/', [verifyToken, isAdmin], async (req, res) => {
    try {
        const result = await paginate(db.Users, {
            page: req.query.page || 1,
            limit: Math.min(parseInt(req.query.limit) || 10, 100),
            search: req.query.search,
            searchFields: ['name', 'email', 'code'],
            filters: req.query.isActive !== undefined ? { isActive: req.query.isActive === 'true' } : {},
            order: [['createdAt', 'DESC']],
            include: [{ model: db.Role, as: 'userRole', attributes: ['id', 'name'] }],
        });
        res.json(result);
    } catch (error) {
        logger.info('Failed to fetch users', error)
        res.status(500).json({ error: 'Failed to fetch users' })
    }
})

router.post('/create-user', [verifyToken, isAdmin, preventPrivilegeEscalation], async (req, res) => {
    const { name, email, password, roleId } = req.body
    const code = generateUserCode()
    const passwordHash = await hashPassword(password)

    try {
        const role = await db.Role.findAll()
        const roleOfUser = roleId ? await db.Role.findByPk(roleId) : role.filter(r => r.name.toLowerCase() === 'user')[0].id
        if (!roleOfUser) {
            return res.status(404).json({ error: 'Role not found' })
        }
        
        const newUser = await db.Users.create({
            code,
            name,
            email,
            password: passwordHash,
            role: roleOfUser.dataValues.id,
            isActive: true
        })
        logger.info(`User created: ${newUser.name}`)
        res.status(201).json(newUser)
    } catch (error) {
        logger.error('Failed to create user', error)
        res.status(500).json({ error: 'Failed to create user' })
    }
})

router.get('/:id',[verifyToken, isAdmin], async (req, res) => {
    const { id } = req.params
    try {
        const user = await db.Users.findByPk(id)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        return res.json(user)
    } catch (error) {
        logger.error('Failed to fetch user', error)
        res.status(500).json({ error: 'Failed to fetch user' })
    }
})

router.put('/update-user/:id', [verifyToken, isAdmin, preventPrivilegeEscalation], async (req, res) => {
    const { id } = req.params
    const { name, email, password, roleId, isActive } = req.body

    try {
        const role = await db.Role.findAll()
        const roleOfUser = roleId ? await db.Role.findByPk(roleId, { attributes: ['id'] }) : role.filter(r => r.name.toLowerCase() === 'user')[0]
        const roleOfUserId = roleOfUser ? roleOfUser.id : null

        if (!roleOfUser) {
            return res.status(404).json({ error: 'Role not found' })
        }
        const user = id ? await db.Users.findByPk(id) : null

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        const updateData = { name, email, role: roleOfUserId };
        if (isActive !== undefined) {
            updateData.isActive = isActive;
        }
        if (password) {
            updateData.password = await hashPassword(password);
        }

        await user.update(updateData);
        res.json(user)
    } catch (error) {
        logger.error('Failed to update user', error)
        res.status(500).json({ error: 'Failed to update user' })
    }
})

router.post('/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await db.Users.findOne({ where: { email } })

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
            const minutesLeft = Math.ceil((new Date(user.lockUntil) - Date.now()) / 60000);
            return res.status(429).json({ 
                error: `Cuenta bloqueada. Intente de nuevo en ${minutesLeft} minutos` 
            });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Account is deactivated. Contact an administrator.' })
        }

        const isMatch = await comparePassword(password, user.dataValues.password)
        if (!isMatch) {
            const maxAttempts = process.env.MAX_LOGIN_ATTEMPTS ? parseInt(process.env.MAX_LOGIN_ATTEMPTS) : 5;
            const lockDuration = process.env.LOCK_DURATION_MINUTES ? parseInt(process.env.LOCK_DURATION_MINUTES) : 15;

            user.loginAttempts = (user.loginAttempts || 0) + 1;

            if (user.loginAttempts >= maxAttempts) {
                user.lockUntil = new Date(Date.now() + lockDuration * 60 * 1000);
                user.loginAttempts = 0;
                await user.save();
                return res.status(429).json({ 
                    error: `Demasiados intentos fallidos. Cuenta bloqueada por ${lockDuration} minutos` 
                });
            }

            await user.save();
            const remaining = maxAttempts - user.loginAttempts;
            return res.status(401).json({ 
                error: 'Invalid credentials',
                remainingAttempts: remaining 
            });
        }

        user.loginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        const role = await db.Role.findByPk(user.role, {
            include: [{
                model: db.Permission,
                as: 'permissions',
                through: { attributes: [] },
            }],
        })
        const permissions = role ? role.permissions.map((p) => ({
            id: p.id,
            name: p.name,
            resource: p.resource,
            action: p.action,
        })) : [];

        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            code: user.code,
            roleId: user.role,
            isActive: user.isActive,
            role: { name: role.name, id: role.id },
            permissions,
        };

        const token = jwt.sign(
            userData,
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRES_IN || '4h' } 
        );

        res.json({
            token,
            message: 'Login successful',
            user: userData
        })
    } catch (error) {
        logger.error('Failed to login', error)
        res.status(500).json({ error: 'Failed to login' })
    }
})

router.post('/logout', async (req, res) => {
    const { email } = req.body
    logger.info(`User logged out: ${email}`)
    await db.Users.update({
        lastLogin: new Date()
    }, { where: { email } })
    res.status(200).json({ message: 'Logout successful' })
})

router.delete('/delete-user/:id', [verifyToken, isAdmin], async (req, res) => {
    const { id } = req.params
    try {
        const user = await db.Users.findByPk(id)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        await user.destroy()
        res.json({ message: 'User deleted successfully' })
    } catch (error) {
        logger.error('Failed to delete user', error)
        res.status(500).json({ error: 'Failed to delete user' })
    }
})

router.put('/unlock-user/:id', [verifyToken, isAdmin], async (req, res) => {
    const { id } = req.params
    try {
        const user = await db.Users.findByPk(id)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        await user.update({ loginAttempts: 0, lockUntil: null })
        res.json({ message: 'User unlocked successfully' })
    } catch (error) {
        logger.error('Failed to unlock user', error)
        res.status(500).json({ error: 'Failed to unlock user' })
    }
})

export default router
