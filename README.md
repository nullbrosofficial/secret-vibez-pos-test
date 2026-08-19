# Secret Vibez - Billing POS & Desk Management System

## Database Configuration

This project is configured to use **PostgreSQL** for production and testing to ensure data persistence on Render's ephemeral filesystem.

### Environment Variables

Configure the following environment variables in your `.env` file (local development) or in Render Dashboard (production):

- `DATABASE_URL`: Your PostgreSQL database connection string:
  ```env
  DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
  ```
- `NODE_ENV`: Set to `development` (locally) or `production` (on Render).
- `PORT`: Set to the port the server listens on (defaults to `3000`).
- `JWT_SECRET`: Secret key used for signing JWT authentication tokens.
- `JWT_EXPIRES_IN`: JWT expiration length (e.g. `8h`).
- `CORS_ORIGIN`: Deployed client URL or frontend port (e.g., `http://localhost:5173`).

---

## Migrations and Seeding

### 1. Database Migrations
Prisma migrations are generated offline for PostgreSQL compatibility. 
To apply migrations (non-destructively) to a database, run:
```bash
npx prisma migrate deploy --schema=backend/prisma/schema.prisma
```
> [!WARNING]
> **Production Safety**: Never run `prisma migrate dev` or `prisma migrate reset` against production, as it can reset tables and cause data loss. Always use `prisma migrate deploy`.

### 2. Database Seeding
To populate the database with initial roles, users, categories, tables, and settings, run:
```bash
npm run db:seed
```
This seed script is safe and non-destructive: it checks if the database is already seeded by counting roles, and exits early if it is already populated to avoid wiping or overwriting any existing customer or sales data.

---

## Render Deployment Settings

Use the following settings when deploying to Render:

### Web Service Settings
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build && npm run db:generate && npm run db:migrate`
- **Start Command**: `npm run start`

### Required Environment Variables
- `DATABASE_URL` (Set to your Render PostgreSQL connection string)
- `NODE_ENV=production`
- `PORT=3000`
- `JWT_SECRET` (A strong random string)
- `JWT_EXPIRES_IN=8h`
- `CORS_ORIGIN` (Your frontend build URL)
