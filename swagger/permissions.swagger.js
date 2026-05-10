/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Gestión de permisos del sistema
 */

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Obtener todos los permisos
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de permisos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Permission'
 *   post:
 *     summary: Crear un nuevo permiso
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - resource
 *               - action
 *             properties:
 *               name:
 *                 type: string
 *                 example: inventory:create
 *               description:
 *                 type: string
 *                 example: Create inventory items
 *               resource:
 *                 type: string
 *                 example: inventory
 *               action:
 *                 type: string
 *                 enum: [create, read, update, delete]
 *                 example: create
 *     responses:
 *       201:
 *         description: Permiso creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Permission'
 */

/**
 * @swagger
 * /permissions/{id}:
 *   get:
 *     summary: Obtener permiso por ID
 *     tags: [Permissions]
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
 *         description: Permiso encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Permission'
 *   put:
 *     summary: Actualizar permiso
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               resource:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [create, read, update, delete]
 *     responses:
 *       200:
 *         description: Permiso actualizado
 *   delete:
 *     summary: Eliminar permiso
 *     tags: [Permissions]
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
 *         description: Permiso eliminado
 */

/**
 * @swagger
 * /permissions/resources:
 *   get:
 *     summary: Obtener todos los recursos agrupados
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recursos agrupados por nombre
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Permission'
 */