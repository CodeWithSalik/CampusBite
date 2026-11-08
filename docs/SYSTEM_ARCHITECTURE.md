# CampusBite — System Architecture Documentation

This document describes the architectural design, communication protocols, request lifecycles, and component interactions of the **CampusBite Smart Canteen Ordering System**.

---

## 1. Architectural Overview

CampusBite is engineered as a decoupled, multi-tiered web platform. It strictly adheres to course guidelines for **CSE326 (Web Technology)**, employing native web technologies without third-party frontend frameworks or heavyweight Object-Relational Mappers (ORMs).

```mermaid
graph TD
    subgraph ClientTier["Tier 1: Presentation Layer (Browser)"]
        UI["Vanilla HTML5 Pages (12 Total)"]
        CSS["Custom CSS3 Design Tokens & Grid Layouts"]
        ClientJS["Modular Vanilla ES6+ Scripts (menu.js, cart.js, tracking.js, admin.js)"]
    end

    subgraph ServerTier["Tier 2: Application Layer (Node.js & Express 5)"]
        Security["Security Layer: Helmet, RateLimiter, protectAdminPages"]
        Routing["Express Routers: /api/auth, /api/menu, /api/orders, /api/admin"]
        Controllers["Controllers: Thin HTTP Request Translators"]
        Services["Business Services: orderService, menuService, userService, authService"]
        Utils["Utilities: prepTimeEstimator, dbValidators"]
        Session["Session Engine: express-session + connect-mongo"]
    end

    subgraph DataTier["Tier 3: Cloud Database Layer (MongoDB Atlas)"]
        UsersCol[("users Collection")]
        MenuCol[("menuItems Collection")]
        OrdersCol[("orders Collection")]
        SessionsCol[("sessions Collection")]
    end

    ClientJS -->|"HTTP JSON + Signed Session Cookies"| Security
    Security --> Routing
    Routing --> Controllers
    Controllers --> Services
    Services --> Utils
    Services -->|"Official MongoDB Driver (TLS Encrypted)"| UsersCol
    Services --> MenuCol
    Services --> OrdersCol
    Session --> SessionsCol
```

---

## 2. Three-Tier Architectural Layers

### Tier 1: Presentation Layer
- **Environment**: Client web browser (Chrome, Firefox, Safari, Edge).
- **Core Technologies**: HTML5, CSS3, Vanilla JavaScript (ES6+).
- **Responsibilities**:
  - Semantic markup rendering for all 12 student and staff views.
  - Client-side state persistence for the active shopping cart via `window.localStorage`.
  - Responsive visual layout utilizing native CSS Grid, Flexbox, and CSS Custom Properties.
  - Asynchronous HTTP communications via `window.fetch()` with JSON payload serialization.
  - Periodic polling (4.5s intervals) for active kitchen order progression.

### Tier 2: Application Layer
- **Environment**: Node.js runtime (v18+) executing an Express.js (v5) HTTP server.
- **Responsibilities**:
  - Static file hosting for frontend assets from `public/`.
  - HTTP header hardening via `helmet` and IP request throttling via `express-rate-limit`.
  - Authentication verification and role-based access control (`student` vs `admin`).
  - Business rules enforcement: server-side pricing calculation, 5% GST calculation, ₹10 campus fee application, quantity limits (max 20), and idempotency deduplication.
  - Algorithmic preparation time calculation based on ordered dish baselines and active kitchen queue count.
  - State machine lifecycle transition validation.

### Tier 3: Database Layer
- **Environment**: MongoDB Atlas multi-region cloud cluster.
- **Client**: Official MongoDB Node.js Driver (`mongodb@7.8.0`).
- **Responsibilities**:
  - Document storage for users, menu items, orders, and sessions.
  - Unique index enforcement on `users.email` and `orders.orderNumber`.
  - Sparse compound index enforcement on `orders.userId` + `orders.idempotencyKey`.
  - Session document TTL expiration (automatic purge after 24 hours).

