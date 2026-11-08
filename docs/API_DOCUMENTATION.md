# CampusBite — REST API Documentation

This document provides the complete API specification for all endpoints implemented in **CampusBite**.

All API routes are prefixed with `/api`. Responses are serialized in `application/json` format.

---

## Standard Response Format

### Success Response Shape
```json
{
  "success": true,
  "message": "Optional human-readable confirmation message",
  "data": { ... }
}
```

### Error Response Shape
```json
{
  "success": false,
  "error": "Detailed error message explaining the failure"
}
```

---

## 1. System Health

### `GET /api/health`
Checks backend server status and process uptime.

- **Authentication**: None (Public)
- **Required Role**: None
- **Request Parameters / Body**: None
- **Successful Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "CampusBite API is running",
    "timestamp": "2026-11-08T16:53:11.227Z",
    "uptime": 124.5
  }
  ```
- **Error Responses**:
  - `HTTP 500`: Server health check failure.

---

## 2. Authentication API (`/api/auth`)

### `POST /api/auth/register`
Creates a new student account.

- **Authentication**: None (Public)
- **Required Role**: None
- **Request Body**:
  ```json
  {
    "name": "Aarav Patel",
    "email": "aarav.patel@campusbite.edu",
    "password": "SecurePassword123!",
    "confirmPassword": "SecurePassword123!"
  }
  ```
- **Successful Response (HTTP 201)**:
  ```json
  {
    "success": true,
    "message": "Registration successful! You may now log in.",
    "user": {
      "id": "6af0af38f9231151a5f06ce6",
      "name": "Aarav Patel",
      "email": "aarav.patel@campusbite.edu",
      "role": "student"
    }
  }
  ```
- **Error Responses**:
  - `HTTP 400 Bad Request`: Validation failure (name < 2 chars, invalid email, password < 8 chars, or passwords mismatch).
  - `HTTP 409 Conflict`: An account with this email already exists.

---

### `POST /api/auth/login`
Authenticates credentials and establishes a signed session cookie. Rate-limited to **10 requests per 15 minutes**.

- **Authentication**: None (Public)
- **Required Role**: None
- **Request Body**:
  ```json
  {
    "email": "aarav.patel@campusbite.edu",
    "password": "SecurePassword123!"
  }
  ```
- **Successful Response (HTTP 200)**:
  - Header: `Set-Cookie: connect.sid=...; HttpOnly; SameSite=Lax; Path=/`
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "user": {
      "id": "6af0af38f9231151a5f06ce6",
      "name": "Aarav Patel",
      "email": "aarav.patel@campusbite.edu",
      "role": "student"
    }
  }
  ```
- **Error Responses**:
  - `HTTP 400 Bad Request`: Email and password are required.
  - `HTTP 401 Unauthorized`: Invalid email or password.
  - `HTTP 429 Too Many Requests`: Rate limit exceeded (more than 10 attempts in 15 minutes).

---

### `POST /api/auth/logout`
Destroys the current server session and clears the client session cookie.

- **Authentication**: None (Safe to call anytime)
- **Required Role**: None
- **Request Body**: None
- **Successful Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully."
  }
  ```

---

### `GET /api/auth/me`
Retrieves current session user details (used by frontend client for auth state synchronization).

- **Authentication**: Optional
- **Required Role**: None
- **Request Body**: None
- **Successful Response (HTTP 200 - Logged In)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "6af0af38f9231151a5f06ce6",
      "name": "Aarav Patel",
      "email": "aarav.patel@campusbite.edu",
      "role": "student"
    }
  }
  ```
- **Successful Response (HTTP 200 - Guest / Logged Out)**:
  ```json
  {
    "success": true,
    "user": null
  }
  ```

---

## 3. Menu API (`/api/menu`)

### `GET /api/menu`
Retrieves the canteen food catalog.

- **Authentication**: None (Public)
- **Query Parameters**:
  - `category` *(optional)*: Filter by category (`Burgers`, `Pizza`, `Snacks`, `Indian Food`, `Beverages`, `Desserts`).
  - `availableOnly` *(optional)*: Pass `true` to return only in-stock items.
