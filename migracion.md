# Plan de Migración: MySQL → PostgreSQL

**Estado:** ✅ Completado  
**Complejidad:** Baja-Media  
**Tiempo estimado:** 1-2 horas  
**Motivación:** Mejor soporte JSON, consultas complejas, más popular en producción

---

## Resumen de Cambios

Total de archivos a modificar: **10**
- 5 archivos de configuración (Alto impacto)
- 4 archivos de seeders (Medio impacto)
- 1 archivo de modelo opcional (Bajo impacto)

Archivos que **NO** necesitan cambios: migraciones, modelos (excepto opcional), rutas, middleware.

---

## 1. CONFIGURACIÓN (5 archivos)

### 1.1 config/config.js
**Ubicación:** `/server/config/config.js`

**Cambios:**
```javascript
// ANTES (líneas 10, 21)
dialect: 'mysql',
dialectOptions: {
  bigNumberStrings: true,
},

// DESPUÉS
dialect: 'postgres',
// Eliminar todo el bloque dialectOptions (no aplica a PostgreSQL)
```

**Notas:**
- Cambiar en ambas secciones: `development` y `production`
- La opción `bigNumberStrings` es específica de MySQL

---

### 1.2 database/index.js
**Ubicación:** `/server/database/index.js`

**Cambios:**
```javascript
// ANTES (línea 22)
dialect: 'mysql',

// DESPUÉS
dialect: 'postgres',
```

---

### 1.3 package.json
**Ubicación:** `/server/package.json`

**Cambios:**
```json
// ANTES (línea 25)
"mysql2": "^3.6.1"

// DESPUÉS
"pg": "^8.11.3",
"pg-hstore": "^2.3.4"
```

**Comandos post-cambio:**
```bash
cd server
npm uninstall mysql2
npm install pg pg-hstore
```

---

### 1.4 .env.example
**Ubicación:** `/server/.env.example`

**Cambios:**
```bash
# ANTES
DB_PORT=3306

# DESPUÉS
DB_PORT=5432
```

**Nota:** También actualizar el archivo `.env` local si existe.

---

### 1.5 docker-compose.yml
**Ubicación:** `/server/docker-compose.yml`

**Cambios:** Reemplazar TODO el servicio `mysql` por `postgres`:

```yaml
# ANTES (líneas 2-23)
  mysql:
    image: mysql:8.0
    container_name: mysql_db
    restart: always
    command: --default-authentication-plugin=mysql_native_password
    environment:
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - ./docker-data/mysql:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

# DESPUÉS
  postgres:
    image: postgres:15-alpine
    container_name: postgres_db
    restart: always
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - ./docker-data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      timeout: 20s
      retries: 10
```

**También cambiar en servicio `api`:**
```yaml
# ANTES
DB_HOST: mysql
depends_on:
  mysql:

# DESPUÉS
DB_HOST: postgres
depends_on:
  postgres:
```

---

## 2. SEEDERS (4 archivos - CRÍTICO)

Los seeders tienen SQL raw con sintaxis específica de MySQL.

### Diferencias clave MySQL vs PostgreSQL:

| MySQL | PostgreSQL | Uso |
|-------|------------|-----|
| `` `column` `` | `"column"` | Identificadores (nombres de columnas/tabla) |
| `"string"` | `'string'` | Literales de string |

---

### 2.1 seeders/20260102000001-seed-admin-permissions.cjs
**Ubicación:** `/server/seeders/20260102000001-seed-admin-permissions.cjs`

**Cambio (línea 7):**
```javascript
// ANTES
'SELECT id FROM role WHERE name = "Admin"'

// DESPUÉS  
'SELECT id FROM role WHERE name = \'Admin\''
```

---

### 2.2 seeders/20260103000001-seed-audit-permissions.cjs
**Ubicación:** `/server/seeders/20260103000001-seed-audit-permissions.cjs`

**Cambios (líneas 26, 30, 48):**
```javascript
// ANTES (línea 26)
'SELECT id FROM role WHERE name = "Admin"'

// DESPUÉS
'SELECT id FROM role WHERE name = \'Admin\''
```

```javascript
// ANTES (línea 30)
'SELECT id FROM permission WHERE resource IN ("audit-logs", "audit-config")'

// DESPUÉS
'SELECT id FROM permission WHERE resource IN (\'audit-logs\', \'audit-config\')'
```

```javascript
// ANTES (línea 48)
'DELETE FROM permission WHERE resource IN ("audit-logs", "audit-config")'

// DESPUÉS
'DELETE FROM permission WHERE resource IN (\'audit-logs\', \'audit-config\')'
```

---

### 2.3 seeders/20260104000000-seed-system-config.cjs
**Ubicación:** `/server/seeders/20260104000000-seed-system-config.cjs`

**Cambio (línea 33):**
```javascript
// ANTES
'SELECT \`key\` FROM system_config'

// DESPUÉS
'SELECT "key" FROM system_config'
```

**Nota:** `key` es una palabra reservada en PostgreSQL, por eso necesita comillas.

---

### 2.4 seeders/20260104000001-seed-system-config-permissions.cjs
**Ubicación:** `/server/seeders/20260104000001-seed-system-config-permissions.cjs`

**Cambios (líneas 35, 39, 74):**
```javascript
// ANTES (línea 35)
'SELECT id FROM role WHERE name = "Admin"'

// DESPUÉS
'SELECT id FROM role WHERE name = \'Admin\''
```

