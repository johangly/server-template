# 🚀 API Base Template

> A production-ready Node.js API template with authentication, user management, and role-based access control. Built with Express, Sequelize, and MySQL.

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22+-green?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.x-blue?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-15+-blue?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Sequelize-6.x-purple?style=for-the-badge" alt="Sequelize" />
</p>

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure token-based auth with expiration
- 👥 **User Management** — Full CRUD with password hashing (bcrypt)
- 🎭 **Role-Based Access Control (RBAC)** — Dynamic permissions system
- 🔒 **Account Locking** — Auto-lock after failed login attempts
- 📧 **Password Recovery** — Email-based password reset
- 📊 **Audit Logging** — Complete activity tracking
- 📖 **Swagger/OpenAPI** — Interactive API documentation
- 🛡️ **Security Stack** — Helmet, CORS, rate limiting, input validation
- 📡 **Socket.IO** — Real-time communication ready
- 📝 **Sequelize ORM** — Migrations, seeders, and model associations
- 🪵 **Winston Logger** — Structured logging for production
- 🐳 **Docker Ready** — Dockerfile and docker-compose included
- ⚡ **ES Modules** — Modern Node.js with native ESM

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js 22+** | Runtime |
| **Express.js** | HTTP framework |
| **Sequelize** | ORM for PostgreSQL |
| **PostgreSQL 15+** | Relational database |
| **Socket.IO** | Real-time websockets |
| **JWT** | Token authentication |
| **bcrypt** | Password hashing |
| **Winston** | Logging |
| **Zod** | Schema validation |
| **Helmet** | HTTP security headers |
| **Swagger UI** | API documentation |

## 📁 Project Structure

```
server/
├── config/              # Database & environment config
├── database/            # Sequelize initialization
├── middleware/          # Auth middleware (JWT, admin guard)
├── migrations/          # Database migrations
├── models/              # Sequelize models (Users, Roles)
├── routes/              # API route handlers
├── seeders/             # Initial data seeds
├── utils/               # Shared utilities
├── index.js             # Application entry point
├── package.json
└── .env.example
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 22.x
- **npm** >= 9.x
- **PostgreSQL** 15+

### Installation

```bash
# 1. Setup completo (instala dependencias, crea DB, migra y seedea)
npm run setup

# 2. Iniciar servidor
npm run dev

# 3. Abrir documentación API
# http://localhost:3001/api-docs
```

**O paso a paso manual:**

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Crear base de datos y ejecutar migraciones
npm run db:create
npm run db:migrate

# 4. Ejecutar TODOS los seeders de una vez
npm run db:seed:all

# 5. Iniciar servidor
npm run dev
```

> 📖 For detailed database setup instructions, see [SETUP.md](./SETUP.md)

## 📡 API Endpoints

All endpoints are prefixed with `API_PREFIX` (default: `/api`).

### Authentication

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/users/login` | ❌ | Login, returns JWT token |
| `POST` | `/users/logout` | ❌ | Logout user |

### Users

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/users/` | 🔑 Admin | List all users |
| `GET` | `/users/:id` | 🔑 Admin | Get user by ID |
| `POST` | `/users/create-user` | 🔑 Admin | Create new user |
| `PUT` | `/users/update-user/:id` | 🔑 Admin | Update user |

### Roles

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/roles/` | ❌ | List all roles |
| `GET` | `/roles/:id` | ❌ | Get role by ID |
| `POST` | `/roles/create-role` | ❌ | Create new role |
| `PUT` | `/roles/update-role/:id` | ❌ | Update role |

### Health

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | ❌ | Server health check |
| `GET` | `/` | ❌ | API welcome message |

## 📚 API Documentation (Swagger)

Interactive API documentation is available at:

```
http://localhost:3001/api-docs
```

### Features:
- 📖 **Complete documentation** of all endpoints
- 🔐 **Integrated authentication** — Use the "Authorize" button to test protected endpoints
- 🧪 **Live testing** — Execute requests directly from the browser
- 📋 **Examples** — Request/response examples for each endpoint

### Authenticating in Swagger UI:

1. Click the **"Authorize"** button (top right)
2. Enter your JWT token:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Click **"Authorize"** and close the dialog
4. Now you can test protected endpoints

## 🔒 Authentication

### JWT Tokens

- Tokens are generated on login (`POST /users/login`)
- Expiration configurable via `JWT_EXPIRES_IN` (default: 4h)
- Send in header: `Authorization: Bearer <token>`

### Middleware

| Middleware | Purpose |
|---|---|
| `verifyToken` | Validates JWT from Authorization header |
| `isAdmin` | Checks user has admin role |

## 📦 Available Scripts

| Script | Description |
|--- |--- |
| `npm run dev` | Start with hot-reload (development) |
| `npm start` | Start in production mode |
| **Setup** ||
| `npm run setup` | 🚀 Complete setup (install + DB + migrate + seed) |
| `npm run setup:fresh` | 🧹 Fresh setup (delete and recreate everything) |
| **Database** ||
| `npm run db:create` | Create database |
| `npm run db:drop` | Drop database |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:migrate:undo` | Revert last migration |
| `npm run db:seed:all` | 🌟 Run ALL seeders at once |
| `npm run db:reset` | 🔄 Complete reset (drop + create + migrate + seed) |
| `npm run seed:roles` | Seed only roles |
| `npm run seed:users` | Seed only admin user |
| **Testing** ||
| `npm test` | Run test suite |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with coverage |
| **Documentation** ||
| `npm run docs:serve` | Show Swagger URL and start server |

## 🐳 Docker

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## 🔧 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DB_NAME` | Database name | - |
| `DB_USER` | Database user | - |
| `DB_PASSWORD` | Database password | - |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `API_PREFIX` | API route prefix | `/api` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiration | `4h` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:5173` |

## 📄 License

MIT