- **Successful Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "items": [
      {
        "_id": "672e19b52a1b9c3f8e4d1001",
        "name": "Paneer Makhani Burger",
        "description": "Crispy spiced cottage cheese patty topped with rich butter makhani sauce.",
        "price": 129,
        "category": "Burgers",
        "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
        "isAvailable": true,
        "preparationTime": 12
      }
    ]
  }
  ```

---

### `POST /api/menu`
Creates a new menu item.

- **Authentication**: Required (`requireAdmin`)
- **Required Role**: `admin`
- **Request Body**:
  ```json
  {
    "name": "Masala Dosa with Chutney",
    "description": "Crispy fermented crepe stuffed with spiced potato masala.",
    "price": 80,
    "category": "Indian Food",
    "image": "https://images.unsplash.com/photo-1589301760014",
    "isAvailable": true,
    "preparationTime": 10
  }
  ```
- **Successful Response (HTTP 201)**:
  ```json
  {
    "success": true,
    "message": "Menu item created successfully.",
    "item": {
      "_id": "672e20b52a1b9c3f8e4d2001",
      "name": "Masala Dosa with Chutney",
      "price": 80,
      "category": "Indian Food"
    }
  }
  ```
- **Error Responses**:
  - `HTTP 401 Unauthorized`: Admin session required.
  - `HTTP 403 Forbidden`: User is not an administrator.
  - `HTTP 400 Bad Request`: Schema validation failure.

---

### `PUT /api/menu/:id`
Updates an existing menu item or toggles its availability.

- **Authentication**: Required (`requireAdmin`)
- **Required Role**: `admin`
- **URL Parameter**: `id` (MongoDB ObjectId of the item).
- **Request Body**: Partial or full fields to update:
  ```json
  {
    "isAvailable": false,
    "price": 85
  }
  ```
- **Successful Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "Menu item updated successfully.",
    "item": {
      "_id": "672e20b52a1b9c3f8e4d2001",
      "name": "Masala Dosa with Chutney",
      "price": 85,
      "isAvailable": false
    }
  }
  ```
- **Error Responses**:
  - `HTTP 404 Not Found`: Menu item with specified ID does not exist.

---

### `DELETE /api/menu/:id`
Deletes a menu item from the catalog.

- **Authentication**: Required (`requireAdmin`)
- **Required Role**: `admin`
- **URL Parameter**: `id` (MongoDB ObjectId).
- **Successful Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "Menu item deleted successfully."
  }
  ```

---

## 4. Student Orders API (`/api/orders`)

All student order routes require an authenticated student session (`requireAuth`).

### `POST /api/orders`
Places a new order with server-side pricing validation and dynamic preparation time estimation.

- **Authentication**: Required (`requireAuth`)
- **Required Role**: `student` or `admin`
- **Request Body**:
  ```json
  {
    "items": [
      { "menuItemId": "672e19b52a1b9c3f8e4d1001", "quantity": 2 }
    ],
    "paymentMethod": "UPI at Counter",
    "notes": "Extra crispy please",
    "idempotencyKey": "a8f3b23c-4122-4822-8231-8e018d415bca"
  }
  ```
- **Successful Response (HTTP 201 - Fresh Order)**:
  ```json
  {
    "success": true,
    "message": "Order placed successfully!",
    "order": {
      "_id": "672e3a89e1a90c1f2b4e8891",
      "orderNumber": "CB-849201",
      "userId": "6af0af38f9231151a5f06ce6",
      "customerName": "Aarav Patel",
      "items": [
        {
          "menuItemId": "672e19b52a1b9c3f8e4d1001",
          "name": "Paneer Makhani Burger",
          "price": 129,
          "quantity": 2,
          "preparationTime": 12
        }
      ],
      "subtotal": 258,
      "tax": 12.9,
      "campusFee": 10,
      "totalAmount": 280.9,
      "paymentMethod": "UPI at Counter",
      "paymentStatus": "Pending",
      "status": "Placed",
      "estimatedPreparationTime": 14,
      "notes": "Extra crispy please",
      "createdAt": "2026-11-08T16:53:11.227Z"
    }
  }
  ```
- **Successful Response (HTTP 200 - Idempotent Duplicate Checkout Detected)**:
  ```json
  {
    "success": true,
    "duplicate": true,
    "message": "Order previously processed (idempotency match).",
    "order": { "orderNumber": "CB-849201", "totalAmount": 280.9, ... }
  }
  ```
- **Error Responses**:
  - `HTTP 401 Unauthorized`: Not logged in.
  - `HTTP 400 Bad Request`: Empty items list, item not found, item sold out (`isAvailable: false`), or quantity > 20.

---

### `GET /api/orders/my`
Retrieves all orders placed by the currently logged-in student, sorted chronologically descending.

- **Authentication**: Required (`requireAuth`)
- **Successful Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "orders": [
      {
        "_id": "672e3a89e1a90c1f2b4e8891",
        "orderNumber": "CB-849201",
        "status": "Placed",
        "totalAmount": 280.9,
        "createdAt": "2026-11-08T16:53:11.227Z"
      }
    ]
  }
  ```

---

### `GET /api/orders/number/:orderNumber`
Retrieves a single order by its token (`CB-XXXXXX`) for live tracking.