```javascript
// ANTES (línea 39)
'SELECT id FROM permission WHERE resource IN ("system-config")'

// DESPUÉS
'SELECT id FROM permission WHERE resource IN (\'system-config\')'
```

```javascript
// ANTES (línea 74)
'DELETE FROM permission WHERE resource IN ("system-config")'

// DESPUÉS
'DELETE FROM permission WHERE resource IN (\'system-config\')'
```

---

## 3. MODELO OPCIONAL (1 archivo)

### 3.1 models/auditLog.js (Mejora de rendimiento)
**Ubicación:** `/server/models/auditLog.js`

**Cambio opcional (líneas 35, 39):**
```javascript
// ANTES
oldValues: { type: DataTypes.JSON, allowNull: true },
newValues: { type: DataTypes.JSON, allowNull: true },

// DESPUÉS (mejor rendimiento en PostgreSQL)
oldValues: { type: DataTypes.JSONB, allowNull: true },
newValues: { type: DataTypes.JSONB, allowNull: true },
```

**Beneficio:** `JSONB` es el tipo nativo de PostgreSQL para JSON binario, más eficiente y permite indexación.

---

## 4. VERIFICACIÓN POST-MIGRACIÓN

### 4.1 Pasos para ejecutar

1. **Detener contenedores actuales:**
   ```bash
   docker-compose down
   ```

2. **Limpiar datos antiguos (opcional):**
   ```bash
   sudo rm -rf docker-data/mysql
   ```

3. **Instalar nuevas dependencias:**
   ```bash
   cd server
   npm uninstall mysql2
   npm install pg pg-hstore
   ```

4. **Actualizar variables de entorno:**
   ```bash
   # En .env
   DB_PORT=5432
   # DB_HOST sigue siendo el nombre del servicio (ahora 'postgres')
   ```

5. **Iniciar nuevo stack:**
   ```bash
   docker-compose up -d
   ```

6. **Ejecutar migraciones y seeders:**
   ```bash
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```

### 4.2 Verificación rápida

```bash
# Entrar al contenedor de PostgreSQL
docker exec -it postgres_db psql -U usuario -d basededatos

# Verificar tablas
\dt

# Verificar datos
SELECT * FROM "user" LIMIT 5;
```

---

## 5. PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: Puerto 5432 ya está en uso
**Solución:** Cambiar el mapeo de puertos en docker-compose.yml:
```yaml
ports:
  - "5433:5432"  # Usar 5433 en host, 5432 en container
```

### Problema 2: Nombre de columna `key` reservado
**Ya solucionado:** Se usa `"key"` con comillas dobles en el seeder.

### Problema 3: Case sensitivity en PostgreSQL
**Nota:** PostgreSQL convierte identificadores sin comillas a minúsculas. Los modelos de Sequelize usan `tableName` explícito, así que no hay problema.

### Problema 4: Timestamps
**Verificación:** Sequelize maneja `createdAt` y `updatedAt` igual en ambas bases de datos. No requiere cambios.

---

## 6. VENTAJAS DE POSTGRESQL

1. **JSONB nativo:** Mejor rendimiento y permite indexar campos JSON
2. **Consultas complejas:** Mejor soporte para CTEs (WITH clauses), window functions
3. **Concurrencia:** MV más maduro, mejor rendimiento bajo carga concurrente
4. **Ecosistema:** Más extensiones disponibles (PostGIS, etc.)
5. **Estándar:** Más cercano al SQL estándar

---

## 7. ARCHIVOS NO REQUERIDOS (Documentación)

Estos archivos **NO necesitan cambios** pero se listan para claridad:

- ✅ Todas las migraciones en `/migrations/`
- ✅ Todos los modelos excepto `auditLog.js` opcional
- ✅ Todas las rutas excepto queries estándar en `audit.routes.js`
- ✅ Todo el middleware
- ✅ Utilidades (`paginate.js`, `email.js`, etc.)

Las queries en `audit.routes.js` son SQL estándar y funcionan en ambas bases de datos.

---

## 8. CHECKLIST FINAL

- [ ] Modificar `config/config.js` (2 dialectos, eliminar dialectOptions)
- [ ] Modificar `database/index.js` (1 dialecto)
- [ ] Actualizar `package.json` (cambiar mysql2 por pg)
- [ ] Actualizar `.env.example` y `.env` (puerto 5432)
- [ ] Reescribir `docker-compose.yml` (servicio mysql → postgres)
- [ ] Corregir 4 archivos de seeders (comillas simples/dobles/backticks)
- [ ] Opcional: Cambiar JSON a JSONB en `auditLog.js`
- [ ] Ejecutar `npm install` para actualizar dependencias
- [ ] Probar migraciones con base de datos limpia
- [ ] Verificar que la aplicación funciona correctamente

---

## Notas para el Futuro

Si se agregan nuevas funcionalidades:
- **Evitar SQL raw** cuando sea posible, usar métodos de Sequelize
- Si se necesita SQL raw, usar comillas simples para strings: `'valor'`
- Para identificadores reservados, usar comillas dobles: `"column"`
- No usar backticks (`` ` ``) ni comillas dobles para strings

**Fecha de creación del plan:** 2025-01-08  
**Última actualización:** 2025-01-08
