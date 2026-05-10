/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check del servidor
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: OK
 */

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Información de la API
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Información básica de la API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bienvenido a la API
 */