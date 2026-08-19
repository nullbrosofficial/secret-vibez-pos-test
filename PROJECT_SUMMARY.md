# Secret Vibez - Billing POS & Desk Management System

## Executive Overview
A full-stack modern Point of Sale (POS) and Restaurant Desk Management application designed for dining establishments and retail outlets. The system provides real-time POS billing, menu item management, automated WhatsApp bill distribution, sales analytics, and customizable GST tax configuration.

---

## 🚀 Key Features

### 🧾 1. Live Billing POS Terminal (`BillingView.tsx`)
- **Interactive Menu Selector**: Instant dish search and category filter (Starters, Main Course, Breads, Desserts, Beverages).
- **Cart & Order Customization**: Table assignment, order quantity modifiers, and notes.
- **Flexible Payment Methods**: Cash, UPI / QR, and Credit Card processing.
- **Custom GST Calculation**: Real-time tax computation based on global settings (5%, 12%, 18%, 28%, or custom rates).
- **Thermal Printing & Digital Receipts**: Print formatted receipts or generate clean digital invoice modals.
- **WhatsApp Direct Bill Sending**: One-click dispatch of structured order receipts to customer phone numbers via WhatsApp.

### 🍽️ 2. Menu Management (`MenuView.tsx`)
- **Catalog Management**: Add, edit, or toggle availability of dishes in real time.
- **Veg / Non-Veg Categorization**: Clear visual indicators for dietary tags.
- **Price Customization**: Update item prices instantly across all billing screens.

### 📊 3. Sales Analytics & Audit (`SalesView.tsx`)
- **Revenue Dashboard**: Daily, weekly, and monthly sales performance visualized via Recharts.
- **Payment Split Insights**: Breakdown of Cash vs. UPI vs. Card settlements.
- **Transaction History**: Audit trail of processed bills with search and refund options.

### ⚙️ 4. Desk Settings & Tax Config (`SettingsView.tsx`)
- **GST Tax Toggle & Custom Rate**:
  - Easily turn GST calculation **ON** or **OFF**.
  - Edit tax percentages (0% to 100%) with quick presets (5%, 12%, 18%, 28%).
- **Business Identity**: Customize restaurant branding, name, and logo emoji.
- **Role-Based Access Control (RBAC)**:
  - **Owner**: Full administrative access to POS, Menu, CRM, Blaster, Sales Analytics, and Settings.
  - **Staff**: Restricted access tailored specifically for Live Billing POS operations.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | React 19 + TypeScript |
| **Build Tooling** | Vite 6 |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React |
| **Animations** | Motion (`motion`) |
| **Data Visualization** | Recharts |
| **Backend Server** | Express.js / Node.js |
| **Type Checking** | TypeScript Compiler (`tsc --noEmit`) |

---

## 📂 File Architecture

```
/
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
├── src/
│   ├── main.tsx               # Application entry point
│   ├── App.tsx                # Main container, security roles & state management
│   ├── types.ts               # Shared TypeScript data models
│   ├── mockData.ts            # Seed dataset for menu items, bills & CRM
│   ├── index.css              # Tailwind styling imports
│   └── components/
│       ├── BillingView.tsx    # Live POS terminal & invoice generator
│       ├── MenuView.tsx       # Dish catalog manager
│       ├── SalesView.tsx      # Sales performance analytics & bill logs
│       └── SettingsView.tsx   # Desk settings, GST tax configuration & staff RBAC
```
