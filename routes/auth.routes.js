import db from '../database/index.js';
import express from 'express';
import crypto from 'crypto';
import { hashPassword } from '../utils/hashedAndComparePassword.js';
import { sendPasswordResetEmail, testEmailConnection } from '../utils/email.js';
import { autoAudit } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.use(autoAudit());

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const config = await db.SystemConfig.findOne({ where: { key: 'password_recovery_enabled' } });
        if (!config || config.value !== 'true') {
            return res.status(403).json({ error: 'Password recovery is disabled' });
        }

        const user = await db.Users.findOne({ where: { email } });

        if (user) {
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

            await db.PasswordResetToken.create({
                userId: user.id,
                token,
                expiresAt,
            });

            try {
                await sendPasswordResetEmail(user.email, token, user.name);
            } catch (emailError) {
                console.error('Failed to send password reset email:', emailError.message);
            }
        }

        res.json({ message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const resetToken = await db.PasswordResetToken.findOne({
            where: { token, used: false },
        });

        if (!resetToken) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        if (new Date() > resetToken.expiresAt) {
            return res.status(400).json({ error: 'Token has expired' });
        }

        const user = await db.Users.findByPk(resetToken.userId);
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const passwordHash = await hashPassword(password);
        await user.update({ password: passwordHash });

        await resetToken.update({ used: true });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

router.get('/verify-reset-token/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const resetToken = await db.PasswordResetToken.findOne({
            where: { token, used: false },
            include: [{ model: db.Users, as: 'user', attributes: ['email', 'name'] }],
        });

        if (!resetToken || new Date() > resetToken.expiresAt) {
            return res.json({ valid: false });
        }

        res.json({ valid: true, email: resetToken.user.email });
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify token' });
    }
});

router.post('/test-email', async (req, res) => {
    try {
        const result = await testEmailConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
