# 📚 Resumen de Documentación Swagger

## ✅ Qué se ha implementado

### 1. Configuración Swagger/OpenAPI

**Archivo:** `server/config/swagger.js`

Configuración central que define:
- ✅ Información de la API (título, versión, descripción)
- ✅ Servidor de desarrollo (`http://localhost:3001/api`)
- ✅ Esquema de seguridad JWT (Bearer token)
- ✅ Schemas reutilizables: User, Role, Permission, AuditLog, etc.

### 2. Documentación de Endpoints

**Ubicación:** `server/swagger/`

| Archivo | Endpoints Documentados |
|---------|----------------------|
| `auth.swagger.js` | POST /auth/login, POST /auth/logout, POST /auth/forgot-password, POST /auth/reset-password |
| `users.swagger.js` | GET/POST /users, GET/PUT/DELETE /users/{id} |
| `roles.swagger.js` | GET/POST /roles, GET/PUT/DELETE /roles/{id}, PUT /roles/{id}/permissions |
| `permissions.swagger.js` | GET/POST /permissions, GET/PUT/DELETE /permissions/{id}, GET /permissions/resources |
| `audit.swagger.js` | GET /audit-logs, GET /audit-logs/stats, GET /audit-logs/{id}, GET/PUT /audit-config |
| `system.swagger.js` | GET /health, GET /api |

### 3. Guías de Documentación

**`server/swagger/GUIA_SWAGGER.md`**
Guía completa de 800+ líneas que incluye:
- Cómo funciona Swagger/OpenAPI
- Estructura del proyecto
- Cómo agregar nuevos endpoints (2 opciones)
- Referencia completa de anotaciones
- 4 ejemplos prácticos completos
- Solución de problemas comunes
- Checklist para nuevos endpoints

**`server/swagger/EJEMPLO_INVENTARIO.md`**
Ejemplo paso a paso que muestra:
- Cómo crear un módulo completo desde cero
- Definición de schemas
- Documentación de 6 endpoints
- Rutas Express
- Modelo y migración
- Testing en Swagger UI

---

## 🚀 Cómo usar Swagger

### Acceder a la Documentación

```bash
# 1. Iniciar el servidor
cd server
npm run dev

# 2. Abrir en navegador
http://localhost:3001/api-docs
```

### Probar Endpoints Protegidos

1. **Obtener token:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "password": "admin123"}'
   ```

2. **En Swagger UI:**
   - Clic en **"Authorize"** (botón verde arriba a la derecha)
   - Ingresar: `Bearer eyJhbGciOiJIUzI1NiIs...`
   - Clic en **"Authorize"** ✅

3. **Probar endpoints:**
   - Expandir cualquier endpoint
   - Clic en **"Try it out"**
   - Completar parámetros
   - Clic en **"Execute"**

---

## ➕ Cómo Agregar Nuevos Endpoints

### Opción A: Crear Archivo Nuevo (Recomendado para módulos grandes)

**1. Crear archivo:** `server/swagger/products.swagger.js`

```javascript
/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestión de productos
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
```

**2. Agregar Schema en `server/config/swagger.js`:**

```javascript
components: {
  schemas: {
    // ... existentes ...
    Product: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Laptop' },
        price: { type: 'number', example: 999.99 }
      }
    }
  }
}
```

**3. Listo!** El archivo se carga automáticamente (reinicia el servidor)

### Opción B: Documentación Inline (Para endpoints simples)

```javascript
// En tu archivo de rutas (routes/products.routes.js)

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Buscar productos
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultados
 */
router.get('/search', verifyToken, productController.search);
```

---

## 📋 Plantilla Rápida

Copia y pega esta plantilla para nuevos endpoints:

```javascript
/**
 * @swagger
 * /TU-RUTA:
 *   get:
 *     summary: Descripción corta
 *     description: Descripción larga opcional
 *     tags: [NOMBRE-TAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parametro
 *         schema:
 *           type: string
 *         description: Descripción del parámetro
 *     responses:
 *       200:
 *         description: Éxito
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TU-SCHEMA'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error del servidor
 */
```

---

## 🔍 Ejemplo Visual

### Antes (código de ruta):

```javascript
router.get('/users', verifyToken, async (req, res) => {
  const users = await db.User.findAll();
  res.json(users);
});
```

### Después (con documentación):

```javascript
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/users', verifyToken, async (req, res) => {
  const users = await db.User.findAll();
  res.json(users);
});
```

**Resultado en Swagger UI:**
- ✅ Endpoint aparece en sección "Users"
- ✅ Muestra que requiere autenticación
- ✅ Muestra schema de respuesta
- ✅ Botón "Try it out" para probar

---

## 📚 Recursos

| Recurso | Ubicación | Descripción |
|---------|-----------|-------------|
| **Guía Completa** | `swagger/GUIA_SWAGGER.md` | Documentación exhaustiva (800+ líneas) |
| **Ejemplo Práctico** | `swagger/EJEMPLO_INVENTARIO.md` | Tutorial paso a paso con inventario |
| **Configuración** | `config/swagger.js` | Setup principal |
| **Endpoints Actuales** | `swagger/*.swagger.js` | Documentación de cada módulo |
| **Setup del Proyecto** | `SETUP.md` | Guía de instalación actualizada |

---

## ✅ Checklist para Nuevos Endpoints

- [ ] Crear archivo en `swagger/` o agregar anotaciones en `routes/`
- [ ] Definir tag apropiado
- [ ] Agregar `summary` descriptivo
- [ ] Incluir `security` si requiere autenticación
- [ ] Documentar parámetros (path, query, body)
- [ ] Documentar responses (200, 400, 401, 404, 500)
- [ ] Usar `$ref` para schemas reutilizables
- [ ] Agregar ejemplos en properties
- [ ] Probar en Swagger UI (`http://localhost:3001/api-docs`)
- [ ] Verificar que aparece correctamente

---

## 🆘 Solución de Problemas

### Swagger UI no carga
```bash
# Verificar que el servidor esté corriendo
npm run dev

# Verificar URL
http://localhost:3001/api-docs
```

### Endpoints no aparecen
```bash
# Verificar que no haya errores de sintaxis
node -c config/swagger.js

# Verificar que la ruta esté en 'apis' en swagger.js
apis: ['./routes/*.js', './swagger/*.js']
```

### Error de indentación
```javascript
// ❌ Incorrecto
/**
 * @swagger
 * /users:
 *   get:
 *   summary: "..."
 */

// ✅ Correcto
/**
 * @swagger
 * /users:
 *   get:
 *     summary: "..."
 */
```

---

## 🎯 Siguientes Pasos

1. **Leer la guía completa:** `swagger/GUIA_SWAGGER.md`
2. **Ver el ejemplo práctico:** `swagger/EJEMPLO_INVENTARIO.md`
3. **Probar Swagger UI:** `http://localhost:3001/api-docs`
4. **Agregar tu primer endpoint documentado**

---

**¿Preguntas?** Revisa `swagger/GUIA_SWAGGER.md` o los archivos existentes como referencia.