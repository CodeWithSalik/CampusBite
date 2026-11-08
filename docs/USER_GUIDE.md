# CampusBite — Comprehensive User & Operator Guide

This guide provides step-by-step instructions for both **Students** and **Canteen Administrators** using the CampusBite platform.

---

# Part 1: Student User Guide

## 1. Account Registration
1. Open your browser and navigate to `http://localhost:5000/register.html` (or click **"Register"** in the top navigation bar).
2. Fill in the required fields:
   - **Full Name**: Your official campus name (minimum 2 characters).
   - **University Email**: Your valid email address (e.g., `student@campusbite.edu`).
   - **Password**: Minimum 8 characters.
   - **Confirm Password**: Must match your password exactly.
3. Click **"Create Account"**. Upon success, a toast confirmation will appear and redirect you to the login page.

> `[INSERT SCREENSHOT: Student Registration Form at /register.html]`

---

## 2. Student Login
1. Navigate to `http://localhost:5000/login.html`.
2. Enter your registered email address and password.
3. Click **"Sign In"**.
4. Once verified, you will be redirected to the **Menu** page (`/menu.html`), and the navigation bar will update to display your name and an active cart badge.

> `[INSERT SCREENSHOT: Login Page at /login.html]`

---

## 3. Browsing the Food Menu & Searching
1. Go to the **Menu** page (`/menu.html`).
2. **Filter by Category**: Click on the category pills (**All**, **Burgers**, **Pizza**, **Snacks**, **Indian Food**, **Beverages**, **Desserts**) to narrow down dishes.
3. **Live Search**: Type into the search input box (e.g., *"paneer"*, *"pizza"*, *"coffee"*) to filter dishes instantly by name or description.
4. Each food card displays:
   - High-resolution dish photo.
   - Dietary indicator (Green veg badge).
   - Unit price in Indian Rupees (₹).
   - Base preparation time (e.g., *"12 mins"*).
   - Stock status (*"In Stock"* or *"Sold Out"*).

> `[INSERT SCREENSHOT: Menu Page with Category Filters and Search at /menu.html]`

---

## 4. Managing Your Shopping Cart
1. Click **"Add to Cart"** on any available dish.
2. The navigation cart counter will update immediately.
3. Navigate to `/cart.html` by clicking the cart icon in the navigation header.
4. On the Cart page, you can:
   - Increase or decrease portions using the **`+`** and **`-`** buttons (maximum limit: 20 portions per dish).
   - Remove an item completely by clicking the trash button.
   - Review the financial summary: Item Subtotal + 5% GST + ₹10 Campus Convenience Fee.
5. Click **"Proceed to Checkout"** to move to the payment stage.

> `[INSERT SCREENSHOT: Shopping Cart View at /cart.html]`

---

## 5. Checkout & Submitting an Order
1. On `/checkout.html`, review your final order items and price breakdown.
2. Select your preferred counter payment method:
   - **Cash at Counter**: Pay cash directly when collecting your food.
   - **UPI at Counter**: Scan the canteen's official UPI QR code at the counter upon pickup.
3. *(Optional)* Enter any special cooking instructions in the **Kitchen Notes** box (e.g., *"No onions please"*, *"Extra spicy"*).
4. Click **"Confirm & Place Order"**.
5. Once verified by the server, your cart will clear automatically, and you will be redirected to the **Live Tracking** screen.

> `[INSERT SCREENSHOT: Checkout Page with Order Summary & Payment Options at /checkout.html]`

---

## 6. Live Order Tracking
1. After placing an order, you will be routed to `/tracking.html?order=CB-XXXXXX`.
2. The page features a **4-Stage Visual Status Stepper**:
   - **1. Placed**: Order received by the system.
   - **2. Preparing**: Kitchen staff has accepted your ticket and cooking has begun.
   - **3. Ready**: Food is packed and awaiting collection at the counter.
   - **4. Completed**: You have picked up your meal.
3. The tracking engine automatically polls the server every **4.5 seconds**; you do not need to refresh the page.
4. When your order reaches **Ready**, proceed to the canteen counter and present your token number (e.g., `#CB-849201`).

> `[INSERT SCREENSHOT: Live Tracking Progress Bar at /tracking.html]`

---

