# CampusBite — Smart Canteen Ordering System

A robust, full-stack, web-based canteen management and pre-ordering platform developed for the university academic course **CSE326**.

CampusBite streamlines campus dining by eliminating long canteen counter queues. Students can browse real-time food menus, customize orders in a persistent cart, submit tamper-proof orders with server-side pricing validation, and monitor live kitchen preparation updates through an interactive tracking interface. Canteen operators and staff manage incoming order tickets through an administrative operations dashboard featuring lifecycle state progression, counter payment settlement, menu catalog controls, and sales telemetry.

---

## 1. Problem Statement

University canteens face severe operational bottlenecks during peak lunch and recess hours:
- **Prolonged Queue Congestion**: Students spend 20–30 minutes waiting in physical queues to place orders and pay, reducing their effective recess time.
- **Order Inaccuracies & Communication Errors**: Verbal orders in noisy dining halls lead to incorrect dish preparation, billing mistakes, and food wastage.
- **Lack of Kitchen Workload Transparency**: Students have zero visibility into prep times and kitchen congestion before ordering.
- **Manual Accounting & Inventory Friction**: Canteen staff rely on physical tokens and paper logs, making sales tallying and rush-hour queue prioritization cumbersome.

CampusBite solves these issues by providing a digitized, queue-free ordering workflow with deterministic preparation time estimates and end-to-end order lifecycle tracking.

---

## 2. Key Features

### For Students
- **Interactive Food Catalogue**: Real-time browsing across categories (Burgers, Pizza, Snacks, Indian Food, Beverages, Desserts) with live pricing, preparation estimates, and vegetarian badges.
- **Instant Search & Category Filtering**: Client-side filtering and search with responsive grid cards.
- **Persistent Local Cart**: State-managed cart with quantity boundaries (max 20 portions per dish) and local storage synchronization.
- **Tamper-Proof Checkout**: Server-side price calculation where client-submitted prices are strictly ignored; automatic 5% GST and ₹10 campus convenience fee calculations.
- **Counter Payment Options**: Support for "Cash at Counter" and "UPI at Counter" options with unique order tokens (`CB-XXXXXX`).
- **Idempotency Protection**: Dual-click prevention using client-generated idempotency keys.
- **Live Order Tracking**: Visual 4-stage status timeline (`Placed` ➔ `Preparing` ➔ `Ready` ➔ `Completed`) with automated 4.5-second polling that halts when terminal status is reached.
- **Order History & Self-Cancellation**: Personal order logs with the ability to cancel orders while in the `Placed` status before cooking starts.

### For Canteen Administrators & Staff
- **Protected Operations Portal**: Role-based authentication (`admin`) with automatic server-side redirects on unauthorized page visits.
- **Live Order Queue**: Real-time order dispatch feed filterable by status (`Placed`, `Preparing`, `Ready`, `Completed`, `Cancelled`), date range, and customer keyword.
- **Lifecycle State Machine**: Enforces strict status transitions (`Placed` ➔ `Preparing` ➔ `Ready` ➔ `Completed`); prevents reopening completed or cancelled tickets.
- **Counter Payment Reconciliation**: One-click settlement marking counter payments as `Paid` (with auto-settlement upon order completion).
- **Menu Catalog Management**: Add, edit, toggle availability (sold out vs available), and delete menu dishes with instant reflection.
- **Sales Telemetry & Analytics**: Daily gross order volume, collected counter revenue, active kitchen queue workload, top-selling items breakdown, and 7-day revenue trajectories.

---

## 3. Technology Stack

CampusBite is engineered strictly under **academic course guidelines** without third-party frontend frameworks or heavy ORMs:

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) | Semantic HTML, CSS Grid, Flexbox, custom design tokens, native DOM manipulation (Strictly framework-free). |
| **Backend** | Node.js, Express.js | Express 5 architecture, CommonJS modules, `'use strict';` convention, RESTful API design. |
| **Database** | MongoDB Atlas | Cloud-hosted NoSQL cluster utilizing the **official MongoDB Node.js driver** (`mongodb@7.8.0`). No Mongoose. |
| **Session Store** | `express-session`, `connect-mongo` | Production session persistence stored in the Atlas `sessions` collection with 24-hour TTL. |
| **Security** | `helmet`, `bcryptjs`, `express-rate-limit` | Content Security Policy (CSP), HTTP-only cookies, password hashing (10 salt rounds), brute-force rate limiters. |

> **Academic Rule Compliance Notice**: This project contains **zero** instances of React, Next.js, Vue, Angular, TypeScript, JSX, Tailwind CSS, Bootstrap, jQuery, or Mongoose.

---

## 4. System Architecture Overview

CampusBite follows a clean **Three-Tier Architecture**:

