# 📚 Guía de Swagger/OpenAPI

Guía completa para entender y extender la documentación de la API usando Swagger/OpenAPI.

---

## 📖 ¿Qué es Swagger/OpenAPI?

**Swagger UI** es una interfaz interactiva que permite:
- 📖 Ver todos los endpoints de la API documentados
- 🔐 Probar endpoints protegidos con JWT directamente desde el navegador
- 📋 Ver ejemplos de requests y responses
- 🧪 Ejecutar peticiones en tiempo real
- 📚 Entender la estructura de datos (schemas)

**URL de acceso:** `http://localhost:3001/api-docs`

---

## 🏗️ Estructura del Proyecto

```
server/
├── config/
│   └── swagger.js          # Configuración principal
├── swagger/                # Documentación de endpoints
│   ├── auth.swagger.js     # Autenticación
│   ├── users.swagger.js    # Usuarios
│   ├── roles.swagger.js    # Roles
│   ├── permissions.swagger.js
│   ├── audit.swagger.js    # Auditoría
│   └── system.swagger.js   # Sistema
└── index.js               # Integración con Express
```

---

## ⚙️ Cómo Funciona

### 1. Configuración Central (`config/swagger.js`)

Este archivo define:
- Información de la API (título, versión, descripción)
- Servidores disponibles
- Esquemas de seguridad (JWT)
- Schemas de datos reutilizables

```javascript
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Base Template',
      version: '1.1.0',
      description: 'API con autenticación JWT, RBAC dinámico...'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: { /* ... */ },
        Role: { /* ... */ }
      }
    }
  },
  apis: ['./routes/*.js', './swagger/*.js'] // Dónde buscar anotaciones
};
```

### 2. Anotaciones JSDoc

Swagger usa comentarios JSDoc especiales para generar la documentación:

```javascript
/**
 * @swagger
 * /ruta/endpoint:
 *   metodo:
 *     summary: Descripción corta
 *     tags: [Nombre del Tag]
 *     ...
 */
```

### 3. Integración con Express (`index.js`)

```javascript
import { swaggerUi, specs } from './config/swagger.js';

// Montar Swagger UI en /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

---

## 📝 Cómo Agregar Nuevos Endpoints

### Opción 1: Crear Nuevo Archivo de Swagger (Recomendado)

Para módulos grandes o nuevos recursos, crea un archivo dedicado:

**1. Crear archivo:** `swagger/products.swagger.js`

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
 *   post:
 *     summary: Crear un nuevo producto
 *     tags: [Products]
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
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Laptop Dell"
 *               price:
 *                 type: number
 *                 example: 999.99
 *               description:
 *                 type: string
 *                 example: "Laptop de alta performance"
 *     responses:
 *       201:
 *         description: Producto creado
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Products]
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
 *         description: Producto encontrado
 *       404:
 *         description: Producto no encontrado
 *   put:
 *     summary: Actualizar producto
 *     tags: [Products]
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
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Producto actualizado
 *   delete:
 *     summary: Eliminar producto
 *     tags: [Products]
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
 *         description: Producto eliminado
 */
```

**2. Agregar Schema en `config/swagger.js`:**

```javascript
components: {
  schemas: {
    // ... schemas existentes ...
    Product: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Laptop Dell' },
        price: { type: 'number', example: 999.99 },
        description: { type: 'string', example: 'Laptop de alta performance' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  }
}
```

### Opción 2: Documentación Inline en Rutas

Para endpoints simples, puedes documentar directamente en el archivo de rutas:

```javascript
// routes/product.routes.js

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
 *         description: Término de búsqueda
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Categoría del producto
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 */
router.get('/search', verifyToken, productController.search);
```

**Nota:** Asegúrate de que la ruta del archivo esté incluida en `apis` en `config/swagger.js`:

```javascript
apis: ['./routes/*.js', './swagger/*.js'] // Ya incluye ambos
```

---

## 📋 Referencia de Anotaciones

### Estructura Básica

```javascript
/**
 * @swagger
 * /ruta:
 *   metodo:           # get, post, put, delete, patch
 *     summary:        # Descripción corta (requerido)
 *     description:    # Descripción larga (opcional)
 *     tags:           # Agrupa endpoints [NombreTag]
 *     security:       # Requiere autenticación
 *       - bearerAuth: []
 *     parameters:     # Parámetros de ruta/query
 *     requestBody:    # Body para POST/PUT
 *     responses:      # Respuestas posibles
 */
```

### Parámetros

#### Parámetros de Ruta (Path)

```javascript
parameters:
  - in: path
    name: id
    required: true
    schema:
      type: integer
    description: ID del recurso
```

#### Parámetros de Query

```javascript
parameters:
  - in: query
    name: page
    schema:
      type: integer
      default: 1
    description: Número de página
  - in: query
    name: limit
    schema:
      type: integer
      default: 10
    description: Items por página
```

#### Parámetros de Header

```javascript
parameters:
  - in: header
    name: X-Custom-Header
    schema:
      type: string
    description: Header personalizado
```

### Request Body

```javascript
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required:
          - name
          - email
        properties:
          name:
            type: string
            minLength: 2
            maxLength: 100
          email:
            type: string
            format: email
          age:
            type: integer
            minimum: 0
            maximum: 150
          isActive:
            type: boolean
            default: true
```

### Responses

```javascript
responses:
  200:
    description: Éxito
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/User'
  201:
    description: Creado exitosamente
  400:
    description: Datos inválidos
    content:
      application/json:
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Email inválido"
            errors:
              type: array
              items:
                type: string
  401:
    description: No autorizado
  403:
    description: Prohibido (sin permisos)
  404:
    description: Recurso no encontrado
  500:
    description: Error del servidor
```

### Referencias a Schemas

