# CampusBite — Comprehensive Testing & Quality Assurance Report

**Audit Date**: November 8, 2026  
**Subject**: CSE326 Academic Evaluation  
**System**: CampusBite — Smart Canteen Ordering System  
**Test Suites**: Unit & Integration Suite (`npm test`), End-to-End Workflow Suite (`npm run test:e2e`), Live Atlas Cloud Reliability Audit (`npm run audit:atlas`)  
**Overall Result**: **100% PASS (57 / 57 Verified Executions, 0 Failures)**

---

## 1. Testing Strategy & Methodology

The testing strategy for CampusBite was designed to guarantee system reliability, financial integrity, and strict adherence to academic technology restrictions without using simulated or mock data to claim production success:

```
┌────────────────────────────────────────────────────────┐
│            CampusBite Three-Tier Test Model            │
└────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Integration  │  │  End-to-End   │  │  Live Cloud   │
│   Suite (QA)  │  │   Workflows   │  │  Atlas Audit  │
│   (41 Tests)  │  │  (8 Journeys) │  │  (8 Metrics)  │
└───────────────┘  └───────────────┘  └───────────────┘
```

1. **Unit & Integration Suite (`scripts/test-suite.js`)**: Focuses on technology compliance, API status codes, pricing math, state transition rules, and input validators.
2. **End-to-End User Journeys (`scripts/e2e-workflows-test.js`)**: Executes full real-world student-to-kitchen user journeys over HTTP against the running Express application.
3. **Live Cloud Atlas Reliability Audit (`scripts/verify-atlas-live.js`)**: Exercises the official MongoDB driver directly against the remote MongoDB Atlas cluster, testing network resiliency, session persistence, and data integrity across hard disconnect/reconnect cycles.
4. **Negative & Security Testing**: Deliberately injects malicious pricing payloads, expired tickets, duplicate checkout clicks, and cross-student eavesdropping attempts to verify security guardrails.

---

## 2. Test Execution Environment

- **Operating System**: Windows 11 Home (x64)
- **Node.js Version**: v24.19.0
- **npm Version**: v11.17.0
- **Cloud Database**: MongoDB Atlas M0 Cloud Cluster (Database: `campusbite`)
- **Native Database Driver**: `mongodb@7.8.0` (Official MongoDB Node.js driver)
- **Test Server Ports**: 5066 (QA Runner), 5055 (E2E Runner)

---

## 3. Suite 1: Unit & Integration Test Suite (`npm test`)

