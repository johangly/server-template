# 🎯 Ejemplo Práctico: Agregar un Nuevo Módulo

Este ejemplo muestra paso a paso cómo agregar un nuevo módulo completo (Inventario) con documentación Swagger.

---

## 📋 Paso 1: Crear el Schema

Edita `/server/config/swagger.js` y agrega el schema del nuevo recurso:

```javascript
components: {
  schemas: {
    // ... schemas existentes ...
    
    Inventory: {
      type: 'object',
      properties: {
        id: { 
          type: 'integer', 
          example: 1,
          description: 'ID único del item'
        },
        name: { 
          type: 'string', 
          example: 'Laptop Dell XPS 15',
          description: 'Nombre del producto'
        },
        sku: { 
          type: 'string', 
          example: 'DELL-XPS15-001',
          description: 'Código SKU único'
        },
        quantity: { 
          type: 'integer', 
          example: 50,
          minimum: 0,
          description: 'Cantidad en stock'
        },
        price: { 
          type: 'number', 
          format: 'float',
          example: 1299.99,
          description: 'Precio unitario'
        },
        category: { 
          type: 'string', 
          example: 'Electronics',
          enum: ['Electronics', 'Furniture', 'Office', 'Other'],
          description: 'Categoría del producto'
        },
        isActive: { 
          type: 'boolean', 
          example: true,
          description: 'Estado del producto'
        },
        createdAt: { 
          type: 'string', 
          format: 'date-time',
          description: 'Fecha de creación'
        },
        updatedAt: { 
          type: 'string', 
          format: 'date-time',
          description: 'Fecha de última actualización'
        }
      }
    },
    
    InventoryInput: {
      type: 'object',
      required: ['name', 'sku', 'quantity', 'price'],
      properties: {
        name: { 
          type: 'string', 
          minLength: 2,
          maxLength: 200,
          example: 'Laptop Dell XPS 15'
        },
        sku: { 
          type: 'string', 
          minLength: 3,
          maxLength: 50,
          example: 'DELL-XPS15-001'
        },
        quantity: { 
          type: 'integer', 
          minimum: 0,
          example: 50
        },
        price: { 
          type: 'number', 
          minimum: 0,
          example: 1299.99
        },
        category: { 
          type: 'string',
          enum: ['Electronics', 'Furniture', 'Office', 'Other'],
          default: 'Other'
        },
        isActive: { 
          type: 'boolean', 
          default: true
        }
      }
    }
  }
}
```

---

## 📋 Paso 2: Crear el Archivo de Swagger

Crea `/server/swagger/inventory.swagger.js`:

```javascript
/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Gestión de inventario y productos
 */

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Obtener todos los productos del inventario
 *     description: Retorna una lista paginada de productos con filtros opcionales
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Cantidad de items por página
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Electronics, Furniture, Office, Other]
 *         description: Filtrar por categoría
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o SKU
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Mostrar solo productos con stock bajo (< 10)
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Inventory'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: No autorizado - Token inválido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Acceso no autorizado
 *       500:
 *         description: Error del servidor
 *   
 *   post:
 *     summary: Crear un nuevo producto en el inventario
 *     description: Agrega un nuevo producto al inventario con validación de SKU único
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InventoryInput'
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Producto creado exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Inventory'
 *       400:
 *         description: Datos inválidos o SKU ya existe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error de validación"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["El SKU ya existe", "La cantidad debe ser mayor o igual a 0"]
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido - Sin permisos suficientes
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /inventory/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     description: Retorna los detalles completos de un producto específico
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del producto
 *         example: 1
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Inventory'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Producto no encontrado
 *       500:
 *         description: Error del servidor
 *   
 *   put:
 *     summary: Actualizar un producto
 *     description: Actualiza los datos de un producto existente
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InventoryInput'
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Producto actualizado exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Inventory'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error del servidor
 *   
 *   delete:
 *     summary: Eliminar un producto
 *     description: Elimina permanentemente un producto del inventario
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Producto eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /inventory/{id}/adjust-stock:
 *   patch:
 *     summary: Ajustar stock de un producto
 *     description: Incrementa o decrementa el stock de un producto
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adjustment
 *             properties:
 *               adjustment:
 *                 type: integer
 *                 description: Cantidad a ajustar (positivo o negativo)
 *                 example: -5
 *               reason:
 *                 type: string
 *                 description: Razón del ajuste
 *                 example: "Daño en transporte"
 *     responses:
 *       200:
 *         description: Stock ajustado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Stock ajustado exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     previousQuantity:
 *                       type: integer
 *                       example: 50
 *                     newQuantity:
 *                       type: integer
 *                       example: 45
 *                     adjustment:
 *                       type: integer
 *                       example: -5
 *       400:
 *         description: Datos inválidos o stock insuficiente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /inventory/stats:
 *   get:
 *     summary: Obtener estadísticas del inventario
 *     description: Retorna estadísticas generales del inventario
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProducts:
 *                       type: integer
 *                       example: 150
 *                     totalValue:
 *                       type: number
 *                       example: 125000.50
 *                     lowStockCount:
 *                       type: integer
 *                       example: 12
 *                     byCategory:
 *                       type: object
 *                       properties:
 *                         Electronics:
 *                           type: integer
 *                           example: 45
 *                         Furniture:
 *                           type: integer
 *                           example: 30
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */

module.exports = {};
```