- **Authentication**: Required (`requireAuth`)
- **Ownership Verification**: Requester must own the order or have role `'admin'`.
- **URL Parameter**: `orderNumber` (e.g. `CB-849201`).
- **Successful Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "order": {
      "_id": "672e3a89e1a90c1f2b4e8891",
      "orderNumber": "CB-849201",
      "status": "Preparing",
      "paymentStatus": "Pending",
      "estimatedPreparationTime": 14,
      "items": [ ... ],
      "totalAmount": 280.9
    }
  }
  ```
- **Error Responses**:
  - `HTTP 403 Forbidden`: Attempting to view another student's order.
  - `HTTP 404 Not Found`: Order token does not exist.

---

### `GET /api/orders/:id`
Retrieves order details by MongoDB ObjectId.

- **Authentication**: Required (`requireAuth`)
- **Ownership Verification**: Requester must own the order or have role `'admin'`.
- **Successful Response (HTTP 200)**: `{ "success": true, "order": { ... } }`
- **Error Responses**:
  - `HTTP 403 Forbidden`: Unauthorized user.
  - `HTTP 404 Not Found`: Order ID not found.

---

### `POST /api/orders/:id/cancel`
Cancels an order. Allowed **only** when the current status is `Placed`.

- **Authentication**: Required (`requireAuth`)
- **Ownership Verification**: Requester must own the order or be an admin.
- **URL Parameter**: `id` (or `orderNumber`).
- **Successful Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "Order #CB-849201 has been cancelled successfully.",
    "order": {
      "_id": "672e3a89e1a90c1f2b4e8891",
      "orderNumber": "CB-849201",
      "status": "Cancelled"
    }
  }
  ```
- **Error Responses**:
  - `HTTP 400 Bad Request`: Order is in `Preparing`, `Ready`, or `Completed` status ("Kitchen preparation has already commenced").

---

## 5. Admin Operations & Analytics API (`/api/admin`)

All administrative routes require an active session with `role === 'admin'`.

### `GET /api/admin/orders`
Retrieves the order dispatch queue with optional filtering and search.

- **Authentication**: Required (`requireAdmin`)
- **Query Parameters**:
  - `status` *(optional)*: Filter by status (`Placed`, `Preparing`, `Ready`, `Completed`, `Cancelled`).
  - `search` *(optional)*: Case-insensitive search across `orderNumber`, `customerName`, or `customerEmail`.
  - `dateFrom` / `dateTo` *(optional)*: Filter by ISO date strings.
- **Successful Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "count": 1,
    "orders": [
      {
        "_id": "672e3a89e1a90c1f2b4e8891",
        "orderNumber": "CB-849201",
        "customerName": "Aarav Patel",
        "status": "Placed",
        "paymentStatus": "Pending",
        "totalAmount": 280.9,
        "createdAt": "2026-11-08T16:53:11.227Z"
      }
    ]
  }
  ```

---

### `GET /api/admin/orders/:id`
Retrieves complete ticket details for a specific order.

- **Authentication**: Required (`requireAdmin`)
- **Successful Response (HTTP 200)**: `{ "success": true, "order": { ... } }`

---

### `PATCH /api/admin/orders/:id/status`
Advances an order's status along the lifecycle state machine.

- **Authentication**: Required (`requireAdmin`)
- **Request Body**:
  ```json
  {
    "status": "Preparing"
  }
  ```
- **Allowed Transitions**:
  - `Placed` ➔ `Preparing` or `Cancelled`
  - `Preparing` ➔ `Ready`
  - `Ready` ➔ `Completed` (Automatically settles `paymentStatus` to `Paid`)
- **Successful Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "Order status updated to 'Preparing'.",
    "order": {
      "orderNumber": "CB-849201",
      "status": "Preparing"
    }
  }
  ```
- **Error Responses**:
  - `HTTP 400 Bad Request`: Invalid transition (e.g., trying to move directly from `Placed` to `Completed` or attempting to reopen a `Completed` order).

---

### `PATCH /api/admin/orders/:id/payment`
Reconciles counter cash or UPI collection.

- **Authentication**: Required (`requireAdmin`)
- **Request Body**:
  ```json
  {
    "paymentStatus": "Paid"
  }
  ```
- **Successful Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "Payment status updated to 'Paid'.",
    "order": {
      "orderNumber": "CB-849201",
      "paymentStatus": "Paid"
    }
  }
  ```

---

### `GET /api/admin/dashboard`
Fetches real-time operational KPI telemetry.

- **Authentication**: Required (`requireAdmin`)
- **Successful Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "metrics": {
      "totalOrders": 14,
      "todayOrdersCount": 8,
      "grossOrderValue": 3120.5,
      "totalCollectedRevenue": 2450.0,
      "todayCollectedRevenue": 1820.0,
      "pendingOrders": 2,
      "preparingOrders": 1,
      "readyOrders": 1,
      "completedOrders": 9,
      "cancelledOrders": 1,
      "activeKitchenOrders": 3
    },
    "popularProducts": [
      {
        "name": "Paneer Makhani Burger",
        "category": "Burgers",
        "unitsSold": 18,
        "orderFrequency": 9
      }
    ]
  }
  ```

---

### `GET /api/admin/analytics`
Fetches 7-day revenue trend buckets and order status distribution.

- **Authentication**: Required (`requireAdmin`)
- **Successful Response (HTTP 200)**:
  ```json
  {
    "success": true,
    "dailyTrends": [
      { "date": "2026-11-02", "label": "Mon", "revenue": 1420.5, "count": 6 },
      { "date": "2026-11-08", "label": "Sun", "revenue": 2450.0, "count": 8 }
    ],
    "statusDistribution": {
      "Placed": 2,
      "Preparing": 1,
      "Ready": 1,
      "Completed": 9,
      "Cancelled": 1
    }
  }
  ```