## 7. Viewing Order History & Cancelling Orders
1. Click **"My Orders"** in the top navigation bar (`/orders.html`).
2. All your past and current tickets are listed chronologically with token numbers, dates, item summaries, and total amounts.
3. **Cancelling an Order**:
   - If an order is still in the **`Placed`** stage, a red **"Cancel Order"** button is visible.
   - Clicking it immediately marks the ticket as `Cancelled`.
   - **Important**: Once the kitchen accepts the ticket and switches it to `Preparing`, cooking has begun and the cancellation button is disabled.

> `[INSERT SCREENSHOT: Order History Page with Cancel Action at /orders.html]`

---

# Part 2: Administrator & Kitchen Staff Guide

## 1. Administrator Login
1. Navigate to `http://localhost:5000/login.html`.
2. Enter your administrator email and password (e.g., `admin@campusbite.edu`).
3. Click **"Sign In"**.
4. The system recognizes your `admin` role and redirects you directly to the **Admin Operations Dashboard** (`/admin.html`).
5. *(Note: Regular students cannot access `/admin*.html` pages; the server automatically redirects unauthorized visits to the login screen).*

---

## 2. Command Center Dashboard
1. Open `/admin.html`.
2. The dashboard displays four live metric cards:
   - **Total Orders**: Cumulative orders processed.
   - **Gross Order Value**: Cumulative value of all non-cancelled orders.
   - **Today's Collected Revenue**: Total cash and UPI payments settled today.
   - **Active Kitchen Orders**: Sum of tickets currently in `Placed` and `Preparing` status.
3. The dashboard also features an **Active Kitchen Queue** table and a **Popular Food Items** ranking.

> `[INSERT SCREENSHOT: Admin Command Center Dashboard at /admin.html]`

---

## 3. Managing Incoming Kitchen Orders
1. Navigate to **"Live Orders"** (`/admin-orders.html`).
2. **Filter by Status**: Use the top tabs to view specific queues:
   - **All Orders**
   - **Placed** (New tickets requiring kitchen acceptance)
   - **Preparing** (Dishes currently cooking)
   - **Ready** (Dishes awaiting student pickup)
   - **Completed** (Finalized meals)
   - **Cancelled**
3. **Search Tickets**: Type an order token (`CB-XXXXXX`) or student name into the search bar.
4. **Advance Order Status**:
   - On a `Placed` ticket, click **"Start Preparing"** to acknowledge the ticket and lock student cancellation.
   - On a `Preparing` ticket, click **"Mark Ready"** when cooking is complete.
   - On a `Ready` ticket, click **"Complete Order"** when the student picks up their meal.
5. **Reconcile Payments**:
   - If a student pays cash or scans UPI at the counter, click **"Mark Paid"** to update `paymentStatus` from `Pending` to `Paid`.
   - Completing an order automatically settles payment to `Paid`.

> `[INSERT SCREENSHOT: Admin Orders Queue with Status Action Buttons at /admin-orders.html]`

---

## 4. Menu Catalog & Inventory Management
1. Navigate to **"Manage Menu"** (`/admin-menu.html`).
2. **Adding a New Dish**:
   - Click **"+ Add Menu Item"**.
   - Enter Dish Name, Category, Price in INR (₹), Base Prep Time (minutes), Image URL, and Description.
   - Click **"Save Item"**.
3. **Toggling Stock ("Sold Out" / "Available")**:
   - Locate the item in the table.
   - Click the **"In Stock" / "Sold Out"** toggle button.
   - Changing status to *"Sold Out"* immediately prevents students from adding that item to their cart.
4. **Deleting Dishes**:
   - Click the delete button next to any dish and confirm the prompt.

> `[INSERT SCREENSHOT: Admin Menu Management Table at /admin-menu.html]`

---

## 5. Viewing Sales Analytics & Telemetry
1. Navigate to **"Analytics"** (`/admin-analytics.html`).
2. **7-Day Daily Revenue Trajectory**: Displays a visual bar chart comparing daily sales collections.
3. **Order Status Distribution**: Shows a breakdown of tickets across Placed, Preparing, Ready, Completed, and Cancelled.
4. **Best Sellers**: Lists top-selling dishes by portion volume and order frequency.

> `[INSERT SCREENSHOT: Admin Analytics Page with 7-Day Chart at /admin-analytics.html]`

---

## 6. Logging Out
To protect the administrative portal, click **"Logout"** in the top navigation bar when your shift ends. This invalidates your session token in MongoDB Atlas.