---

## 📋 Paso 3: Crear las Rutas

Crea `/server/routes/inventory.routes.js`:

```javascript
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import db from '../database/index.js';

const router = express.Router();

// GET /api/inventory - Listar todos
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, lowStock } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (search) {
      where[db.Sequelize.Op.or] = [
        { name: { [db.Sequelize.Op.like]: `%${search}%` } },
        { sku: { [db.Sequelize.Op.like]: `%${search}%` } }
      ];
    }
    if (lowStock === 'true') {
      where.quantity = { [db.Sequelize.Op.lt]: 10 };
    }
    
    const offset = (page - 1) * limit;
    const { count, rows } = await db.Inventory.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener inventario',
      error: error.message
    });
  }
});

// POST /api/inventory - Crear
router.post('/', verifyToken, async (req, res) => {
  try {
    const item = await db.Inventory.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
});

// GET /api/inventory/:id - Obtener uno
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const item = await db.Inventory.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    });
  }
});

// PUT /api/inventory/:id - Actualizar
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const item = await db.Inventory.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    await item.update(req.body);
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
});

// DELETE /api/inventory/:id - Eliminar
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const item = await db.Inventory.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    await item.destroy();
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
});

// PATCH /api/inventory/:id/adjust-stock
router.patch('/:id/adjust-stock', verifyToken, async (req, res) => {
  try {
    const { adjustment, reason } = req.body;
    const item = await db.Inventory.findByPk(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    const previousQuantity = item.quantity;
    const newQuantity = previousQuantity + parseInt(adjustment);
    
    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente para el ajuste'
      });
    }
    
    await item.update({ quantity: newQuantity });
    
    res.json({
      success: true,
      message: 'Stock ajustado exitosamente',
      data: {
        previousQuantity,
        newQuantity,
        adjustment: parseInt(adjustment)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al ajustar stock',
      error: error.message
    });
  }
});

// GET /api/inventory/stats
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const totalProducts = await db.Inventory.count();
    const totalValue = await db.Inventory.sum(
      db.Sequelize.literal('quantity * price')
    );
    const lowStockCount = await db.Inventory.count({
      where: { quantity: { [db.Sequelize.Op.lt]: 10 } }
    });
    
    // Contar por categoría
    const byCategory = await db.Inventory.findAll({
      attributes: [
        'category',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
      ],
      group: ['category']
    });
    
    const categoryCount = {};
    byCategory.forEach(cat => {
      categoryCount[cat.category] = parseInt(cat.get('count'));
    });
    
    res.json({
      success: true,
      data: {
        totalProducts,
        totalValue: totalValue || 0,
        lowStockCount,
        byCategory: categoryCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

export default router;
```

---

## 📋 Paso 4: Registrar Rutas

Edita `/server/index.js` y agrega:

```javascript
// Importar al inicio del archivo
import inventoryRoutes from "./routes/inventory.routes.js";

// Agregar en la sección de rutas (antes de los endpoints base)
app.use(`${API_PREFIX}/inventory`, inventoryRoutes);
```

---

## 📋 Paso 5: Crear Modelo y Migración

### Modelo (`/server/models/inventory.js`):

```javascript
export default (sequelize, DataTypes) => {
  const Inventory = sequelize.define('Inventory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    category: {
      type: DataTypes.ENUM('Electronics', 'Furniture', 'Office', 'Other'),
      defaultValue: 'Other'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  return Inventory;
};
```

### Migración (crear con CLI):

```bash
npx sequelize-cli migration:generate --name create-inventory
```

---

## 🎉 Resultado

Después de seguir estos pasos, tendrás:

1. ✅ Un módulo completo de inventario funcional
2. ✅ Documentación Swagger interactiva en `/api-docs`
3. ✅ Endpoints documentados:
   - `GET /api/inventory` - Listar con filtros y paginación
   - `POST /api/inventory` - Crear producto
   - `GET /api/inventory/:id` - Ver detalle
   - `PUT /api/inventory/:id` - Actualizar
   - `DELETE /api/inventory/:id` - Eliminar
   - `PATCH /api/inventory/:id/adjust-stock` - Ajustar stock
   - `GET /api/inventory/stats` - Estadísticas

4. ✅ Schemas reutilizables (`Inventory`, `InventoryInput`)
5. ✅ Todos los códigos de respuesta documentados

---

## 🧪 Probar en Swagger UI

1. Iniciar el servidor: `npm run dev`
2. Ir a: `http://localhost:3001/api-docs`
3. Autorizar con tu token JWT
4. Buscar la sección "Inventory"
5. Probar cada endpoint con "Try it out"

---

**¿Preguntas?** Revisa la guía completa en `GUIA_SWAGGER.md`