```
[Presentation Layer]     Vanilla HTML5 / CSS3 / ES6+ JavaScript Client (Browser)
                                  │
                                  ▼  HTTP / REST (JSON) + Cookie Sessions
[Application Layer]      Node.js & Express.js Server
                         ├── Security: Helmet, Rate Limiter, Auth Middleware
                         ├── Controllers: Thin HTTP Route Handlers
                         ├── Services: Business Logic, Pricing & Time Estimator
                         └── Validators: Pure Validation Utility Functions
                                  │
                                  ▼  Official MongoDB Driver (TLS / SNI)
[Data Layer]             MongoDB Atlas Cloud Database (campusbite)
                         ├── users
                         ├── menuItems
                         ├── orders
                         └── sessions
```

---

## 5. Project Directory Structure

```
CampusBite/
├── public/                     # Static client files (HTML, CSS, JS, assets)
│   ├── css/
│   │   ├── styles.css          # Global design system & shared components
│   │   ├── student.css         # Student portal layout, cart & tracking styles
│   │   └── admin.css           # Admin operations dashboard & visual telemetry
│   ├── js/
│   │   ├── config.js           # Currency constants (₹), endpoints, status mappings
│   │   ├── utils.js            # DOM helpers, toast alerts, storage wrappers
│   │   ├── auth.js             # Session checking, header state & logout logic
│   │   ├── menu.js             # Menu fetching, live search & category filters
│   │   ├── cart.js             # LocalStorage cart management & badge counter
│   │   ├── checkout.js         # Order summary computation & submission
│   │   ├── orders.js           # Student order history & cancellation triggers
│   │   ├── tracking.js         # Live status stepper & 4.5s polling engine
│   │   └── admin.js            # Admin order dispatch, status PATCH, analytics
│   ├── index.html              # Student landing & hero portal
│   ├── menu.html               # Full canteen food catalogue
│   ├── cart.html               # Persistent shopping cart page
│   ├── checkout.html           # Order placement & counter payment selection
│   ├── orders.html             # Student past and active orders
│   ├── tracking.html           # Real-time visual order tracking
│   ├── login.html              # Unified login (Student & Staff)
│   ├── register.html           # Student registration
│   ├── admin.html              # Admin operational command center
│   ├── admin-menu.html         # Menu catalog CRUD & stock toggles
│   ├── admin-orders.html       # Kitchen incoming orders dispatch queue
│   └── admin-analytics.html    # Revenue breakdown & product performance
├── server/                     # Backend server source code
│   ├── config/
│   │   ├── constants.js        # Order/Payment statuses & state transitions
│   │   ├── database.js         # Official MongoDB connection pool manager
│   │   └── mockStore.js        # In-memory repository fallback
│   ├── controllers/
│   │   ├── adminController.js  # Order dispatch, status PATCH, analytics
│   │   ├── authController.js   # Registration, session login, logout
│   │   ├── menuController.js   # Menu CRUD route controllers
│   │   └── orderController.js  # Order creation, history, cancellation
│   ├── middleware/
│   │   ├── auth.js             # requireAuth, requireAdmin, protectAdminPages
│   │   ├── errorHandler.js     # Centralized error handler
│   │   └── notFound.js         # 404 handler for unknown API routes
│   ├── routes/
│   │   ├── admin.js            # /api/admin/* endpoints
│   │   ├── auth.js             # /api/auth/* endpoints
│   │   ├── health.js           # /api/health endpoint
│   │   ├── menu.js             # /api/menu/* endpoints
│   │   └── orders.js           # /api/orders/* endpoints
│   ├── services/
│   │   ├── authService.js      # Password verification logic
│   │   ├── menuService.js      # Menu collection queries & updates
│   │   ├── orderService.js     # Pricing engine, state machine, analytics
│   │   └── userService.js      # User management & bcrypt queries
│   └── utils/
│       ├── dbValidators.js     # Schema validation routines
│       └── prepTimeEstimator.js# Smart preparation time estimation algorithm
├── scripts/
│   ├── e2e-workflows-test.js   # End-to-end 8 user journeys test runner
│   ├── init-db.js              # Safe collection & index builder
│   ├── seed-menu.js            # Idempotent 12-item menu seeding script
│   ├── setup-admin.js          # Secure administrator account creation
│   ├── test-suite.js           # 41-case comprehensive QA test runner
│   └── verify-atlas-live.js    # Live MongoDB Atlas reliability audit suite
├── docs/                       # Project documentation & academic report
│   ├── PROJECT_REPORT.md       # Comprehensive CSE326 Academic Project Report
│   ├── SYSTEM_ARCHITECTURE.md  # Architectural diagrams & lifecycles
│   ├── DATABASE_DESIGN.md      # Schema documentation, fields & indexes
│   ├── API_DOCUMENTATION.md    # Complete REST API reference
│   ├── TESTING_REPORT.md       # QA test execution & audit results
│   └── USER_GUIDE.md           # Step-by-step user manual
├── server.js                   # Express server entry point
├── .env.example                # Sanitized environment variable template
├── .gitignore                  # Git ignore definitions
├── AGENTS.md                   # Agent system rules & architectural guardrails
├── package.json                # Project dependencies and npm scripts
└── README.md                   # This documentation
```

