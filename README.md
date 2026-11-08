# CampusBite — Smart Canteen Ordering System

A comprehensive web-based smart canteen ordering platform built for the university CSE326 academic project.

CampusBite allows students to browse fresh canteen menus, customize carts, place queue-free food orders, and track live kitchen preparation statuses. A separate, password-protected administrator interface provides canteen staff with live order queue management, item catalog controls, and sales telemetry.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Pure HTML5, CSS3, Vanilla JavaScript ES6+ (Strictly framework-free) |
| **Backend** | Node.js, Express.js (CommonJS, `'use strict';`) |
| **Database** | MongoDB Atlas with Official MongoDB Node.js Driver |
| **Sessions** | `express-session`, `connect-mongo` (with in-memory dev fallback) |
| **Security** | `helmet` (CSP, HSTS, nosniff), `bcryptjs`, `express-rate-limit` |

> **Strict Academic Rule Compliance:** Absolutely zero frontend frameworks or build tools (No React, Vue, Angular, Tailwind, Bootstrap, jQuery, TypeScript, or Mongoose).

---

## Directory Structure

```
CampusBite/
├── public/                     # Static client files (HTML, CSS, JS, assets)
│   ├── css/
│   │   ├── styles.css          # Design system & shared components
│   │   ├── student.css         # Student portal layout & timeline
│   │   └── admin.css           # Admin dashboard & CSS charts
│   ├── js/
│   │   ├── config.js           # Currency (₹), categories, endpoints
│   │   ├── utils.js            # DOM helpers, toasts, storage
│   │   ├── auth.js             # Session checking & navbar state
│   │   ├── menu.js             # Catalogue, search, category filter
│   │   ├── cart.js             # LocalStorage cart management
│   │   ├── checkout.js         # Order summary & Cash at Counter
│   │   ├── orders.js           # Order history
│   │   ├── tracking.js         # 4-stage kitchen order tracking
│   │   └── admin.js            # Admin metrics, orders, menu CRUD
│   ├── index.html              # Student home page & hero
│   ├── menu.html               # Full food catalogue
│   ├── cart.html               # Persistent shopping cart
│   ├── checkout.html           # Order placement
│   ├── orders.html             # Student past & live orders
│   ├── tracking.html           # Interactive status tracking
│   ├── login.html              # Student & staff login
│   ├── register.html           # Student account registration
│   ├── admin.html              # Admin operations dashboard
│   ├── admin-menu.html         # Menu items & availability manager
│   ├── admin-orders.html       # Kitchen incoming orders queue
│   └── admin-analytics.html    # Sales & order distribution analytics
├── server/                     # Backend application code
│   ├── config/
│   │   └── database.js         # Official MongoDB connection manager
│   ├── controllers/
│   │   ├── authController.js   # Thin auth route controller
│   │   └── menuController.js   # Menu CRUD controller
│   ├── middleware/
│   │   ├── auth.js             # requireAuth, requireAdmin, protectAdminPages
│   │   ├── errorHandler.js     # Centralized error handler
│   │   └── notFound.js         # 404 handler for API routes
│   ├── routes/
│   │   ├── auth.js             # /api/auth routes
│   │   ├── health.js           # /api/health route
│   │   └── menu.js             # /api/menu routes
│   ├── services/
│   │   ├── authService.js      # Password hashing & verification
│   │   ├── userService.js      # User collection queries
│   │   ├── menuService.js      # Menu collection queries
│   │   └── orderService.js     # Order collection queries
│   └── utils/
│       └── dbValidators.js     # Schema & document validators
├── scripts/
│   ├── init-db.js              # Idempotent index creation script
│   ├── seed-menu.js            # Non-duplicating menu seed script
│   ├── setup-admin.js          # Secure admin account setup
│   └── test-suite.js           # Automated QA & regression test suite
├── server.js                   # Application entry point
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── AGENTS.md                   # Agent coding rules
├── package.json                # npm dependencies and scripts
└── README.md                   # This documentation
```

---

## Getting Started

### 1. Prerequisites
- Node.js v18 or higher (tested on Node.js v24)
- npm v9 or higher

### 2. Installation
```bash
# Clone the repository
git clone <repo-url>
cd CampusBite

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate `.env` with your settings:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net
DB_NAME=campusbite
SESSION_SECRET=your_secure_session_secret_here
NODE_ENV=development

# Admin Account Setup
ADMIN_NAME="Campus Administrator"
ADMIN_EMAIL=admin@campusbite.edu
ADMIN_PASSWORD=YourSecurePassword123!
```

---

## Database Commands

When connected to MongoDB Atlas:

```bash
# Initialize indexes and check collections (non-destructive)
npm run db:init

# Seed realistic campus menu items in Indian Rupees (₹)
npm run db:seed

# Create an administrator account securely (reads from .env)
npm run db:setup-admin
```

---

## Running the Application

```bash
# Production mode
npm start

# Development mode (with nodemon auto-restart)
npm run dev

# Run automated QA test suite (39 automated checks)
npm test
```

The application runs at **http://localhost:5000**.

---

## Key Pages & Endpoints

### Student Portal
- **Home**: `http://localhost:5000/index.html`
- **Menu Catalogue**: `http://localhost:5000/menu.html`
- **Cart**: `http://localhost:5000/cart.html`
- **Checkout**: `http://localhost:5000/checkout.html`
- **My Orders**: `http://localhost:5000/orders.html`
- **Order Tracking**: `http://localhost:5000/tracking.html`
- **Login**: `http://localhost:5000/login.html`
- **Register**: `http://localhost:5000/register.html`

### Admin Portal (Protected)
- **Dashboard**: `http://localhost:5000/admin.html`
- **Order Queue**: `http://localhost:5000/admin-orders.html`
- **Menu Manager**: `http://localhost:5000/admin-menu.html`
- **Analytics**: `http://localhost:5000/admin-analytics.html`

### Primary REST APIs
- `GET /api/health` — Service health-check
- `POST /api/auth/register` — Student registration (always assigns `role: 'student'`)
- `POST /api/auth/login` — Session login with rate limiting
- `POST /api/auth/logout` — Session termination
- `GET /api/auth/me` — Current authenticated user profile
- `GET /api/menu` — Food catalogue retrieval
- `POST /api/menu` — Admin food item creation
- `PUT /api/menu/:id` — Admin food item update
- `DELETE /api/menu/:id` — Admin food item deletion

---

## Academic License
Built for university course CSE326.
