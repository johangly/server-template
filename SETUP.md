# 🗄️ Database Setup Guide

Step-by-step guide to set up the database, run migrations, and seed initial data.

---

## 1. Create the Database

Connect to your MySQL server and create the database:

```sql
CREATE DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or using the MySQL CLI:

```bash
mysql -u root -p -e "CREATE DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## 2. Configure Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your database connection details:

```env
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=3306

JWT_SECRET=your-super-secret-jwt-key-change-this
```

> ⚠️ **Important**: Always use a strong, unique `JWT_SECRET` in production. Generate one with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

## 3. Install Dependencies

```bash
npm install
```

## 4. Run Migrations

Migrations create the database tables. Run them with:

```bash
npm run migrate
```

This executes all pending migrations in the `migrations/` folder in order:

| Migration | Creates |
|---|---|
| `create-role-table` | `role` table (roles and permissions) |
| `create-user-table` | `users` table (user accounts) |

### Revert a Migration

To undo the last migration:

```bash
npm run migration:revert
```

## 5. Seed Initial Data

Seeds populate the database with initial data. Run them in order:

### Step 1: Seed Roles

Creates the default roles (Admin, User, Guest):

```bash
npm run seed:roles
```

| Role | Description |
|---|---|
| **Admin** | Full system access |
| **User** | Standard user access |
| **Guest** | Limited read-only access |

### Step 2: Seed Users

Creates a default admin user:

```bash
npm run seed:users
```

| Email | Password | Role |
|---|---|---|
| `admin@example.com` | `admin123` | Admin |

> 🔐 **Security**: Change the default admin password immediately after first login.

## 6. Verify Setup

Start the server and test the connection:

```bash
npm run dev
```

Then test the health endpoint:

```bash
curl http://localhost:3001/health
# Should return: OK
```

Test the login endpoint:

```bash
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

## 🔄 Full Reset

If you need to start fresh:

```bash
# Drop all tables
mysql -u root -p -e "DROP DATABASE your_database_name; CREATE DATABASE your_database_name;"

# Re-run everything
npm run migrate
npm run seed:roles
npm run seed:users
```

## 🐳 Docker Setup

If using Docker, the database is created automatically:

```bash
docker compose up -d
```

The `docker-compose.yml` includes a MySQL service with auto-initialization.
