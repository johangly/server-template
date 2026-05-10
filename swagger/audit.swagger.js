/**
 * @swagger
 * tags:
 *   name: Audit Logs
 *   description: Logs de auditoría del sistema
 */

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: Obtener logs de auditoría
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filtrar por usuario
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filtrar por acción (create, read, update, delete)
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: Filtrar por recurso
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicio (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */

/**
 * @swagger
 * /audit-logs/stats:
 *   get:
 *     summary: Obtener estadísticas de auditoría
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 byAction:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                 byResource:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 */

/**
 * @swagger
 * /audit-logs/{id}:
 *   get:
 *     summary: Obtener log específico
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Log encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditLog'
 */

/**
 * @swagger
 * tags:
 *   name: Audit Config
 *   description: Configuración de auditoría
 */

/**
 * @swagger
 * /audit-config:
 *   get:
 *     summary: Obtener configuración de auditoría
 *     tags: [Audit Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración actual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                 logAll:
 *                   type: boolean
 *                 excludedResources:
 *                   type: array
 *                   items:
 *                     type: string
 *   put:
 *     summary: Actualizar configuración
 *     tags: [Audit Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               logAll:
 *                 type: boolean
 *               excludedResources:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Configuración actualizada
 */