# Verification SIM Backend

API backend para el sistema de verificacion de SIM cards a traves de WhatsApp Business usando Twilio. Permite gestionar campanas de mensajes masivos, procesar respuestas automaticas, administrar promotores/grupos/concentrados y generar estadisticas de rendimiento.

## Tabla de Contenidos

- [Descripcion General](#descripcion-general)
- [Tecnologias](#tecnologias)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalacion y Configuracion](#instalacion-y-configuracion)
- [Variables de Entorno](#variables-de-entorno)
- [Base de Datos](#base-de-datos)
- [Ejecucion](#ejecucion)
- [Docker](#docker)
- [API - Endpoints](#api---endpoints)
- [Sistema de Colas (BullMQ)](#sistema-de-colas-bullmq)
- [WebSockets](#websockets)
- [Autenticacion y Seguridad](#autenticacion-y-seguridad)
- [Modelos de Datos](#modelos-de-datos)
- [Utilidades](#utilidades)
- [Estructura de Carpetas](#estructura-de-carpetas)

---

## Descripcion General

Este sistema backend gestiona el ciclo completo de verificacion de SIM cards:

1. **Carga de numeros telefonicos** desde archivos CSV o creacion manual.
2. **Envio masivo de mensajes** de verificacion via WhatsApp usando Twilio.
3. **Procesamiento automatico de respuestas** (Si, No, Solicitar Soporte, Ya lo hice, Detener mensajes).
4. **Gestion de tickets de soporte** para clientes que necesitan ayuda.
5. **Estadisticas y reportes** de rendimiento por promotor, grupo y concentrado.
6. **Gestion de personal** con jerarquia Concentrado > Grupo > Promotor.
7. **Integracion con sistema administrativo** (admin app) para consulta de saldos/wallets.

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| **Node.js 22** | Runtime de la aplicacion |
| **Express.js** | Framework HTTP |
| **Sequelize** | ORM para MySQL |
| **MySQL 8.0** | Base de datos relacional |
| **Redis 7** | Cache y broker de colas |
| **BullMQ** | Sistema de colas para procesamiento asincrono |
| **Twilio** | API de WhatsApp Business |
| **Socket.io** | Comunicacion en tiempo real |
| **JWT** | Autenticacion basada en tokens |
| **Winston** | Sistema de logging |
| **Docker** | Contenedorizacion |
| **Zod** | Validacion de esquemas |
| **Multer** | Procesamiento de archivos CSV |
| **Helmet** | Seguridad HTTP |
| **bcrypt** | Hashing de contrasenas |

---

## Arquitectura del Proyecto

El sistema sigue una arquitectura de microservicios con dos procesos principales:

```
                    +------------------+
                    |   Cliente Web    |
                    +--------+---------+
                             |
                    +--------v---------+
                    |   API (Express)  |  <-- index.js
                    |   Puerto 3001    |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v---+  +-------v------+  +---v--------+
     |   MySQL    |  |    Redis     |  |   Twilio   |
     |   (DB)     |  |   (Cache +   |  |  (WhatsApp)|
     |            |  |    Colas)    |  |            |
     +--------+---+  +-------+------+  +---+--------+
              |              |              |
              |       +------v-------+      |
              +------>|   Worker     |<-----+
                      | (BullMQ)     |
                      | webhookProc. |
                      +--------------+
```

- **API Server** (`index.js`): Maneja las peticiones HTTP, rutas REST y conexiones WebSocket.
- **Worker** (`workers/webhookProcessor.js`): Proceso independiente que procesa webhooks de Twilio y envio de campanas de manera asincrona.

---

## Requisitos Previos

- **Node.js** >= 22.x
- **npm** >= 9.x
- **MySQL** 8.0
- **Redis** 7.x
- Cuenta de **Twilio** con WhatsApp Business configurado

O alternativamente:

- **Docker** y **Docker Compose**

---

## Instalacion y Configuracion

### Instalacion local

```bash
# 1. Clonar el repositorio
git clone https://github.com/johangly/verification_sim_backend.git
cd verification_sim_backend

# 2. Cambiar a la rama principal
git checkout produccion

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores (ver seccion Variables de Entorno)

# 5. Ejecutar migraciones
npx sequelize-cli db:migrate

# 6. Ejecutar seeds basicos (roles y usuarios)
npm run seed:create-roles
npm run seed:create-users
```

### Seeds de datos de prueba (opcional)

Los seeds deben ejecutarse en el siguiente orden:

```bash
# 1. Crear concentrados, grupos y promotores
npm run seed:create-sellers

# 2. Crear campanas y mensajes de prueba
npm run seed:create-messages

# 3. Crear tickets de soporte de prueba
npm run seed:create-test-support-ticket
```

### Revertir migraciones

```bash
# Revertir la ultima migracion
npm run migration:revert
```

### Reset completo de datos

> **PELIGRO**: Este comando borra campaigns, phoneNumbers, messages, usuarios, concentrados, grupos, promotores y support_tickets.

```bash
npm run seed:reset
```

---

## Variables de Entorno

Crear un archivo `.env` en la raiz del proyecto con las siguientes variables:

```env
# Base de datos
DB_NAME=verification_sim
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=3306
DB_ADMIN_PASSWORD=tu_password_admin

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Servidor
PORT=3001
NODE_ENV=development
API_PREFIX=/verificationsim

# Twilio
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+521XXXXXXXXXX

# JWT
JWT_SECRET=tu_jwt_secret
JWT_EXPIRES_IN=4h

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Admin App (sistema administrativo externo)
ADMIN_APP_URL=https://tu-admin-app.com
ADMIN_APP_API_TOKEN=tu_api_token
ADMIN_APP_INSTANCE_NAME=tu_instancia

# Bull Board (panel de colas)
ADMIN_USER=admin
ADMIN_PASSWORD=tu_password_admin

# Validacion de telefono
NUMBER_PREFIX=52

# Worker
WORKER_HEALTHCHECK_PORT=3003

# Link de vinculacion
MOVISTAR_LINK_VINCULAR=https://tu-link.com
```

---

## Base de Datos

### Diagrama de Relaciones (ER)

```
+------------+       +-----------+       +-------------+
| Concentrated|<------| Groups    |<------| Promoter    |
| (concentrated)| 1:N | (group)   | 1:N  | (promoter)  |
+------------+       +-----------+       +------+------+
                                                |
                                                | 1:N
                                                |
+----------+       +-----------+       +--------v-------+
|   Role   |<------|  Users    |------>| PhoneNumbers   |
| (role)   | 1:N   | (users)   | 1:N  | (telefonos)    |
+----------+       +-----+-----+       +--------+-------+
                         |                       |
                         |                       | 1:N
                         |              +--------v-------+
                         |              |   Messages     |
                         |              | (Messages)     |
                         |              +--------+-------+
                         |                       |
                         |              +--------v---------+
                         +------------->| SupportTicket    |
                           1:N          | (support_tickets)|
                                        +------------------+
```

### Migraciones

Las migraciones se encuentran en la carpeta `migrations/` y se ejecutan con Sequelize CLI:

| Migracion | Descripcion |
|---|---|
| `create-phone-numbers` | Tabla `telefonos` para numeros de telefono |
| `create-message` | Tabla `Messages` para mensajes enviados/recibidos |
| `add-twilio-sid-to-messages` | Campo `twilioSid` en Messages |
| `create-campaign` | Tabla `Campaigns` para campanas |
| `add-campaign-id-to-messages` | Relacion Messages -> Campaigns |
| `add_hasReceivedVerificationMessage` | Flag de verificacion en telefonos |
| `create-role-table` | Tabla `role` para roles de usuario |
| `create-user-table` | Tabla `users` para usuarios del sistema |
| `create-concentrated-table` | Tabla `concentrated` |
| `create-group-table` | Tabla `group` |
| `create-promoter-table` | Tabla `promoter` |
| `change-table-telefonos` | Agregar `sellerId` y `createdById` a telefonos |
| `create-support-ticket` | Tabla `support_tickets` |
| `add-type-to-messages` | Campo `type` en Messages |

---

## Ejecucion

### Desarrollo

```bash
# Iniciar el servidor API con hot-reload
npm run dev

# Iniciar el worker con hot-reload (en otra terminal)
npm run dev:worker
```

### Produccion

```bash
# Iniciar el servidor API
npm start

# Iniciar el worker (en otro proceso)
npm run start:worker
```

> **Nota**: En produccion se deben ejecutar ambos procesos simultaneamente (API + Worker). Se puede usar PM2, Docker o similar para gestionarlos.

---

## Docker

El proyecto incluye soporte completo de Docker con `docker-compose.yml`.

### Servicios

| Servicio | Imagen | Puerto | Descripcion |
|---|---|---|---|
| `mysql` | mysql:8.0 | 3306 | Base de datos |
| `redis` | redis:7-alpine | 6379 | Cache y colas |
| `api` | Dockerfile.api | 3002 | Servidor Express |
| `worker` | Dockerfile | - | Procesador de colas |

### Ejecucion con Docker

```bash
# Construir e iniciar todos los servicios
docker compose up -d

# Ver logs
docker compose logs -f

# Detener servicios
docker compose down
```

Los datos de MySQL se persisten en `./docker-data/mysql/`. Los scripts de inicializacion de la base de datos se encuentran en `./init-db/`.

---

## API - Endpoints

Todos los endpoints estan bajo el prefijo configurable `API_PREFIX` (por defecto `/verificationsim`).

### Autenticacion

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `POST` | `/users/login` | No | Iniciar sesion, devuelve JWT |
| `POST` | `/users/logout` | No | Cerrar sesion |

### Usuarios

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `GET` | `/users/` | Admin | Listar todos los usuarios |
| `GET` | `/users/:id` | Admin | Obtener un usuario por ID |
| `POST` | `/users/create-user` | Admin | Crear un nuevo usuario |
| `PUT` | `/users/update-user/:id` | Admin | Actualizar un usuario |

### Numeros de Telefono

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `GET` | `/phonenumbers/` | Token | Listar numeros con filtros y paginacion |
| `GET` | `/phonenumbers/getPaginationInfo` | Token | Obtener info de paginacion |
| `GET` | `/phonenumbers/:id` | Token | Obtener un numero por ID |
| `POST` | `/phonenumbers/` | Token | Crear un numero manualmente |
| `POST` | `/phonenumbers/file` | Token | Carga masiva desde CSV |
| `PUT` | `/phonenumbers/:id` | Token | Actualizar un numero |
| `DELETE` | `/phonenumbers/:id` | Token | Eliminar un numero |

#### Parametros de consulta para `GET /phonenumbers/`

| Parametro | Tipo | Descripcion |
|---|---|---|
| `page` | number | Pagina actual (default: 1) |
| `limit` | number | Items por pagina (default: 10) |
| `phoneNumber` | string | Filtro por numero de telefono (parcial) |
| `status` | string | Filtro por estado: `verificado`, `no verificado`, `por verificar`, `all` |
| `sellerId` | number | Filtro por ID del promotor |
| `promoterName` | string | Filtro por nombre del promotor (parcial) |
| `sortOrder` | string | Orden: `ASC` o `DESC` (default: DESC) |

### Campanas

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `GET` | `/campaigns/export-by-date` | Token | Exportar campana como CSV por rango de fechas |
| `POST` | `/campaigns/file` | Token | Procesar archivo CSV de numeros para campana |
| `POST` | `/campaigns/create-full-campaign` | Token | Crear y ejecutar campana completa |
| `GET` | `/campaigns/:id` | Token | Obtener campana por ID con mensajes |
| `GET` | `/campaigns/` | Token | Listar campanas paginadas |

### Mensajes / Webhooks de Twilio

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `POST` | `/messages/response` | Twilio | Webhook para respuestas de usuarios |
| `POST` | `/messages/status-update` | Twilio | Webhook para actualizaciones de estado |
| `POST` | `/messages/fallback` | Twilio | Webhook de fallback para errores |

> **Nota**: Estos endpoints son llamados directamente por Twilio y validan la firma del webhook con `twilio.webhook({ validate: true })`.

### Estadisticas

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `GET` | `/estadisticas/` | No | Estadisticas generales (ultimos 30 dias, con cache Redis) |
| `GET` | `/estadisticas/byFilters` | No | Estadisticas filtradas por campana/promotor/grupo/concentrado |
| `GET` | `/estadisticas/byDateRange` | No | Mensajes por rango de fechas |
| `GET` | `/estadisticas/messageCounts` | No | Conteo de mensajes entrantes y respuestas |
| `GET` | `/estadisticas/best` | No | Mejor promotor, grupo y concentrado |
| `GET` | `/estadisticas/phonesbydaysrange/:days` | No | Telefonos por rango de dias |
| `GET` | `/estadisticas/stats` | No | Estadisticas detalladas por promotor |
| `GET` | `/estadisticas/stats/groups` | No | Estadisticas detalladas por grupo |
| `GET` | `/estadisticas/stats/concentrated` | No | Estadisticas detalladas por concentrado |

### Concentrados

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `GET` | `/concentrated/` | Token | Listar todos los concentrados |
| `GET` | `/concentrated/:id` | Token | Obtener concentrado por ID |
| `POST` | `/concentrated/create-concentrated` | Token | Crear concentrado |
| `PUT` | `/concentrated/update-concentrated/:id` | Token | Actualizar concentrado |

### Grupos

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `GET` | `/groups/` | Token | Listar todos los grupos (incluye concentrado) |
| `GET` | `/groups/:id` | Token | Obtener grupo por ID |
| `POST` | `/groups/create-group` | Token | Crear grupo |
| `PUT` | `/groups/update-group/:id` | Token | Actualizar grupo |

### Promotores

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `GET` | `/promoters/` | Token | Listar promotores (incluye grupo) |
| `GET` | `/promoters/:id` | Token | Obtener promotor por ID |
| `POST` | `/promoters/create-promoter` | Token | Crear promotor |
| `PUT` | `/promoters/update-promoter/:id` | Token | Actualizar promotor |

### Roles

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `GET` | `/roles/` | No | Listar todos los roles |
| `GET` | `/roles/:id` | No | Obtener rol por ID |
| `POST` | `/roles/create-role` | No | Crear rol |
| `PUT` | `/roles/update-role/:id` | No | Actualizar rol |

### Tickets de Soporte

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `GET` | `/support/` | No | Listar tickets con paginacion y filtros |
| `GET` | `/support/:id` | No | Obtener ticket por ID (incluye cliente, empleado, mensaje) |
| `POST` | `/support/create-ticket` | No | Crear ticket de soporte |
| `PUT` | `/support/update-ticket/:id` | No | Actualizar ticket (resumen obligatorio al cerrar) |
| `DELETE` | `/support/delete-ticket/:id` | No | Eliminar ticket |

### Carga Masiva de Entidades

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `POST` | `/upload/process-entities` | Token | Crear concentrados, grupos y promotores desde CSV |
| `POST` | `/upload/associate-promoters` | Token | Asociar promotores a numeros desde CSV |

#### Formato CSV para `process-entities`

```csv
CONCENTRADO,GRUPO,PROMOTOR
Nombre Concentrado,Nombre Grupo,Nombre Promotor
```

Si la entidad ya existe (por nombre o codigo), se reutiliza. Si no existe, se crea automaticamente con un codigo unico.

#### Formato CSV para `associate-promoters`

```csv
DN,PROMOTOR
+5215512345678,PROM1234
```

Busca el numero en la base de datos y le asigna el promotor indicado (por codigo o nombre).

### Relaciones

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `GET` | `/relations/personal` | No | Arbol completo: Concentrado > Grupos > Promotores |

### Wallets

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `GET` | `/wallets/` | Token | Consultar saldos desde la admin app externa |

Devuelve tres saldos:
- `currentBalance`: Saldo actual (USD)
- `incomingMessagesBalance`: Saldo de mensajes entrantes (USD)
- `responseMessagesBalance`: Saldo de respuestas (USD)

### Pruebas

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `POST` | `/test/simulate-campaign` | No | Simular envio de campana (sin Twilio real) |

### Health Check

| Metodo | Ruta | Auth | Descripcion |
|---|---|---|---|
| `GET` | `/health` | No | Verificar que el servidor esta corriendo |
| `GET` | `/` | Rate Limited | Mensaje de bienvenida de la API |

---

## Sistema de Colas (BullMQ)

El sistema utiliza dos colas de BullMQ respaldadas por Redis:

### Cola `twilio-webhooks`

Procesa eventos de Twilio de manera asincrona:

- **`message-response`**: Respuestas de usuarios a mensajes de WhatsApp.
- **`status-update`**: Actualizaciones de estado de mensajes (queued, sent, delivered, read, failed, undelivered).
- **`fallback`**: Errores reportados por Twilio.

Configuracion:
- Concurrencia: 10
- Reintentos: 3 con backoff exponencial (1s, 2s, 4s)
- Limpieza automatica: ultimos 1000 completados, ultimos 5000 fallidos

#### Procesamiento de respuestas

Cuando un usuario responde al mensaje de WhatsApp, el worker analiza la respuesta y toma accion:

| Respuesta del usuario | Accion del sistema |
|---|---|
| "Si" / "si" | Envia link de vinculacion, marca como `verificado` |
| "No" / "no" | Envia enlace de soporte, marca como `no verificado` |
| "Ya lo hice" | Envia respuesta de tarjeta de lealtad |
| "Solicitar Soporte" / "Tengo dudas" | Crea ticket de soporte automaticamente |
| "Detener mensajes" | Confirma detencion de mensajes |
| Texto de promocion detectado | Envia respuesta automatica |

#### Procesamiento de actualizaciones de estado

| Estado de Twilio | Accion |
|---|---|
| `delivered` / `read` | Actualiza `messageStatus` del mensaje |
| `undelivered` | Marca telefono como `no verificado` |
| `failed` | Registra el error |

### Cola `campaign-send`

Envio controlado de mensajes de campana con "drip feeding":

- **Lotes de 100 mensajes** por ciclo
- **Intervalo de 5 minutos** entre lotes
- **2 segundos de delay** entre mensajes individuales dentro de un lote
- **Concurrencia: 1** (envio secuencial controlado)
- Reintentos: 1 (sin reintentos automaticos)

El progreso del envio se reporta en tiempo real via WebSocket a la sala del usuario que inicio la campana.

### Panel de administracion (Bull Board)

Accesible en `{API_PREFIX}/admin/queues` con autenticacion basica:
- Usuario: `ADMIN_USER` (variable de entorno)
- Contrasena: `ADMIN_PASSWORD` (variable de entorno)

Permite monitorear jobs en espera, completados, fallidos y reintentarlos manualmente.

---

## WebSockets

El sistema utiliza Socket.io para comunicacion en tiempo real durante el envio de campanas.

### Configuracion

- Path: `{API_PREFIX}/sockets`
- Autenticacion: JWT via `socket.handshake.auth.token`
- Cada usuario autenticado se une a su sala privada `user_{userId}`

### Eventos

| Evento | Direccion | Descripcion |
|---|---|---|
| `connection` | Client -> Server | Cliente autenticado se conecta |
| `disconnect` | Client -> Server | Cliente se desconecta |
| `unir_sala` | Client -> Server | Unir al usuario a su sala privada |
| `verificar_estado` | Client -> Server | Consultar estado de un procesamiento |

### Flujo de envio via WebSocket

1. El cliente se conecta y se autentica con JWT.
2. El cliente se une a su sala privada (`user_{userId}`).
3. Al iniciar una campana via el endpoint de sockets (`POST /sockets`), el servidor:
   - Crea la campana en la base de datos.
   - Encola los mensajes en lotes de 100 en la cola `campaign-send`.
   - Cada lote se programa con un delay de 5 minutos respecto al anterior.
4. El worker procesa los mensajes y emite actualizaciones de progreso al socket del usuario.

---

## Autenticacion y Seguridad

### JWT (JSON Web Tokens)

- Los tokens se generan al hacer login (`POST /users/login`).
- Expiracion configurable via `JWT_EXPIRES_IN` (default: 4 horas).
- El payload del token incluye: `id`, `name`, `email`, `code`, `roleId`, `isActive`, `role { name, id }`.
- Se envia en el header: `Authorization: Bearer <token>`.

### Middleware de autenticacion

- **`verifyToken`**: Valida el JWT del header Authorization. Rechaza con 401 si es invalido o expirado.
- **`isAdmin`**: Verifica que el usuario tenga rol de administrador. Rechaza con 403 si no tiene permisos.

### Rate Limiting

- **API general** (ruta raiz `/`): 5 peticiones por minuto por IP.
- **Login** (`POST /users/login`): 5 intentos cada 15 minutos por IP.

### Seguridad HTTP

- **Helmet**: Headers de seguridad HTTP automaticos.
- **CORS**: Origenes configurables via `CORS_ORIGINS` (separados por coma).
- **Twilio webhook validation**: Los endpoints de webhook validan la firma de Twilio con `twilio.webhook({ validate: true })`.

### Hashing de contrasenas

- **bcrypt** con salt de 10 rondas para almacenamiento seguro de contrasenas.

---

## Modelos de Datos

### PhoneNumbers (tabla: `telefonos`)

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | INTEGER (PK, Auto) | Identificador unico |
| `phoneNumber` | STRING (unique) | Numero con formato `+52XXXXXXXXXX` |
| `icc` | STRING | Codigo ICC de la SIM (opcional) |
| `status` | ENUM | `por verificar`, `verificado`, `no verificado` |
| `hasReceivedVerificationMessage` | BOOLEAN | Si ya recibio mensaje de verificacion |
| `sellerId` | INTEGER (FK -> promoter) | Promotor asignado |
| `createdById` | INTEGER (FK -> users) | Usuario que lo creo |

**Relaciones**: hasMany Messages, belongsTo Promoter (as `seller`), belongsTo Users (as `createdBy`), hasMany SupportTicket

### Messages (tabla: `Messages`)

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | INTEGER (PK, Auto) | Identificador unico |
| `phoneNumberId` | INTEGER (FK -> telefonos) | Telefono asociado |
| `sentAt` | DATE | Fecha de envio |
| `templateUsed` | STRING | ID de plantilla de Twilio usada |
| `responseReceived` | STRING | Texto de la respuesta del usuario |
| `respondedAt` | DATE | Fecha de respuesta |
| `messageStatus` | STRING | queued, sent, delivered, read, failed, undelivered |
| `twilioSid` | STRING | SID del mensaje en Twilio |
| `type` | STRING | `initial`, `response`, `free_text_response`, `inbound` |
| `campaignId` | INTEGER (FK -> Campaigns) | Campana asociada |
| `success` | BOOLEAN | Si el envio fue exitoso |

**Relaciones**: belongsTo PhoneNumbers (as `phoneNumber`), belongsTo Campaigns (as `campaign`)

### Campaigns (tabla: `Campaigns`)

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | INTEGER (PK, Auto) | Identificador unico |
| `sentAt` | DATE | Fecha de envio |
| `templateUsed` | STRING | Plantilla utilizada |
| `createdByUser` | INTEGER | Usuario que creo la campana |

**Relaciones**: hasMany Messages

### Users (tabla: `users`)

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | INTEGER (PK, Auto) | Identificador unico |
| `code` | STRING (unique) | Codigo unico (USR + 4 digitos) |
| `name` | STRING | Nombre del usuario |
| `email` | STRING (unique) | Correo electronico |
| `password` | STRING | Contrasena hasheada (bcrypt) |
| `role` | INTEGER (FK -> role) | Rol asignado |
| `isActive` | BOOLEAN | Estado activo/inactivo |
| `lastLogin` | DATE | Ultimo inicio de sesion |

**Relaciones**: belongsTo Role (as `userRole`), hasMany PhoneNumbers

### Role (tabla: `role`)

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | INTEGER (PK, Auto) | Identificador unico |
| `name` | STRING (unique) | Nombre del rol (admin, user) |
| `description` | STRING | Descripcion del rol |

**Relaciones**: hasMany Users

### Concentrated (tabla: `concentrated`)

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | INTEGER (PK, Auto) | Identificador unico |
| `code` | STRING (unique) | Codigo unico (CONC + 4 digitos) |
| `name` | STRING (unique) | Nombre del concentrado |
| `description` | STRING | Descripcion |
| `isActive` | BOOLEAN | Estado activo/inactivo |

**Relaciones**: hasMany Groups (as `grupos`)

### Groups (tabla: `group`)

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | INTEGER (PK, Auto) | Identificador unico |
| `code` | STRING (unique) | Codigo unico (GRP + 4 digitos) |
| `name` | STRING (unique) | Nombre del grupo |
| `description` | STRING | Descripcion |
| `isActive` | BOOLEAN | Estado activo/inactivo |
| `concentratedId` | INTEGER (FK -> concentrated) | Concentrado al que pertenece |

**Relaciones**: belongsTo Concentrated (as `concentrado`), hasMany Promoter (as `promotores`)

### Promoter (tabla: `promoter`)

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | INTEGER (PK, Auto) | Identificador unico |
| `code` | STRING (unique) | Codigo unico (PROM + 4 digitos) |
| `name` | STRING | Nombre del promotor |
| `email` | STRING (unique) | Correo electronico |
| `isActive` | BOOLEAN | Estado activo/inactivo |
| `groupId` | INTEGER (FK -> group) | Grupo al que pertenece |

**Relaciones**: belongsTo Groups (as `grupo`), hasMany PhoneNumbers

> **Nota**: Este modelo usa `paranoid: true` (soft delete - los registros eliminados se marcan con `deletedAt` en lugar de borrarse).

### SupportTicket (tabla: `support_tickets`)

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | INTEGER (PK, Auto) | Identificador unico |
| `messageId` | INTEGER (FK -> Messages) | Mensaje que genero el ticket |
| `status` | ENUM | `abierto`, `en_llamada`, `no_contesta`, `cerrado` |
| `customerPhoneNumber` | INTEGER (FK -> telefonos) | Numero del cliente |
| `phone_status_when_create_ticket` | STRING | Estado de verificacion al crear el ticket |
| `call_attempts` | INTEGER | Numero de intentos de llamada (default: 0) |
| `call_summary` | TEXT | Resumen de la llamada (obligatorio al cerrar) |
| `attendedBy` | INTEGER (FK -> users) | Usuario que atendio el ticket |

**Relaciones**: belongsTo PhoneNumbers (as `customer`), belongsTo Users (as `attendedByEmployee`), belongsTo Messages (as `message`)

---

## Utilidades

### `utils/twilio.js`

Funciones para enviar mensajes via Twilio:

- **`sendMessage(from, contentSid, contentVariables, to)`**: Envia un mensaje usando una plantilla de contenido de Twilio.
- **`sendFreeTextMessages(from, to, body)`**: Envia un mensaje de texto libre (sin plantilla).

### `utils/sendMessages.js`

- **`sendMessages({ fromPhoneNumber, contentSid, contentVariables, toPhoneNumber, client })`**: Wrapper para enviar mensajes con plantilla de Twilio, configurando el idioma como espanol (`es`).

### `utils/phoneValidator.js`

- **`validatePhoneNumber(phone)`**: Valida formato general de numero de telefono internacional.
- **`normalizeMexicanPhoneNumber(phone)`**: Normaliza numeros mexicanos al formato `+52XXXXXXXXXX`. Acepta numeros de 10 digitos (locales), con prefijo `+52` o `+521`.

### `utils/getSearchablePhoneNumbers.js`

Genera variantes de un numero para busqueda en la base de datos. Maneja la excepcion del `1` adicional en numeros mexicanos de Twilio (`+52` vs `+521`). Retorna un array con 1 o 2 variantes para buscar.

### `utils/estadistics.functions.js`

Funciones de estadisticas con cache en Redis (TTL de 6 horas):

| Funcion | Descripcion |
|---|---|
| `getPhonesCountByDateRangeUTC` | Conteo total de telefonos por rango de fechas |
| `getPhonesStatsByUpdateDateRangeUTC` | Estadisticas agrupadas por estado (con cache Redis) |
| `getPhonesByRangeOfDays` | Lista de telefonos creados en un rango de dias |
| `getPhonesStatsByPromoterConcentratedGroup` | Estadisticas filtradas por jerarquia organizacional |
| `getMessageCountsByCampaignOrDateRange` | Conteo de mensajes entrantes y respuestas |

### `utils/messageTemplates.js`

Plantillas de mensajes de WhatsApp usadas en el sistema:

| Plantilla | Tipo | Uso |
|---|---|---|
| `verificationTemplate` | Template ID | Mensaje inicial de verificacion (Si/No) |
| `requestSupportMessageResponse` | Template ID | Confirmacion de solicitud de soporte |
| `responseToNegativeAnswer` | Texto libre | Respuesta cuando el usuario dice "No" |
| `responseToPositiveAnswer` | Texto libre | Respuesta cuando dice "Si" (incluye link de vinculacion) |
| `finallResponse` | Texto libre | Respuesta cuando dice "Ya lo hice" |
| `stopMessages` | Texto libre | Confirmacion de detencion de mensajes |
| `automaticResponse` | Texto libre | Respuesta automatica a mensajes de promocion |

### `utils/logger.js`

Logger con Winston configurado para:
- Salida a archivo `combined.log` (max 5MB, 5 archivos rotativos)
- Salida a consola (nivel debug)
- Manejo global de `unhandledRejection`

### `utils/hashedAndComparePassword.js`

- `hashPassword(password)`: Genera hash bcrypt con salt de 10 rondas.
- `comparePassword(password, hash)`: Compara contrasena en texto plano con hash.
- `isBcryptHash(password)`: Verifica si un string es un hash bcrypt valido (empieza con `$2` y tiene 60 caracteres).

### `utils/generatenumber.function.js`

- `getRandomIntInclusive(min, max)`: Genera un numero aleatorio entre min y max (inclusive). Usado para generar codigos unicos de entidades (USR, CONC, GRP, PROM).

---

## Estructura de Carpetas

```
verification_sim_backend/
|-- config/
|   |-- config.js              # Configuracion de Sequelize (conexion DB)
|   |-- redis.js               # Conexion y configuracion de Redis (ioredis)
|-- database/
|   |-- index.js               # Inicializacion de Sequelize, carga de modelos y relaciones
|-- docs/
|   |-- phoneNumbers-api.md    # Documentacion adicional de la API de telefonos
|-- init-db/                   # Scripts SQL de inicializacion para Docker
|-- middleware/
|   |-- authMiddleware.js      # Middlewares JWT: verifyToken, isAdmin
|-- migrations/                # 14 migraciones de Sequelize (creacion de tablas)
|-- models/
|   |-- PhoneNumbers.js        # Modelo de numeros de telefono
|   |-- campaign.js            # Modelo de campanas
|   |-- concentrated.js        # Modelo de concentrados
|   |-- groups.js              # Modelo de grupos
|   |-- messages.js            # Modelo de mensajes
|   |-- roles.js               # Modelo de roles
|   |-- seller.js              # Modelo de promotores (Promoter)
|   |-- supportTicket.js       # Modelo de tickets de soporte
|   |-- users.js               # Modelo de usuarios
|-- queues/
|   |-- campaignQueue.js       # Cola BullMQ para envio de campanas
|   |-- webhookQueue.js        # Cola BullMQ para webhooks de Twilio
|-- routes/
|   |-- campaigns.routes.js    # CRUD de campanas + envio + exportacion CSV
|   |-- concentrated.routes.js # CRUD de concentrados
|   |-- estadisticas.routes.js # Endpoints de estadisticas y rankings
|   |-- group.routes.js        # CRUD de grupos
|   |-- messages.routes.js     # Webhooks de Twilio (response, status, fallback)
|   |-- phoneNumbers.routes.js # CRUD de numeros + carga CSV
|   |-- promoter.routes.js     # CRUD de promotores
|   |-- relations.routes.js    # Arbol jerarquico completo
|   |-- role.routes.js         # CRUD de roles
|   |-- support.routes.js      # CRUD de tickets de soporte
|   |-- test.routes.js         # Endpoint de simulacion (sin Twilio)
|   |-- upload.routes.js       # Carga masiva de entidades y asociacion
|   |-- users.routes.js        # CRUD de usuarios + login/logout
|   |-- wallets.routes.js      # Consulta de saldos desde admin app
|-- seeders/                   # 8 seeds de datos iniciales y de prueba
|-- utils/
|   |-- estadistics.functions.js     # Funciones de calculo de estadisticas
|   |-- generatenumber.function.js   # Generador de codigos aleatorios
|   |-- getSearchablePhoneNumbers.js # Normalizacion +52/+521 para busqueda
|   |-- hashedAndComparePassword.js  # Hashing bcrypt de contrasenas
|   |-- logger.js                    # Configuracion de Winston logger
|   |-- messageTemplates.js          # Plantillas de mensajes WhatsApp
|   |-- phoneValidator.js            # Validacion y normalizacion de numeros MX
|   |-- sendMessages.js              # Wrapper de envio de mensajes Twilio
|   |-- supportTicketFunctions.js    # Funciones de tickets (reservado)
|   |-- twilio.js                    # Cliente Twilio y funciones de envio
|-- workers/
|   |-- webhookProcessor.js    # Worker BullMQ: procesa webhooks y campanas
|-- .sequelizerc               # Rutas de configuracion para Sequelize CLI
|-- docker-compose.yml         # Orquestacion de servicios Docker
|-- Dockerfile                 # Imagen Docker del Worker
|-- Dockerfile.api             # Imagen Docker de la API
|-- index.js                   # Punto de entrada principal de la API
|-- package.json               # Dependencias y scripts npm
|-- redis.MD                   # Guia de implementacion Redis + BullMQ
```

---

## Scripts de npm

| Script | Comando | Descripcion |
|---|---|---|
| `start` | `node index.js` | Iniciar servidor API en produccion |
| `dev` | `nodemon index.js` | Servidor API con hot-reload para desarrollo |
| `start:worker` | `node workers/webhookProcessor.js` | Iniciar worker de colas |
| `dev:worker` | `nodemon workers/webhookProcessor.js` | Worker con hot-reload |
| `test` | `jest` | Ejecutar tests |
| `build` | `echo "skip build"` | Build (no aplica, proyecto JS puro) |
| `migrate` | `npx sequelize-cli db:migrate` | Ejecutar todas las migraciones pendientes |
| `migration:revert` | `npx sequelize-cli db:migrate:undo` | Revertir ultima migracion |
| `seed:create-roles` | Sequelize seed | Crear roles basicos (admin, user) |
| `seed:create-users` | Sequelize seed | Crear usuarios iniciales |
| `seed:create-sellers` | Sequelize seed | Crear concentrados, grupos y promotores de prueba |
| `seed:create-messages` | Sequelize seed | Crear campanas y mensajes de prueba |
| `seed:create-test-support-ticket` | Sequelize seed | Crear tickets de soporte de prueba |
| `seed:reset` | Sequelize seed | **PELIGRO** - Borrar todos los datos |
| `seed:reset-campaigns` | Sequelize seed | Borrar solo datos de campanas |
| `seed:delete-icc` | Sequelize seed | Borrar datos ICC |

---

## Flujo de Verificacion

El flujo principal del sistema es el siguiente:

```
1. Carga de numeros (CSV o manual)
       |
2. Creacion de campana
       |
3. Envio de mensajes WhatsApp (via BullMQ con drip feeding)
   - Lotes de 100 mensajes cada 5 minutos
   - 2 segundos entre cada mensaje
       |
4. Twilio envia webhooks al backend:
   |
   |-- status-update --> Worker actualiza estado del mensaje
   |                     delivered/read: actualiza messageStatus
   |                     undelivered: telefono = "no verificado"
   |
   |-- message-response --> Worker procesa la respuesta:
       |-- "Si"                    --> Envia link de vinculacion, telefono = "verificado"
       |-- "No"                    --> Envia enlace de soporte, telefono = "no verificado"
       |-- "Ya lo hice"            --> Envia respuesta de tarjeta de lealtad
       |-- "Solicitar Soporte"     --> Crea ticket de soporte automaticamente
       |-- "Tengo dudas"           --> Crea ticket de soporte automaticamente
       |-- "Detener mensajes"      --> Confirma detencion de mensajes
       |-- Texto de promocion      --> Envia respuesta automatica
```

---

## Configuracion de Twilio

Para que el sistema funcione correctamente, se deben configurar los siguientes webhooks en el panel de Twilio:

| Evento | URL del Webhook |
|---|---|
| When a message comes in | `https://tu-dominio.com/verificationsim/messages/response` |
| Status callback URL | `https://tu-dominio.com/verificationsim/messages/status-update` |
| Fallback URL | `https://tu-dominio.com/verificationsim/messages/fallback` |

Estos webhooks deben apuntar al servidor donde corre la API, y la validacion de firma de Twilio debe estar activa (`TWILIO_AUTH_TOKEN` configurado).
