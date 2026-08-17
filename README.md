# Secret Vibez - Point of Sale (POS) & Desk Management System

## Product Overview
Secret Vibez POS is a full-stack, modern Point of Sale (POS) and Operations Management system designed for dining establishments. It features secure JWT authentication, role-based page routing, interactive desk table tracking, waiter order-taking, live kitchen display ticket flows, CRM customer database, sales analytics, and configurable GST calculations.

---

## 🚀 Core Features

### 🧾 1. Live Billing POS Terminal (`BillingView.tsx`)
- **Checkout & Settlement**: Automatically load dine-in orders from active tables or process direct takeaway walk-ins.
- **Backend Calculated Totals**: Subtotals, CGST/SGST tax, discounts, and grand totals are verified and calculated on the server to prevent tamper attempts.
- **Flexible Payments**: Settles bills with splits mapped to Cash, UPI / QR, or Card.
- **Dynamic Settings Sync**: Real-time tax computations apply GST rates fetched from global restaurant settings.
- **Receipts**: Support for 58mm and 80mm formatting with options to print or share digital summaries.

### 🍽️ 2. Waiter Order-Taking Terminal (`OrdersView.tsx`)
- **Table Grid**: Waiter selects tables to see occupancy states (AVAILABLE, OCCUPIED, BILL_REQUESTED, CLEANING).
- **Cart Builder**: Instantly browse veg/non-veg dishes, modify quantities, add custom preparation notes, and submit directly to the kitchen.
- **Real-time Order Tracking**: Sockets update order statuses (SENT_TO_KITCHEN, PREPARING, READY, SERVED) on the waiter screen immediately.

### 🍳 3. Kitchen Display System (`KitchenView.tsx`)
- **Chef Workspace**: Shows incoming orders, preparation notes, dish quantities, and elapsed ticket time.
- **One-Click Transitions**: Chefs can Accept orders (`PREPARING`), mark them `READY` to serve, or flag them `SERVED/COMPLETED`.
- **Instant Alerts**: Updates broadcast dynamically to Waiters and Cashiers via Socket.IO.

### 🍽️ 4. Menu & Category Management (`MenuView.tsx`)
- **Catalog Editor**: CRUD interface for categories and menu items.
- **Product Parameters**: Edit description details, update pricing, define dietary veg/non-veg dots, and toggle availability sold-out checkboxes.

### 👥 5. Customer Database CRM (`CustomersView.tsx`)
- **Visits Tracking**: Database counts visits and aggregates lifetime spend metrics automatically.
- **Chronological History**: Expand customer sheets to audit purchase details.

### 📊 6. Sales Reports & Dashboard (`SalesView.tsx`)
- **Recharts Data**: Revenue trends, top-selling gourmet items, and payment method ratios render directly from aggregated SQL data.
- **Audit Ledger**: A chronological log of settled, pending, and cancelled bills.

### ⚙️ 7. Desk Settings (`SettingsView.tsx`)
- **Store Profile**: Custom brand details, phone numbers, addresses, and tax configuration (GST ON/OFF and custom rates).
- **Roster Security**: Enrol and delete login credentials for Cashiers, Waiters, and Chefs.

### 📱 8. Installable Progressive Web App (PWA)
- **Install Prompt Banner**: Custom install button in sidebar to prompt standalone launcher installation.
- **Offline Safeguard Mode**: Banners warn users when offline, lock checkout, disable print previews, and block order submissions to ensure server-authoritative integrity.
- **Auto-Sync Reconnect**: Auto-reconnects live websockets and invalidates TanStack Query caches to sync all tables and orders when network is restored.
- **Touch Screen Layouts**: Enriched button paddings, enlarged quantity and cart delete icons, and taller input targets for waiter and chef touchscreen devices.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, Lucide React, Motion, Recharts
- **Backend**: Node.js 22 LTS, TypeScript, Fastify, Socket.IO, JWT, bcrypt, Zod, Pino
- **Database**: SQLite
- **ORM**: Prisma

---

## 📂 Project Folder Structure

```
/
├── backend/                   # Node.js + Fastify backend
│   ├── data/                  # SQLite DB storage folder
│   │   └── secret-vibez.db
│   ├── prisma/                # Database schema, migrations, and seed scripts
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/                   # Backend application source code
│       ├── app.ts             # Fastify configuration
│       ├── server.ts          # Socket.IO & listener startup
│       ├── plugins/           # Prisma client share plugin
│       └── modules/           # Route modules (auth, orders, menu, payments, etc.)
│
├── src/                       # React frontend source code
│   ├── main.tsx               # Entry point injecting QueryClient
│   ├── App.tsx                # Session container & page routing
│   ├── api.ts                 # Unified fetch API client & WebSockets setup
│   ├── types.ts               # Shared TypeScript typings
│   └── components/            # UI components (Billing, Kitchen, Waiter, Settings, etc.)
│
├── package.json               # Script commands and project configurations
└── .env                       # Local environment variables
```

---

## ⚙️ Environment Variables (`.env`)

Generate a `.env` file at the root directory of the project:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="file:../data/secret-vibez.db"
JWT_SECRET="secret-vibez-pos-super-secure-token-sign-key-2026"
JWT_EXPIRES_IN="8h"
CORS_ORIGIN="http://localhost:5173"
```

---

## 🔑 Seed Development Credentials

Passwords are secure and stored as bcrypt hashes in the SQLite database:

| Role | Username / Email | Password | Allowed Workspace |
| :--- | :--- | :--- | :--- |
| **OWNER** | `admin@secretvibez.com` | `Admin@123` | All pages (Billing, Kitchen, Waiter, Sales, Settings) |
| **CASHIER** | `cashier@secretvibez.com` | `Cashier@123` | Live Billing POS only |
| **WAITER** | `waiter@secretvibez.com` | `Waiter@123` | Waiter Order Taking only |
| **CHEF** | `chef@secretvibez.com` | `Chef@123` | Kitchen Display only |

---

## 🛠️ Development Setup & Run Commands

Follow these steps to run the application locally:

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup SQLite Database & Apply Migrations
```bash
npm run db:migrate
```

### 3. Seed Development Database
```bash
npm run db:seed
```

### 4. Start Front-End & Back-End Concurrently
```bash
npm run dev
```
The frontend is hosted at [http://localhost:5173](http://localhost:5173) and backend runs at [http://localhost:3000](http://localhost:3000).

### 5. Run API Verification Tests
```bash
npm run test
```