---

## 6. Prerequisites

To run CampusBite locally or in an evaluation environment, ensure you have:
- **Node.js**: v18.0.0 or later (v20+ recommended; verified on Node.js v24.19.0).
- **npm**: v9.0.0 or later (verified on npm 11.17.0).
- **MongoDB Atlas Account** (or a local MongoDB instance running on port 27017).
- Modern web browser (Chrome, Firefox, Safari, or Edge).

---

## 7. Installation Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/CampusBite.git
   cd CampusBite
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

---

## 8. Environment Variable Configuration

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Configure your parameters inside `.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/campusbite?retryWrites=true&w=majority
DB_NAME=campusbite
SESSION_SECRET=change_this_to_a_long_cryptographically_secure_random_string
NODE_ENV=development

# Optional parameters for scripts/setup-admin.js
ADMIN_NAME=Campus Administrator
ADMIN_EMAIL=admin@campusbite.edu
ADMIN_PASSWORD=SecureAdminPassword123!
```

> **Security Note**: Never commit your `.env` file to version control. The `.gitignore` file includes `.env` by default.

---

## 9. MongoDB Atlas Setup

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free M0 Shared Cluster.
3. Under **Database Access**, create a database user with `readWriteAnyDatabase` privileges.
4. Under **Network Access**, add an IP Access entry (`0.0.0.0/0` for development or your current public IP).
5. Click **Connect** ➔ **Drivers** ➔ select **Node.js** and copy the connection string into `MONGODB_URI` in `.env`.

---

## 10. Database Initialization

Execute the non-destructive initialization script to build all required collections and indexes:

```bash
npm run db:init
```

This establishes:
- Unique index on `users.email`
- Filter indexes on `menuItems.category` and `menuItems.isAvailable`
- Unique index on `orders.orderNumber`
- Query indexes on `orders.userId`, `orders.createdAt`, `orders.status`
- Sparse index on `orders.userId` + `orders.idempotencyKey`

---

## 11. Menu Seeding

Populate the database with the initial 12 campus canteen menu items:

```bash
npm run db:seed
```

This inserts dishes across Burgers, Pizza, Snacks, Indian Food, Beverages, and Desserts with real prices, prep times, and image URLs. The script is idempotent; re-running it preserves existing items without duplicating records.

---

## 12. Admin Account Setup

Create the primary administrator account securely:

```powershell
# Using PowerShell
$env:ADMIN_EMAIL="admin@campusbite.edu"
$env:ADMIN_PASSWORD="SecurePassword123!"
$env:ADMIN_NAME="Head Chef Administrator"
npm run db:setup-admin
```

```bash
# Using Bash / macOS / Linux
ADMIN_EMAIL="admin@campusbite.edu" ADMIN_PASSWORD="SecurePassword123!" ADMIN_NAME="Head Chef Administrator" npm run db:setup-admin
```

---

## 13. Starting the Server

### Development Mode (with automatic restart via nodemon)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Once running, navigate to: **`http://localhost:5000`**

---

## 14. Available npm Scripts

| Command | Purpose |
|---|---|
| `npm start` | Launches the production Express server (`node server.js`). |
| `npm run dev` | Launches the development server with file watching via `nodemon`. |
| `npm test` | Runs the 41-case comprehensive QA integration test suite. |
| `npm run test:e2e` | Runs the 8-workflow end-to-end user journey test suite. |
| `npm run audit:atlas`| Runs the 13-step live MongoDB Atlas database reliability audit suite. |
| `npm run db:init` | Builds MongoDB collections and creates unique and sparse indexes. |
| `npm run db:seed` | Populates the menu catalogue with 12 initial canteen dishes. |
| `npm run db:setup-admin` | Creates an administrator account securely from environment variables. |

---

## 15. User Instructions

### Student Workflow
1. **Register**: Go to `/register.html`, enter your name, university email, and a secure password.
2. **Browse Menu**: Visit `/menu.html`, filter by category or type into the search bar.
3. **Cart**: Add desired food items. Modify quantities on `/cart.html`.
4. **Checkout**: Proceed to `/checkout.html`, choose "Cash at Counter" or "UPI at Counter", add optional kitchen notes, and click "Place Order".
5. **Live Tracking**: After placing the order, you will be redirected to `/tracking.html?order=CB-XXXXXX` to watch your dish progress through Placed, Preparing, Ready, and Completed.
6. **Order Cancellation**: You can cancel your order directly from `/orders.html` as long as it is still in `Placed` status. Once kitchen preparation commences, cancellation is locked.

