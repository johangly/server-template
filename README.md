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
- 🎭 **Role-Based Access Control** — Admin, User, Guest roles out of the box
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
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# 3. Run migrations & seeds
npm run migrate
npm run seed:roles
npm run seed:users

# 4. Start the server
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
|---|---|
| `npm run dev` | Start with hot-reload (development) |
| `npm start` | Start in production mode |
| `npm run migrate` | Run all pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run seed:roles` | Seed default roles (Admin, User, Guest) |
| `npm run seed:users` | Seed default admin user |
| `npm test` | Run test suite |

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
