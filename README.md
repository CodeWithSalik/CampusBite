# CampusBite — Smart Canteen Ordering System

A comprehensive web-based smart canteen ordering platform built for the university CSE326 academic project.

CampusBite allows students to browse fresh canteen menus, customize carts, place queue-free food orders, and track live kitchen preparation statuses with periodic polling. A separate, password-protected administrator interface provides canteen staff with live order queue management, item catalog controls, and sales telemetry.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Pure HTML5, CSS3, Vanilla JavaScript ES6+ (Strictly framework-free) |
| **Backend** | Node.js, Express.js (CommonJS, `'use strict';`) |
| **Database** | MongoDB Atlas with Official MongoDB Node.js Driver (No Mongoose) |
| **Sessions** | `express-session`, `connect-mongo` (with in-memory dev fallback) |
| **Security** | `helmet` (CSP, HSTS, nosniff), `bcryptjs`, `express-rate-limit`, Idempotency Keys |

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
│   │   ├── checkout.js         # Order summary & Cash/UPI at Counter
│   │   ├── orders.js           # Order history & student cancellation
│   │   ├── tracking.js         # 4-stage kitchen order tracking & polling
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
│   │   ├── constants.js        # Order/Payment statuses & transitions
│   │   ├── database.js         # Official MongoDB connection manager
│   │   └── mockStore.js        # In-memory repository fallback
│   ├── controllers/
│   │   ├── adminController.js  # Admin order & telemetry controller
│   │   ├── authController.js   # Thin auth route controller
│   │   ├── menuController.js   # Menu CRUD controller
│   │   └── orderController.js  # Student order & cancellation controller
│   ├── middleware/
│   │   ├── auth.js             # requireAuth, requireAdmin, protectAdminPages
│   │   ├── errorHandler.js     # Centralized error handler
│   │   └── notFound.js         # 404 handler for API routes
│   ├── routes/
│   │   ├── admin.js            # /api/admin routes
│   │   ├── auth.js             # /api/auth routes
│   │   ├── health.js           # /api/health route
│   │   ├── menu.js             # /api/menu routes
│   │   └── orders.js           # /api/orders routes
│   ├── services/
│   │   ├── authService.js      # Password hashing & verification
│   │   ├── menuService.js      # Menu collection queries
│   │   ├── orderService.js     # Order placement, transitions & analytics
│   │   └── userService.js      # User collection queries
│   └── utils/
│       ├── dbValidators.js     # Schema & document validators
│       └── prepTimeEstimator.js# Smart preparation-time formula
├── scripts/
│   ├── e2e-workflows-test.js   # End-to-end 8 user journeys test suite
│   ├── init-db.js              # Idempotent index creation script
│   ├── seed-menu.js            # Non-duplicating menu seed script
│   ├── setup-admin.js          # Secure admin account setup
│   └── test-suite.js           # Automated QA & regression test suite (41 checks)
├── server.js                   # Application entry point
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── AGENTS.md                   # Agent coding rules
├── package.json                # npm dependencies and scripts
└── README.md                   # This documentation
```

---

## Smart Preparation Time Estimation Algorithm

Implemented in `server/utils/prepTimeEstimator.js`:

$$\text{Estimated Prep Time (mins)} = \max(\text{item prep times}) + \min((\text{totalQuantity} - 1) \times 1.5, 8) + \min(\text{activeQueueOrders} \times 2.5, 25)$$

- **Base Item Time**: Longest single preparation time among all ordered dishes (dishes cook concurrently).
- **Batch Overhead**: 1.5 minutes per additional portion (capped at 8 mins).
- **Kitchen Workload Queue**: 2.5 minutes per active order ahead in queue (`Placed` or `Preparing`, capped at 25 mins).
- **Boundary Clamping**: Bounded realistically between `[5 mins, 45 mins]`.

---

## Order State Machine

Allowed Lifecycle Transitions:
- `Placed` ➔ `Preparing` or `Cancelled` (Students can cancel ONLY while in `Placed` status)
- `Preparing` ➔ `Ready`
- `Ready` ➔ `Completed` (Auto-marks payment as `Paid` for counter collection)
- `Completed` / `Cancelled`: Terminal states (Cannot be reopened)

---

## Running the Application & Tests

```bash
# 1. Install dependencies
npm install

# 2. Run Comprehensive QA Test Suite (41 tests)
npm test

# 3. Run End-to-End User Workflows (8 user journeys)
npm run test:e2e

# 4. Start Development Server
npm run dev

# 5. Start Production Server
npm start
```

Access the application in any browser at: **`http://localhost:5000`**

---

## REST API Reference

### Student Endpoints
- `POST /api/orders` — Place order (Server-side price calculation, 5% GST, ₹10 fee, idempotency key support)
- `GET /api/orders/my` — Get logged-in student's order history
- `GET /api/orders/number/:orderNumber` — Live tracking endpoint with ownership authorization check
- `GET /api/orders/:id` — Order details
- `POST /api/orders/:id/cancel` — Cancel order (Allowed only if status is `Placed`)

### Admin Endpoints (Require Admin Session)
- `GET /api/admin/orders` — Filterable order stream (`status`, `search`, `dateFrom`, `dateTo`)
- `GET /api/admin/orders/:id` — Full order details
- `PATCH /api/admin/orders/:id/status` — State machine validated status transitions
- `PATCH /api/admin/orders/:id/payment` — Counter payment settlement (`Paid`, `Pending`)
- `GET /api/admin/dashboard` — Live KPI counters, collected revenue, and smart workload
- `GET /api/admin/analytics` — 7-day revenue trajectory and popular products aggregation

---

## Academic License
Built for university course CSE326.