### Administrator Workflow
1. **Login**: Go to `/login.html` and sign in with your administrator credentials.
2. **Operations Dashboard**: Access `/admin.html` to review gross order value, today's collected revenue, active kitchen queue, and popular food items.
3. **Order Queue**: Visit `/admin-orders.html` to view incoming orders. Advance tickets from `Placed` ➔ `Preparing` ➔ `Ready` ➔ `Completed`.
4. **Payment Reconciliation**: Settle counter payments by clicking "Mark Paid" or completing the ticket.
5. **Catalog Management**: Open `/admin-menu.html` to add new food items, update prices, or toggle an item's status to "Sold Out".
6. **Analytics**: Review `/admin-analytics.html` for 7-day revenue charts and status distribution breakdowns.

---

## 16. Security Implementation

- **Server-Side Price Authority**: Client-side prices submitted in payloads are strictly discarded. Prices are fetched dynamically from MongoDB Atlas records.
- **Strict Financial Calculations**: Subtotal is calculated server-side; 5% GST and ₹10 campus fee are applied deterministically.
- **Idempotency Key Protection**: Rapid duplicate checkout clicks are deduplicated using client-generated UUID keys to prevent double-billing.
- **Bcrypt Password Encryption**: Student and admin passwords are encrypted with bcrypt (10 salt rounds); plain-text passwords are never persisted.
- **HTTP-Only Session Cookies**: Session cookies are configured with `httpOnly: true`, `sameSite: 'lax'`, and 24-hour expiration.
- **Role-Based Access Control**: Middleware verifies session role (`student` vs `admin`). Direct browser visits to `/admin*.html` are intercepted server-side and redirected to login.
- **Cross-User Privacy Guard**: Endpoint `/api/orders/:id` and `/api/orders/number/:orderNumber` verify ownership; students cannot inspect another student's order (HTTP 403 Forbidden).
- **Helmet HTTP Headers**: Enforces Content Security Policy (CSP), `X-Content-Type-Options: nosniff`, and disables `X-Powered-By`.
- **API Rate Limiting**: Global limit of 300 requests per 15 minutes per IP; sensitive login endpoint is throttled to 10 attempts per 15 minutes.

---

## 17. Testing Instructions

CampusBite features a fully automated verification pipeline:

```bash
# 1. Run Unit, Integration & Pricing Integrity Tests (41 tests)
npm test

# 2. Run End-to-End User Workflows (8 journeys)
npm run test:e2e

# 3. Run Live Cloud Atlas Reliability Audit (13 verification steps)
npm run audit:atlas
```

### Verified Test Summary
- **QA Integration Test Suite**: **41 / 41 PASSED (0 Failed)**
- **E2E Workflow Test Suite**: **8 / 8 PASSED (0 Failed)**
- **Live Cloud Atlas Audit**: **8 / 8 Core Metrics PASS (13/13 Steps Verified)**

---

## 18. Troubleshooting

| Symptom | Probable Cause | Solution |
|---|---|---|
| `MongoParseError: Invalid scheme` | Malformed `MONGODB_URI` in `.env` | Ensure your URI starts with `mongodb://` or `mongodb+srv://` and has no duplicate variable prefix. |
| `MongoServerSelectionError` | IP whitelist restriction in Atlas | Add your current IP address to the Atlas Network Access whitelist (`0.0.0.0/0` for dev). |
| Port 5000 already in use | Stale Node process or another app | Change `PORT=5050` in `.env` or terminate the process occupying port 5000. |
| Admin redirect loop | Admin session expired or unauthorized | Sign out, log back in via `/login.html` with an account possessing `role: 'admin'`. |
| Session falls back to MemoryStore | `MONGODB_URI` not set or `connect-mongo` issue | Check that `MONGODB_URI` is present in `.env` and verify `server.js` uses `{ MongoStore }`. |

---

## 19. Future Enhancements

- **Push Notifications & WebSockets**: Replace client-side 4.5s polling with WebSocket/SSE for real-time kitchen push notifications.
- **Digital Payment Gateway**: Integration with Razorpay or Paytm for direct UPI/card app-based payments.
- **Barcode / QR Pickup Scanner**: Canteen staff scanning student QR tokens at the counter to mark orders collected instantly.
- **Dietary & Allergen Filtering**: Filter dishes by vegan, gluten-free, nut-free, and calorie specifications.
- **Kitchen Display System (KDS)**: Dedicated tablet screen for kitchen chefs displaying preparation countdown timers.

---

## 20. Academic Project Metadata

- **Course**: CSE326 Academic Project
- **Student**: Pirzada Salik
- **Documentation**: Detailed reports and diagrams are located in [`docs/`](file:///d:/Production/CampusBite/docs/).
- **License**: Educational Academic Use.
