# PRD.md

# Secret Vibez POS

## Product Overview
Secret Vibez POS is a modern single-restaurant POS system. The existing AI Studio frontend is the approved UI and will be connected to a real Node.js backend and SQLite database.

## Goals
- Fast billing
- Fast waiter order taking
- Real-time kitchen updates
- Simple table management
- Customer tracking
- Sales reporting
- Role-based access

## Users
- Owner
- Cashier
- Waiter
- Chef

## Role Access
| Role | Access |
|---|---|
| Owner | Everything |
| Cashier | Billing POS |
| Waiter | Order Taking |
| Chef | Kitchen |

Backend authorization is mandatory.

## Authentication
Use JWT and bcrypt. No Firebase Authentication.

Development credentials:
- Owner: `admin@secretvibez.com` / `Admin@123`
- Cashier: `cashier@secretvibez.com` / `Cashier@123`
- Waiter: `waiter@secretvibez.com` / `Waiter@123`
- Chef: `chef@secretvibez.com` / `Chef@123`

## Core Features

### Login
Minimal login page with email, password, show/hide password, validation, loading, error message, logout, and session persistence.

Redirect:
- Owner → Dashboard
- Cashier → Billing POS
- Waiter → Order Taking
- Chef → Kitchen

### Billing POS
Preserve the existing AI Studio UI. Support menu search, category filtering, quantity changes, notes, table/customer assignment, subtotal, GST/tax, discount, grand total, cash/UPI/card payments, receipt and thermal printing.

### Menu
Categories, items, prices, availability, veg/non-veg, search, add/edit, availability toggle.

### Tables
Table grid/list, number, capacity, Available, Occupied, Bill Requested, Cleaning.

### Waiter Order Taking
Login → Tables → Select table → Menu → Add items → Notes → Review → Send to kitchen → Track status.

### Kitchen
Chef login → Kitchen. Show new orders, table, order number, items, quantity, notes and elapsed time. Statuses: Pending, Preparing, Ready, Completed.

### Customers
Name, phone, email, visit history, total spend, search.

### Dashboard
Owner-only: today's revenue, orders, average order value, active tables, pending bills, payment breakdown, recent orders, top menu items.

### Reports
Owner-only: daily/weekly/monthly sales, payment summary, order history, cancelled orders, menu performance, customer history.

### Settings
Owner-only: restaurant name, address, phone, GST, receipt details, user management, password change.

## Real-time
Socket.IO synchronizes orders, kitchen updates, table status, bill requests, payments and dashboard events.

## Database
SQLite with Prisma.

Entities:
- User
- Role
- MenuCategory
- MenuItem
- RestaurantTable
- Customer
- Order
- OrderItem
- Payment
- RestaurantSettings

No inventory or recipe management.

## Business Rules
- Orders need at least one item.
- Unavailable items cannot be ordered.
- Tax, discounts and totals are calculated server-side.
- Payment must be recorded before an order becomes Completed.
- Active dine-in order makes a table Occupied.
- Completed/paid order releases the table.
- Every protected API verifies JWT and role.

## Non-Functional
- Fast POS interactions
- Reliable transactional writes
- bcrypt and JWT security
- TypeScript frontend/backend
- Desktop, tablet and mobile responsive
- Existing AI Studio UI preserved

## Out of Scope
- Inventory
- Recipe management
- Ingredient tracking
- Stock deduction
- Firebase
- WhatsApp promotional broadcasting
- Multi-restaurant SaaS
- Payroll
- Complex accounting

## Success Criteria
1. Each role logs in successfully.
2. Each role only accesses authorized modules.
3. Billing persists in SQLite.
4. Waiter orders reach kitchen in real time.
5. Kitchen status reaches waiter.
6. Payments persist correctly.
7. Dashboard uses real database data.
8. Existing AI Studio UI remains visually consistent.