```javascript
// Usar un schema definido en components/schemas
$ref: '#/components/schemas/User'

// Array de schemas
schema:
  type: array
  items:
    $ref: '#/components/schemas/Product'

// Schema anidado
schema:
  type: object
  properties:
    user:
      $ref: '#/components/schemas/User'
    products:
      type: array
      items:
        $ref: '#/components/schemas/Product'
```

---

## 🎯 Ejemplos Prácticos

### Ejemplo 1: Endpoint Simple

```javascript
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verificar estado del servidor
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Servidor funcionando
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: OK
 */
```

### Ejemplo 2: Endpoint con Autenticación

```javascript
/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Obtener perfil del usuario actual
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Token no proporcionado o inválido
 */
```

### Ejemplo 3: Endpoint con Paginación

```javascript
/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Obtener órdenes del usuario
 *     tags: [Orders]
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
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, cancelled]
 *     responses:
 *       200:
 *         description: Lista paginada de órdenes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     total:
 *                       type: integer
 */
```

### Ejemplo 4: Endpoint con Upload de Archivos

```javascript
/**
 * @swagger
 * /upload/avatar:
 *   post:
 *     summary: Subir avatar de usuario
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de avatar (jpg, png)
 *     responses:
 *       200:
 *         description: Avatar subido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: "https://cdn.example.com/avatars/user123.jpg"
 */
```

---

## 🔐 Configuración de Seguridad

### Requerir Autenticación

```javascript
/**
 * @swagger
 * /ruta-protegida:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     ...
 */
```

### Múltiples Esquemas de Seguridad

```javascript
// En config/swagger.js
components: {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    },
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key'
    }
  }
}

// En el endpoint
/**
 * @swagger
 * /ruta:
 *   get:
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 */
```

---

## 🎨 Personalización Avanzada

### Tags con Descripción

```javascript
/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Operaciones relacionadas con reportes y estadísticas
 *   externalDocs:
 *     description: Más información
 *     url: https://docs.example.com/reports
 */
```

### Esquemas Reutilizables

```javascript
// En config/swagger.js
components: {
  schemas: {
    // Schema base
    Timestamp: {
      type: 'object',
      properties: {
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    },
    // Schema que extiende otro
    UserWithTimestamps: {
      allOf: [
        { $ref: '#/components/schemas/User' },
        { $ref: '#/components/schemas/Timestamp' }
      ]
    }
  },
  parameters: {
    PageParam: {
      in: 'query',
      name: page,
      schema: { type: 'integer', default: 1 },
      description: 'Número de página'
    }
  },
  responses: {
    NotFound: {
      description: 'Recurso no encontrado',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Recurso no encontrado' }
            }
          }
        }
      }
    }
  }
}

// Uso
/**
 * @swagger
 * /users:
 *   get:
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *     responses:
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
```

---

## 🧪 Probar Endpoints en Swagger UI

### 1. Autenticarse

1. Abrir `http://localhost:3001/api-docs`
2. Hacer clic en el botón **"Authorize"** (arriba a la derecha)
3. Ingresar el token JWT:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Clic en **"Authorize"** y cerrar el diálogo

### 2. Probar un Endpoint

1. Buscar el endpoint deseado
2. Clic en **"Try it out"**
3. Completar los parámetros necesarios
4. Clic en **"Execute"**
5. Ver la respuesta abajo

### 3. Ver el CURL

Swagger genera automáticamente el comando CURL equivalente:

```bash
curl -X 'GET' \
  'http://localhost:3001/api/users' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbG...'
```

---

## 🐛 Solución de Problemas

### Swagger UI no carga

**Verificar:**
1. El servidor está corriendo: `npm run dev`
2. No hay errores en la consola del servidor
3. La URL es correcta: `http://localhost:3001/api-docs`

### Endpoints no aparecen

**Verificar:**
1. Que las rutas estén en `apis` en `config/swagger.js`:
   ```javascript
   apis: ['./routes/*.js', './swagger/*.js', './nuevas-rutas/*.js']
   ```
2. Que la sintaxis JSDoc sea correcta
3. Que no haya errores de sintaxis JavaScript

### Errores de sintaxis comunes

```javascript
// ❌ Error: Falta el slash inicial
/**
 * @swagger
 * products:        // <-- Incorrecto
 */

// ✅ Correcto
/**
 * @swagger
 * /products:       // <-- Correcto
 */

// ❌ Error: Indentación incorrecta
/**
 * @swagger
 * /products:
 *   get:
 *   summary: "..."  // <-- Debe estar indentado bajo get:
 */

// ✅ Correcto
/**
 * @swagger
 * /products:
 *   get:
 *     summary: "..."  // <-- Correctamente indentado
 */
```

---

## 📚 Recursos Adicionales

- **OpenAPI Specification:** https://swagger.io/specification/
- **Swagger UI:** https://swagger.io/tools/swagger-ui/
- **Ejemplos OpenAPI:** https://github.com/OAI/OpenAPI-Specification/tree/main/examples

---

## ✅ Checklist para Nuevos Endpoints

- [ ] Crear archivo en `swagger/` o agregar anotaciones en `routes/`
- [ ] Definir el tag apropiado
- [ ] Agregar `summary` descriptivo
- [ ] Incluir `security` si requiere autenticación
- [ ] Documentar todos los parámetros (path, query, body)
- [ ] Documentar todas las respuestas posibles (200, 400, 401, 404, 500)
- [ ] Usar `$ref` para schemas reutilizables
- [ ] Agregar ejemplos en properties
- [ ] Probar el endpoint en Swagger UI
- [ ] Verificar que aparece correctamente en `http://localhost:3001/api-docs`

---

**¿Preguntas?** Revisa los archivos existentes en `swagger/` como referencia.