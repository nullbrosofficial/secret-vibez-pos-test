# AGENT.md

# Secret Vibez POS — AI Development Agent Instructions

## Project Identity
Secret Vibez POS is a single-restaurant POS and operations system. The existing AI Studio React frontend is the approved visual foundation.

## Critical UI Rule
DO NOT redesign the existing UI. Preserve the existing layout, colors, typography, spacing, cards, navigation, animations, icons, responsive behavior, and visual hierarchy. Only make UI changes required to connect real functionality.

## Stack
Frontend: React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zod, Lucide React, Motion, Recharts.
Backend: Node.js 22 LTS, TypeScript, Fastify, Prisma ORM, SQLite, JWT, bcrypt, Socket.IO, Zod, Pino.
Authentication: JWT + bcrypt + role-based access control. NO Firebase Authentication.

## Database
Use SQLite through Prisma.
Database file: `data/secret-vibez.db`
Use Prisma migrations. Keep the database layer isolated so migration to MySQL/PostgreSQL remains possible later.

## Roles
Owner — full access.
Cashier — Billing POS only.
Waiter — Order Taking only.
Chef — Kitchen only.

Backend authorization is mandatory.

## Development Users
Seed:
- Owner: `admin@secretvibez.com` / `Admin@123`
- Cashier: `cashier@secretvibez.com` / `Cashier@123`
- Waiter: `waiter@secretvibez.com` / `Waiter@123`
- Chef: `chef@secretvibez.com` / `Chef@123`

Hash passwords with bcrypt. Never store plaintext passwords.

## Core Modules
Authentication, Users/Roles, Menu Categories, Menu Items, Restaurant Tables, Customers, Orders, Billing, Payments, Kitchen Display, Waiter Order Taking, Dashboard, Reports, Settings, PWA.

Explicitly excluded: Inventory, Recipe Management, Firebase Authentication, WhatsApp promotional blaster.

## API
Use `/api/v1/...`.
Use typed request/response schemas, centralized errors, authentication middleware, and role authorization. Do not expose Prisma models directly.

## Real-time
Use Socket.IO for:
- order.created
- order.updated
- order.status_changed
- kitchen.order_received
- kitchen.order_ready
- table.status_changed
- bill.requested
- payment.completed

The server is the source of truth.

## Frontend
Replace mock data with real API calls. Use TanStack Query for server state. Do not duplicate business logic between frontend and backend.

## Security
- bcrypt password hashing
- JWT verification
- role authorization
- Zod validation
- CORS
- environment variables
- rate limiting on authentication endpoints
- no secrets in Git
- no passwords in logs
- no sensitive JWT claims

## Environment
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./data/secret-vibez.db"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="8h"
CORS_ORIGIN="http://localhost:5173"
```

## Workflow
Before changing code:
1. Read AGENT.md and PRD.md.
2. Inspect the existing implementation.
3. Reuse existing components.
4. Make the smallest safe change.
5. Run tests/type checks.
6. Fix errors.
7. Verify browser/API behavior.
8. Update docs when architecture changes.

Never rebuild completed modules unnecessarily.

## Definition of Done
A feature is complete only when frontend, backend, database persistence, authorization, validation, error handling, and existing UI consistency all work without runtime/type/console errors.
