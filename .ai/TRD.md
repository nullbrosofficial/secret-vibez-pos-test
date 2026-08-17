# TRD.md

# Secret Vibez POS — Technical Requirements

## Architecture
```text
React + TypeScript + Vite
        |
        | REST API
        v
Node.js + Fastify
        |
        +---- JWT + bcrypt
        |
        +---- Socket.IO
        |
        v
Prisma ORM
        |
        v
SQLite
```

## Frontend
React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zod, Recharts, Lucide React, Motion.

The existing AI Studio UI is the visual source of truth.

## Backend
Node.js 22 LTS, Fastify, TypeScript, Prisma, SQLite, Socket.IO, Zod, Pino.

## Authentication
`POST /api/v1/auth/login`

Request:
```json
{
  "email": "admin@secretvibez.com",
  "password": "Admin@123"
}
```

Backend verifies bcrypt password and returns a JWT.

Example response:
```json
{
  "accessToken": "...",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@secretvibez.com",
    "role": "owner"
  }
}
```

JWT claims should be limited to `sub`, `role`, `iat`, and `exp`. Never include passwords or sensitive information.

Default development expiry: 8 hours.

## Password Security
Use bcrypt. Never store or log plaintext passwords.

## Project Structure
```text
backend/
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── config/
│   ├── plugins/
│   ├── middleware/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── menu/
│   │   ├── tables/
│   │   ├── customers/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── kitchen/
│   │   ├── reports/
│   │   └── settings/
│   └── utils/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── data/
    └── secret-vibez.db
```

## API
All business APIs use `/api/v1`.

Examples:
- POST `/api/v1/auth/login`
- GET `/api/v1/auth/me`
- GET `/api/v1/menu`
- POST `/api/v1/menu`
- GET `/api/v1/orders`
- POST `/api/v1/orders`
- GET `/api/v1/tables`
- GET `/api/v1/reports/daily`

## Database
Prisma datasource:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Use Prisma migrations. Do not create the schema automatically at application startup.

## Relationships
```text
Role -> Users
MenuCategory -> MenuItems
RestaurantTable -> Orders
Customer -> Orders
Order -> OrderItems
Order -> Payment
MenuItem -> OrderItems
```

## Transactions
Use Prisma transactions for:
- order + order items creation
- payment + order completion
- order completion + table release

## WebSockets
Use Socket.IO for:
- order.created
- order.status_changed
- table.status_changed
- bill.requested
- payment.completed

Use rooms or namespaces for kitchen, waiter, cashier and dashboard where appropriate.

## Authorization
Use reusable Fastify authentication/authorization hooks.

Owner: all routes
Cashier: billing
Waiter: tables and order taking
Chef: kitchen

Never trust a frontend-provided role.

## Environment
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./data/secret-vibez.db"
JWT_SECRET="CHANGE_ME"
JWT_EXPIRES_IN="8h"
CORS_ORIGIN="http://localhost:5173"
```

## Development
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

## Testing
Use Vitest and Fastify API tests. Test valid/invalid login, all four roles, inactive users, expired/missing JWT, forbidden routes, billing, order lifecycle, payment, database persistence, and WebSocket events.

## Deployment
Initial target is a local/single-restaurant Node.js application using SQLite. If centralized multi-location/cloud deployment is required later, evaluate migrating Prisma to MySQL/PostgreSQL.

## Constraints
- No Docker requirement
- No Firebase
- No Firebase Authentication
- No inventory
- No recipe management
- No UI redesign
