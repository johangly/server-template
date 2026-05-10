# 🚀 Guía Completa de Instalación

Guía paso a paso para configurar la base de datos, ejecutar migraciones, seeders y acceder a la documentación API.

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Rápida (Recomendado)](#configuración-rápida-recomendado)
3. [Configuración Manual](#configuración-manual)
4. [Scripts Disponibles](#scripts-disponibles)
5. [Verificación de Instalación](#verificación-de-instalación)
6. [Documentación API](#documentación-api)
7. [Solución de Problemas](#solución-de-problemas)

---

## Requisitos Previos

- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x (o MySQL >= 8.0)
- **npm** >= 9.x

---

## Configuración Rápida (Recomendado)

### Opción 1: Script de Setup Automático

```bash
# Clonar o navegar al directorio
cd server

# Ejecutar setup completo (instala dependencias, crea DB, migra y seedea)
npm run setup
```

Este comando hace todo automáticamente:
1. ✅ Instala dependencias (`npm install`)
2. ✅ Crea la base de datos (`db:create`)
3. ✅ Ejecuta migraciones (`db:migrate`)
4. ✅ Ejecuta TODOS los seeders (`db:seed:all`)

### Opción 2: Docker (Aún más fácil)

```bash
# Iniciar todo con Docker Compose
docker-compose up -d

# Ejecutar seeders dentro del contenedor
docker-compose exec api npm run db:seed:all
```

---

## Configuración Manual

Si prefieres tener más control, sigue estos pasos:

### 1. Instalar Dependencias

```bash
cd server
npm install
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus credenciales
nano .env
```

**Variables obligatorias:**

```env
# Base de datos
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Opcional: Email (para recuperación de contraseña)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

> ⚠️ **Importante**: Genera un JWT_SECRET seguro:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 3. Crear Base de Datos

```bash
# Crear la base de datos
npm run db:create

# O manualmente con psql:
# createdb -U postgres your_database_name
```

### 4. Ejecutar Migraciones

```bash
# Ejecutar todas las migraciones
npm run db:migrate
```

Esto crea las siguientes tablas:

| Tabla | Descripción |
|-------|-------------|
| `role` | Roles del sistema (Admin, User, Guest) |
| `users` | Usuarios y autenticación |
| `permissions` | Permisos granulares |
| `role_permissions` | Relación roles-permisos |
| `audit_logs` | Logs de auditoría |
| `audit_configs` | Configuración de auditoría |
| `system_configs` | Configuración del sistema |
| `password_reset_tokens` | Tokens para recuperación de contraseña |

### 5. Ejecutar Seeders (IMPORTANTE)

```bash
# 🌟 EJECUTAR TODOS LOS SEEDERS DE UNA VEZ
npm run db:seed:all
```

Este comando ejecuta automáticamente en orden:

1. ✅ **Roles**: Admin, User, Guest
2. ✅ **Usuario admin**: admin@example.com / admin123
3. ✅ **Permisos base**: CRUD para users, roles, permissions
4. ✅ **Permisos admin**: Asigna todos los permisos al rol Admin
5. ✅ **Configuración auditoría**: Activa auditoría por defecto
6. ✅ **Permisos auditoría**: Permisos para ver logs de auditoría
7. ✅ **Configuración sistema**: SMTP y parámetros
8. ✅ **Permisos configuración**: Permisos para system-config

**Datos creados:**

| Rol | Descripción |
|-----|-------------|
| **Admin** | Acceso total al sistema |
| **User** | Acceso estándar |
| **Guest** | Solo lectura |

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin User | admin@example.com | admin123 | Admin |

> 🔐 **IMPORTANTE**: Cambia la contraseña por defecto inmediatamente después del primer login.

---

## Scripts Disponibles

### Desarrollo

```bash
npm run dev              # Iniciar servidor con nodemon
npm start                # Iniciar servidor en producción
```

### Base de Datos

```bash
# Crear/Eliminar
npm run db:create        # Crear base de datos
npm run db:drop          # Eliminar base de datos

# Migraciones
npm run db:migrate       # Ejecutar migraciones pendientes
npm run db:migrate:undo  # Revertir última migración

# Seeders
npm run db:seed:all      # 🌟 Ejecutar TODOS los seeders
npm run seed:roles       # Seed solo roles
npm run seed:users       # Seed solo usuario admin

# Comandos combinados
npm run db:reset         # 🔄 Reset completo (drop + create + migrate + seed)
npm run setup            # 🚀 Setup inicial (install + create + migrate + seed)
npm run setup:fresh      # 🧹 Setup desde cero (install + reset)
```

### Testing

```bash
npm test                 # Ejecutar todos los tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Tests con cobertura
npm run test:auth        # Solo tests de autenticación
npm run test:users       # Solo tests de usuarios
npm run test:roles       # Solo tests de roles
```

### Documentación

```bash
npm run docs:serve       # Muestra URL de documentación e inicia servidor
```

---

## Verificación de Instalación

### 1. Iniciar el Servidor

```bash
npm run dev
```

### 2. Verificar Health Check

```bash
curl http://localhost:3001/health
# Debe retornar: OK
```

### 3. Probar Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

Respuesta esperada:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "roleId": 1
  }
}
```

---

## 🧪 Testing

El proyecto incluye tests de integración con **Jest** y **Supertest**. Los tests usan una base de datos separada para no interferir con tu entorno de desarrollo.

### Configuración de Base de Datos para Tests

Los tests usan la base de datos `template_test` (configurada en `.env.test`). Esto aísla los tests de tu base de datos de desarrollo.

**Archivos de configuración:**
- `.env.test` - Variables de entorno para tests
- `config/config.js` - Configuración de conexión a la DB de test

### Setup Inicial de Tests

```bash
# Setup completo de la base de datos de test (solo primera vez)
npm run setup:test
```

Este comando:
1. ✅ Instala dependencias
2. ✅ Crea la base de datos `template_test`
3. ✅ Ejecuta migraciones
4. ✅ Ejecuta seeders con datos de prueba

### Scripts de Testing

```bash
# Ejecutar todos los tests
npm run test

# Ejecutar tests en modo watch (durante desarrollo)
npm run test:watch

# Tests con cobertura de código
npm run test:coverage

# Tests específicos
npm run test:auth    # Solo tests de autenticación
npm run test:users   # Solo tests de usuarios
npm run test:roles   # Solo tests de roles

# CI/CD - Setup + Tests completos
npm run test:ci
```

### Scripts de Base de Datos de Test

```bash
# Crear base de datos de test
npm run db:create:test

# Eliminar base de datos de test
npm run db:drop:test

# Ejecutar migraciones en test DB
npm run db:migrate:test

# Ejecutar seeders en test DB
npm run db:seed:all:test

# Reset completo de test DB
npm run db:reset:test
```

### Flujo de Trabajo de Testing

**Primera vez:**
```bash
npm run setup:test    # Crea DB de test con datos
npm run test          # Ejecuta tests
```

**Durante desarrollo:**
```bash
npm run test:watch    # Tests en modo watch
```

**Antes de commit:**
```bash
npm run test:ci       # Verifica que todo pase
```

**Si los datos de test se corrompen:**
```bash
npm run db:reset:test  # Resetea y recrea la DB de test
```

### Tests Incluidos

| Archivo | Descripción |
|---------|-------------|
| `tests/integration/auth.test.js` | Login, logout, bloqueo de cuenta, recuperación de contraseña |
| `tests/integration/users.test.js` | CRUD de usuarios, paginación |
| `tests/integration/roles.test.js` | Gestión de roles y permisos |
| `tests/integration/health.test.js` | Health checks del servidor |

### Solución de Problemas en Tests

**Error: "database does not exist"**
```bash
npm run db:create:test
```

**Error: "relation users does not exist"**
```bash
npm run db:migrate:test
npm run db:seed:all:test
```

**Error: "Validation Error: extensionsToTreatAsEsm"**
- ✅ Ya corregido: Eliminado del jest.config.js (se infiere automáticamente de `type: module` en package.json)

---

## Documentación API

La API incluye documentación interactiva con **Swagger UI**.

### Acceder a la Documentación

Una vez iniciado el servidor, visita:

```
http://localhost:3001/api-docs
```

### Características

- 📖 **Documentación completa**: Todos los endpoints documentados
- 🔐 **Autenticación integrada**: Botón "Authorize" para probar endpoints protegidos
- 🧪 **Pruebas en vivo**: Puedes ejecutar requests directamente desde el navegador
- 📋 **Ejemplos**: Request/response examples para cada endpoint

### Endpoints Documentados

| Módulo | Endpoints |
|--------|-----------|
| **Auth** | POST /auth/login, POST /auth/logout, POST /auth/forgot-password, POST /auth/reset-password |
| **Users** | GET/POST /users, GET/PUT/DELETE /users/:id |
| **Roles** | GET/POST /roles, GET/PUT/DELETE /roles/:id, PUT /roles/:id/permissions |
| **Permissions** | GET/POST /permissions, GET/PUT/DELETE /permissions/:id, GET /permissions/resources |
| **Audit Logs** | GET /audit-logs, GET /audit-logs/stats, GET /audit-logs/:id |
| **Audit Config** | GET/PUT /audit-config |

---

## Solución de Problemas

### Error: "database does not exist"

```bash
# Crear la base de datos manualmente
npm run db:create
```

### Error: "relation users does not exist"

Las tablas no existen. Ejecuta migraciones:
```bash
npm run db:migrate
```

### Error: "Cannot find module" al ejecutar seeders

Asegúrate de tener las dependencias instaladas:
```bash
npm install
```

### Error: "Permission denied" en seeders

El rol Admin no tiene permisos. Asegúrate de ejecutar TODOS los seeders:
```bash
npm run db:seed:all
```

### Reset Completo (Empezar desde cero)

```bash
# Eliminar todo y recrear
npm run db:reset
```

Esto ejecuta:
1. `db:drop` - Elimina la base de datos
2. `db:create` - Crea la base de datos nueva
3. `db:migrate` - Ejecuta todas las migraciones
4. `db:seed:all` - Ejecuta todos los seeders

### Problemas con permisos en Windows

Si usas Windows PowerShell y los comandos fallan:

```powershell
# Ejecutar como administrador o usar:
npx sequelize-cli db:migrate
npx sequelize-cli db:seed --seed 20251101155956-seed-roles
```

---

## 🔄 Flujo de Trabajo de Desarrollo

### Primer inicio (nuevo proyecto)

```bash
cd server
npm run setup          # Todo automático
npm run dev            # Iniciar servidor
```

### Después de pull con nuevas migraciones

```bash
npm run db:migrate     # Aplicar nuevas migraciones
npm run db:seed:all    # Ejecutar nuevos seeders si los hay
```

### Después de pull con cambios grandes

```bash
npm run db:reset       # Reset completo y empezar fresco
```

---

## 📚 Recursos Adicionales

- **Swagger UI**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health
- **API Base**: http://localhost:3001/api

### Documentación del Proyecto

| Documento | Descripción |
|-----------|-------------|
| `swagger/GUIA_SWAGGER.md` | Guía completa de Swagger/OpenAPI |
| `swagger/EJEMPLO_INVENTARIO.md` | Ejemplo práctico paso a paso |
| `README.md` | Información general del proyecto |

---

## 📝 Documentación de API con Swagger

### ¿Qué es Swagger?

**Swagger UI** es una interfaz interactiva que permite ver y probar todos los endpoints de la API directamente desde el navegador.

**URL:** `http://localhost:3001/api-docs`

### Características

- 📖 **Documentación automática** de todos los endpoints
- 🔐 **Autenticación integrada** - Prueba endpoints protegidos con JWT
- 🧪 **Testing en vivo** - Ejecuta requests sin salir del navegador
- 📋 **Ejemplos** - Ver request/response examples
- 💻 **CURL automático** - Genera comandos CURL para cada endpoint

### Cómo usar Swagger UI

1. **Iniciar el servidor:**
   ```bash
   npm run dev
   ```

2. **Abrir en navegador:**
   ```
   http://localhost:3001/api-docs
   ```

3. **Autenticarse (para endpoints protegidos):**
   - Clic en botón **"Authorize"** (arriba a la derecha)
   - Ingresar: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Clic en **"Authorize"** y cerrar

4. **Probar un endpoint:**
   - Buscar el endpoint deseado
   - Clic en **"Try it out"**
   - Completar parámetros
   - Clic en **"Execute"**
   - Ver respuesta abajo

### Agregar Documentación para Nuevos Endpoints

Para agregar nuevos endpoints a la documentación, revisa las guías detalladas:

1. **`swagger/GUIA_SWAGGER.md`** - Guía completa con todas las opciones
2. **`swagger/EJEMPLO_INVENTARIO.md`** - Ejemplo práctico paso a paso

**Resumen rápido:**

1. **Crear archivo de swagger:** `swagger/tu-modulo.swagger.js`
2. **Usar anotaciones JSDoc:**
   ```javascript
   /**
    * @swagger
    * /tu-ruta:
    *   get:
    *     summary: Descripción del endpoint
    *     tags: [TuModulo]
    *     security:
    *       - bearerAuth: []
    *     responses:
    *       200:
    *         description: Éxito
    */
   ```
3. **El archivo se carga automáticamente** (está en `config/swagger.js` -> `apis`)

---

**Última actualización:** Mayo 2026  
**Versión:** 1.1.0