**Command**: `npm test`  
**Execution Script**: [`scripts/test-suite.js`](file:///d:/Production/CampusBite/scripts/test-suite.js)  
**Total Test Cases**: **41** | **Passed**: **41** | **Failed**: **0**

| ID | Test Category | Test Case Name / Description | Expected Result | Status |
|:---:|---|---|---|:---:|
| 1 | `COMPLIANCE` | Scan codebase for prohibited frameworks (React, Vue, Tailwind, Mongoose, etc.) | 0 prohibited libraries found | **PASS** |
| 2 | `SERVER` | Server startup and HTTP port binding on port 5066 | Server listens successfully | **PASS** |
| 3 | `REGRESSION` | `GET /api/health` baseline health check | HTTP 200 with uptime and timestamp | **PASS** |
| 4 | `REGRESSION` | Helmet security headers verification | `Content-Security-Policy` & `nosniff` present | **PASS** |
| 5 | `REGRESSION` | 404 handler for unknown API routes | HTTP 404 `{ success: false }` | **PASS** |
| 6 | `AUTH` | Student registration with valid name, email, and password | HTTP 201 Created | **PASS** |
| 7 | `AUTH` | Student login and HTTP-only session cookie issuance | HTTP 200 with `Set-Cookie` header | **PASS** |
| 8 | `AUTH` | Administrator account creation and login | HTTP 200 with admin role session | **PASS** |
| 9 | `ORDER_ENGINE` | Unauthenticated order creation attempt | HTTP 401 Unauthorized | **PASS** |
| 10 | `ORDER_ENGINE` | Order with non-existent `menuItemId` | HTTP 400 Bad Request | **PASS** |
| 11 | `ORDER_ENGINE` | Order with unavailable/sold out item | HTTP 400 Bad Request | **PASS** |
| 12 | `ORDER_ENGINE` | Order with zero or negative quantity | HTTP 400 Bad Request | **PASS** |
| 13 | `ORDER_ENGINE` | Order exceeding portion limit (quantity > 20) | HTTP 400 Bad Request | **PASS** |
| 14 | `ORDER_ENGINE` | Price manipulation defense: client submits ₹1.00 for ₹129 item | Client price ignored; DB subtotal ₹258 + ₹12.90 GST + ₹10 fee = ₹280.90 enforced | **PASS** |
| 15 | `ORDER_ENGINE` | Idempotency protection: dual checkout clicks with identical key | Second request returns HTTP 200 with duplicate flag; no double billing | **PASS** |
| 16 | `STUDENT_ORDERS`| `GET /api/orders/my` retrieves student orders | HTTP 200 with array of user orders | **PASS** |
| 17 | `STUDENT_ORDERS`| Owner can view order tracking details by `orderNumber` | HTTP 200 with order details | **PASS** |
| 18 | `SECURITY` | Student B attempting to view Student A's order | HTTP 403 Forbidden | **PASS** |
| 19 | `STUDENT_ORDERS`| Cancel order while in `Placed` status | HTTP 200; status changes to `Cancelled` | **PASS** |
| 20 | `STUDENT_ORDERS`| Re-cancelling an already cancelled order | HTTP 400 Bad Request | **PASS** |
| 21 | `ADMIN_OPS` | Student attempting to access `/api/admin/orders` | HTTP 403 Forbidden | **PASS** |
| 22 | `STATE_MACHINE`| Transition `Placed` ➔ `Preparing` | HTTP 200; status becomes `Preparing` | **PASS** |
| 23 | `SECURITY` | Student attempting to cancel order after cooking started | HTTP 400 ("Kitchen preparation has already commenced") | **PASS** |
| 24 | `STATE_MACHINE`| Transition `Preparing` ➔ `Ready` | HTTP 200; status becomes `Ready` | **PASS** |
| 25 | `STATE_MACHINE`| Transition `Ready` ➔ `Completed` (Auto-settles payment) | HTTP 200; status `Completed` & payment `Paid` | **PASS** |
| 26 | `STATE_MACHINE`| Attempting to reopen a completed order (`Completed` ➔ `Preparing`) | HTTP 400 Bad Request (Terminal state protected) | **PASS** |
| 27 | `ADMIN_OPS` | Admin manual payment settlement (`Pending` ➔ `Paid`) | HTTP 200; `paymentStatus: 'Paid'` | **PASS** |
| 28 | `ANALYTICS` | Dashboard metric computation (Gross vs Collected revenue) | Revenue math matches stored order records | **PASS** |
| 29 | `ANALYTICS` | Popular food ranking calculation from order items | Top products sorted by units sold | **PASS** |
| 30 | `ANALYTICS` | 7-day chronological revenue trajectory breakdown | 7 daily buckets populated accurately | **PASS** |
| 31 | `SMART_FEATURES`| Kitchen prep time estimation formula accuracy | Single item: 12m; Multi-item + queue: 27m | **PASS** |
| 32 | `VALIDATORS` | Valid order document passes schema validator | Validator returns `{ isValid: true }` | **PASS** |
| 33 | `VALIDATORS` | Empty items array rejected by order validator | Validator returns `{ isValid: false }` | **PASS** |
| 34 | `FRONTEND` | Static delivery of Home page (`/index.html`) | HTTP 200 with HTML payload | **PASS** |
| 35 | `FRONTEND` | Static delivery of Menu page (`/menu.html`) | HTTP 200 with HTML payload | **PASS** |
| 36 | `FRONTEND` | Static delivery of Cart page (`/cart.html`) | HTTP 200 with HTML payload | **PASS** |
| 37 | `FRONTEND` | Static delivery of Checkout page (`/checkout.html`) | HTTP 200 with HTML payload | **PASS** |
| 38 | `FRONTEND` | Static delivery of Orders page (`/orders.html`) | HTTP 200 with HTML payload | **PASS** |
| 39 | `FRONTEND` | Static delivery of Tracking page (`/tracking.html`) | HTTP 200 with HTML payload | **PASS** |
| 40 | `FRONTEND` | Static delivery of Login page (`/login.html`) | HTTP 200 with HTML payload | **PASS** |
| 41 | `FRONTEND` | Static delivery of Register page (`/register.html`) | HTTP 200 with HTML payload | **PASS** |

---

## 4. Suite 2: End-to-End User Workflows (`npm run test:e2e`)

**Command**: `npm run test:e2e`  
**Execution Script**: [`scripts/e2e-workflows-test.js`](file:///d:/Production/CampusBite/scripts/e2e-workflows-test.js)  
**Total Workflows**: **8** | **Passed**: **8** | **Failed**: **0**

| Workflow | Scope & Steps | Verified Behavior | Status |
|:---:|---|---|:---:|
| **WF-1** | Student Order Journey | Student registers, logs in, browses menu, places order with 2x Burger + 1x Coffee | Token `#CB-XXXXXX` generated; status `Placed` | **PASS** |
| **WF-2** | Order History & Tracking | Student views past orders and queries `/tracking.html` | Order details, timestamps, and `Placed` status match | **PASS** |
| **WF-3** | Admin Lifecycle State Progression | Admin transitions order: `Placed` ➔ `Preparing` ➔ `Ready` ➔ `Completed` | Sequential advancement enforced; auto-settles payment to `Paid` | **PASS** |
| **WF-4** | Live Tracking Polling Reflection | Client polls `/api/orders/number/:orderNumber` | Client receives `Completed` status; polling terminates | **PASS** |
| **WF-5** | Admin Counter Payment Settlement | Admin collects cash/UPI at counter for a pending order | `PATCH /payment` sets `paymentStatus` to `Paid` | **PASS** |
| **WF-6** | Cross-Student Privacy Guard | Unauthorized student attempts to access another student's order token | HTTP 403 Forbidden returned | **PASS** |
| **WF-7** | Malicious Price Tampering Defense | Student modifies client payload to buy ₹189 Pizza for ₹1.00 | Server ignores fake price; enforces genuine total of ₹208.45 | **PASS** |
| **WF-8** | Idempotent Checkout Deduplication | Student double-clicks checkout with same `idempotencyKey` | Second request returns HTTP 200 with duplicate flag; single order stored | **PASS** |

---

## 5. Suite 3: Live Cloud MongoDB Atlas Audit (`npm run audit:atlas`)

**Command**: `npm run audit:atlas`  
**Execution Script**: [`scripts/verify-atlas-live.js`](file:///d:/Production/CampusBite/scripts/verify-atlas-live.js)  
**Database**: MongoDB Atlas Cloud Cluster  
**Driver**: `mongodb@7.8.0`  
**Result**: **All 8 Core Reliability Metrics PASSED (13 Verification Steps Completed)**

```
======================================================
        CAMPUSBITE LIVE ATLAS AUDIT FINAL REPORT       
======================================================

| Metric               | Status   | Technical Evidence / Audit Notes
|----------------------|----------|------------------------------------------------------
| Atlas connection     | PASS     | Direct TLS connection to database: "campusbite"
| Database ping        | PASS     | Cluster responded with { ok: 1 }
| Read/write           | PASS     | Full CRUD verified on probe document (_audit_verification)
| Session persistence  | PASS     | Session stored in Atlas sessions collection via connect-mongo
| Menu persistence     | PASS     | 12 seeded items verified across client disconnect & reconnect
| Order persistence    | PASS     | Order created, retrieved across reconnect, advanced to Completed
| Analytics            | PASS     | Aggregation matches actual stored Atlas order documents
| Regression           | PASS     | Both npm test and npm run test:e2e executed with 0 errors
======================================================
```

### Detailed 13-Point Cloud Verification Steps
1. **Connection**: Authenticated using `MONGODB_URI` from `.env`; asserted `isConnected() === true`.
2. **Ping**: Executed `{ ping: 1 }` against the active cluster; verified `{ ok: 1 }`.
3. **Read/Write CRUD**: Inserted probe document, verified find, updated flag, and deleted probe.
4. **Index Verification**: Confirmed unique email index, unique orderNumber index, and query indexes.
5. **Menu Seeding**: Seeded 12 items via `seed-menu.js` without duplicating records.
6. **Disconnect Persistence**: Closed connection with `closeDB()`, reconnected with `connectDB()`, and retrieved all 12 items intact.
7. **Student Registration & Bcrypt Verification**: Registered student and verified that `passwordHash` is stored as a 60-character bcrypt hash (never plain text).
8. **Session Store Persistence**: Stored session using `MongoStore.create()`, queried raw Atlas `sessions` collection, retrieved session, and cleanly destroyed it.
9. **Real Order Placement**: Placed order directly in Atlas; verified subtotal, 5% GST, ₹10 campus fee, and token format `#CB-XXXXXX`.
10. **Reconnection Order Retrieval**: Disconnected, reconnected, and retrieved the order by ID and orderNumber.
11. **State Machine Persistence in Cloud**: Transitioned order `Placed` ➔ `Preparing` ➔ `Ready` ➔ `Completed`; verified across reconnection that payment automatically settled to `Paid`.
12. **Analytics Aggregation**: Validated that `totalCollectedRevenue` and `grossOrderValue` match the sum of stored Atlas documents.
13. **Safe Failure & Test Data Cleanup**: Verified that unreachable hosts trigger a graceful `MongoServerSelectionError` without crashing; deleted only ephemeral test records, leaving the 12-item menu intact.

---

## 6. Summary of Negative & Security Test Cases

| Vector | Attack / Negative Input Injected | Expected Defensive Behavior | Actual Behavior | Result |
|---|---|---|---|:---:|
| **Price Tampering** | Manipulated payload: `{ price: 1.00, clientTotal: 5.00 }` | Server computes true price from Atlas items | Server charged subtotal ₹258 + tax ₹12.90 + fee ₹10 = ₹280.90 | **PASS** |
| **Quantity Abuse** | Submitted `{ quantity: 0 }` and `{ quantity: 50 }` | Server enforces `1 <= qty <= 20` | HTTP 400 Bad Request returned | **PASS** |
| **Sold Out Items** | Submitted order with `isAvailable: false` dish | Server checks availability flag | HTTP 400 Bad Request returned | **PASS** |
| **Cross-User Eavesdropping** | Student B calls `/api/orders/:id` for Student A | Ownership verification block | HTTP 403 Forbidden returned | **PASS** |
| **Unapproved Cancellation** | Student cancels order while in `Preparing` status | Cancellation locked to `Placed` | HTTP 400 ("Kitchen preparation has already commenced") | **PASS** |
| **Terminal Reopening** | Admin attempts `Completed` ➔ `Preparing` transition | State machine rejects transition | HTTP 400 Bad Request returned | **PASS** |
| **Brute Force Login** | Fired 12 consecutive bad password attempts | Rate limiter throttles IP | HTTP 429 Too Many Requests returned on attempt 11 | **PASS** |
| **Direct Admin Page Access** | Unauthenticated user navigates to `/admin.html` | Middleware intercepts request | HTTP 302 Redirect to `/login.html?redirect=admin` | **PASS** |
