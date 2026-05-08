import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.resend.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'resend',
        pass: process.env.SMTP_PASS || '',
    },
});

export async function sendPasswordResetEmail(to, token, userName) {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@tudominio.com',
        to,
        subject: 'Restablecer tu contraseña',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Restablecer contraseña</h2>
                <p>Hola ${userName},</p>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:</p>
                <p style="margin: 20px 0;">
                    <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Restablecer contraseña
                    </a>
                </p>
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
                <p style="margin-top: 30px; color: #999; font-size: 12px;">
                    Este enlace expira en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo.
                </p>
            </div>
        `,
    });
}

export async function testEmailConnection() {
    try {
        await transporter.verify();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export default transporter;