---

## 3. Core Workflows & Mermaid Diagrams

### 3.1 Authentication Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as Student / Administrator
    participant Browser as Client Browser (login.js)
    participant RateLimit as express-rate-limit
    participant AuthCtrl as authController.js
    participant UserSvc as userService.js
    participant DB as MongoDB Atlas (users / sessions)

    User->>Browser: Enters Email & Password
    Browser->>RateLimit: POST /api/auth/login { email, password }
    Note over RateLimit: Checked against budget (Max 10 per 15 min)
    RateLimit->>AuthCtrl: Forward Request
    AuthCtrl->>UserSvc: findByEmail(email)
    UserSvc->>DB: findOne({ email: normalizedEmail })
    DB-->>UserSvc: Returns User Document (with passwordHash)
    UserSvc-->>AuthCtrl: User Record
    AuthCtrl->>AuthCtrl: bcrypt.compare(password, passwordHash)
    alt Password Invalid
        AuthCtrl-->>Browser: HTTP 401 Unauthorized { success: false, error: "Invalid email or password." }
    else Password Valid
        AuthCtrl->>DB: Save Session in sessions collection via connect-mongo
        AuthCtrl-->>Browser: HTTP 200 OK + Set-Cookie: connect.sid (HTTP-only)
        Browser->>Browser: Redirect to /menu.html (student) or /admin.html (admin)
    end
```

---

### 3.2 Student Order Placement Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Cart as Browser LocalStorage
    participant CheckoutUI as checkout.js
    participant OrderCtrl as orderController.js
    participant OrderSvc as orderService.js
    participant MenuSvc as menuService.js
    participant Estimator as prepTimeEstimator.js
    participant DB as MongoDB Atlas (orders)

    Student->>Cart: Adds Items (max 20 portions per dish)
    Student->>CheckoutUI: Clicks "Proceed to Checkout"
    CheckoutUI->>CheckoutUI: Generates idempotencyKey (UUIDv4)
    CheckoutUI->>OrderCtrl: POST /api/orders { items, paymentMethod, notes, idempotencyKey }
    OrderCtrl->>OrderSvc: createOrder(params)
    OrderSvc->>DB: Check idempotencyKey for duplicate
    alt Duplicate Detected
        DB-->>OrderSvc: Existing Order Found
        OrderSvc-->>CheckoutUI: HTTP 200 OK { order, duplicate: true }
    else Fresh Order
        loop For each item
            OrderSvc->>MenuSvc: getItemById(menuItemId)
            MenuSvc-->>OrderSvc: Authoritative DB Price & isAvailable
        end
        OrderSvc->>OrderSvc: Compute Subtotal from DB prices
        OrderSvc->>OrderSvc: Compute 5% GST + ₹10 Campus Fee
        OrderSvc->>Estimator: calculateEstimatedPrepTime(items, activeCount)
        Estimator-->>OrderSvc: Returns Estimated Minutes [5 - 45m]
        OrderSvc->>OrderSvc: Generate Token #CB-XXXXXX
        OrderSvc->>DB: insertOne(orderDocument)
        DB-->>OrderSvc: Acknowledged (insertedId)
        OrderSvc-->>CheckoutUI: HTTP 201 Created { success: true, order }
        CheckoutUI->>Cart: Clear Cart LocalStorage
        CheckoutUI->>Student: Redirect to /tracking.html?order=CB-XXXXXX
    end
```

---

### 3.3 Order Status Lifecycle State Machine

Order status transitions must strictly follow the allowed graph configured in `server/config/constants.js`:

```mermaid
stateDiagram-v2
    [*] --> Placed : Student Places Order (POST /api/orders)
    Placed --> Preparing : Admin Accepts Ticket (PATCH /status)
    Placed --> Cancelled : Student Cancels (POST /cancel) OR Admin Cancels
    Preparing --> Ready : Kitchen Completes Dish (PATCH /status)
    Ready --> Completed : Counter Pick-up (PATCH /status)
    Completed --> [*] : Terminal State (Cannot Reopen)
    Cancelled --> [*] : Terminal State (Cannot Reopen)

    note right of Placed
        Student can self-cancel only in 'Placed' status.
        Payment status: Pending.
    end note

    note right of Preparing
        Cancellation locked.
        Throws HTTP 400 if cancellation attempted.
    end note

    note right of Completed
        Counter payment is auto-settled to 'Paid' upon completion.
    end note
```

---

### 3.4 Admin Order Management & Counter Reconciliation

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Kitchen Staff / Admin
    participant AdminUI as admin.js / admin-orders.html
    participant AdminCtrl as adminController.js
    participant OrderSvc as orderService.js
    participant DB as MongoDB Atlas (orders)

    Staff->>AdminUI: Opens /admin-orders.html
    AdminUI->>AdminCtrl: GET /api/admin/orders?status=Placed
    AdminCtrl->>OrderSvc: getAllOrders({ status: 'Placed' })
    OrderSvc->>DB: find({ status: 'Placed' }).sort({ createdAt: -1 })
    DB-->>OrderSvc: Order Records
    OrderSvc-->>AdminUI: Render Order Cards
    
    Staff->>AdminUI: Clicks "Start Preparing"
    AdminUI->>AdminCtrl: PATCH /api/admin/orders/:id/status { status: "Preparing" }
    AdminCtrl->>OrderSvc: updateOrderStatus(id, "Preparing")
    OrderSvc->>OrderSvc: Validate Transition (Placed -> Preparing is VALID)
    OrderSvc->>DB: findOneAndUpdate({ _id }, { $set: { status: "Preparing" } })
    DB-->>AdminUI: HTTP 200 OK (Updated Order)

    Staff->>AdminUI: Clicks "Mark Paid" (Cash / UPI collected at counter)
    AdminUI->>AdminCtrl: PATCH /api/admin/orders/:id/payment { paymentStatus: "Paid" }
    AdminCtrl->>OrderSvc: updatePaymentStatus(id, "Paid")
    OrderSvc->>DB: findOneAndUpdate({ _id }, { $set: { paymentStatus: "Paid" } })
    DB-->>AdminUI: HTTP 200 OK (Payment Reconciled)
```

---

## 4. Frontend-to-Backend Communication Protocol

1. **Protocol**: HTTP/1.1 over TCP with TLS encryption for cloud Atlas communication.
2. **Data Format**: `application/json` for all request bodies and API responses.
3. **Session Transport**: HTTP-only, SameSite=Lax signed cookies (`connect.sid`).
4. **Standard API Response Shape**:
   ```json
   {
     "success": true,
     "data": { ... }
   }
   ```
   Or upon failure:
   ```json
   {
     "success": false,
     "error": "Descriptive human-readable error message."
   }
   ```

---

## 5. Security & Threat Mitigation Architecture

| Threat Vector | Mitigation Strategy | Component Enforcing Rule |
|---|---|---|
| **Client-side Price Tampering** | Discard submitted client price; fetch official price from MongoDB Atlas. | `orderService.js` |
| **Double-Click Duplicate Orders** | Enforce UUID idempotency check with compound sparse index in MongoDB. | `orderService.js` & `orders.js` |
| **Credential Theft & Brute Force** | 10 attempts / 15-minute window rate limit; bcrypt hashing with 10 rounds. | `auth.js` (routes) & `authService.js` |
| **Session Hijacking / XSS** | Cookies flagged `httpOnly: true`; Helmet Content Security Policy (CSP). | `server.js` |
| **Cross-Student Data Leaks** | Ownership check verifies `String(order.userId) === String(req.session.user.id)`. | `orderService.js` |
| **Unauthorized Admin Escalation** | Middleware `requireAdmin` checks `req.session.user.role === 'admin'`. | `server/middleware/auth.js` |
