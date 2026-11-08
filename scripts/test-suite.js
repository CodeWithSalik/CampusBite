'use strict';

/**
 * CampusBite — Comprehensive Automated Test & QA Suite (Sprint 2)
 * Tests order creation, server-side pricing, idempotency, ownership,
 * cancellations, status state-machine, admin operations, analytics,
 * security headers, regression suite, and compliance.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const app = require('../server');
const {
  validateUserDocument,
  validateMenuItemDocument,
  validateOrderDocument
} = require('../server/utils/dbValidators');
const { calculateEstimatedPrepTime } = require('../server/utils/prepTimeEstimator');
const { inMemoryMenuItems } = require('../server/config/mockStore');

let server;
let baseUrl;
const PORT = 5066;

const results = [];

function recordTest(name, category, passed, details = '') {
  results.push({ name, category, passed, details });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol} | [${category}] ${name} ${details ? '— ' + details : ''}`);
}

function makeRequest(method, path, body = null, headers = {}, cookie = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers }
    };

    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    let payload = null;
    if (body) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          // not json
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('       CAMPUSBITE COMPREHENSIVE QA TEST SUITE        ');
  console.log('                   SPRINT 2 (TASKS 06-09)            ');
  console.log('======================================================\n');

  // ─── 1. Technology Compliance Audit ──────────────────────────────
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const prohibited = [
    'react', 'next', 'vue', 'angular', 'typescript', 'tailwind',
    'tailwindcss', 'bootstrap', 'jquery', 'mongoose', '@material-ui/core'
  ];

  let foundProhibited = [];
  prohibited.forEach(p => {
    if (allDeps[p]) foundProhibited.push(p);
  });

  recordTest(
    'Technology Compliance Audit (No prohibited frameworks/libraries)',
    'COMPLIANCE',
    foundProhibited.length === 0,
    foundProhibited.length === 0 ? 'Pure Vanilla JS + HTML5 + CSS3 + Node.js' : `Found: ${foundProhibited.join(', ')}`
  );

  // ─── 2. Start Test Server ─────────────────────────────────────────
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(PORT, () => {
      baseUrl = `http://localhost:${PORT}`;
      recordTest('Server Startup & Port Binding', 'SERVER', true, `Listening on ${baseUrl}`);
      resolve();
    });
  });

  // ─── 3. Baseline Regression Tests (Task 01) ───────────────────────
  try {
    const health = await makeRequest('GET', '/api/health');
    const isValidHealth = health.statusCode === 200 &&
      health.json &&
      health.json.success === true &&
      health.json.message.includes('CampusBite');
    recordTest('GET /api/health (Task 01 Baseline Regression)', 'REGRESSION', isValidHealth, `Status ${health.statusCode}`);

    const hasCSP = !!health.headers['content-security-policy'];
    const hasNosniff = health.headers['x-content-type-options'] === 'nosniff';
    recordTest('Security Headers (Helmet CSP, nosniff)', 'REGRESSION', hasCSP && hasNosniff, 'Security headers active');

    const notFoundRes = await makeRequest('GET', '/api/unknown-endpoint-test');
    recordTest('404 Handler for Unknown API Endpoints', 'REGRESSION', notFoundRes.statusCode === 404, `Status ${notFoundRes.statusCode}`);
  } catch (err) {
    recordTest('Baseline Regression Suite', 'REGRESSION', false, err.message);
  }

  // ─── 4. Authentication & Session Setup ────────────────────────────
  let studentCookie = null;
  let otherStudentCookie = null;
  let adminCookie = null;

  // Pre-test DB cleanup for idempotent test runs
  try {
    const { connectDB, COLLECTIONS } = require('../server/config/database');
    if (process.env.MONGODB_URI) {
      const db = await connectDB();
      await db.collection(COLLECTIONS.USERS).deleteMany({
        email: { $in: ['aarav.patel@campusbite.edu', 'diya.sharma@campusbite.edu', 'canteen.admin@campusbite.edu'] }
      });
      await db.collection(COLLECTIONS.ORDERS).deleteMany({
        customerEmail: { $in: ['aarav.patel@campusbite.edu', 'diya.sharma@campusbite.edu', 'canteen.admin@campusbite.edu'] }
      });
    }
  } catch (_) {}

  // Fetch active menu items for test fixtures
  const menuService = require('../server/services/menuService');
  const allMenuItems = await menuService.getAllItems();
  const primaryItem = allMenuItems.find(i => i.name.includes('Paneer')) || allMenuItems[0] || inMemoryMenuItems[0];
  const secondaryItem = allMenuItems.find(i => String(i._id) !== String(primaryItem._id)) || allMenuItems[1] || inMemoryMenuItems[1];

  try {
    // Register Student A
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Aarav Patel',
      email: 'aarav.patel@campusbite.edu',
      password: 'StudentPassword123!',
      confirmPassword: 'StudentPassword123!'
    });
    recordTest('Student Registration with Valid Details', 'AUTH', regRes.statusCode === 201, `Status ${regRes.statusCode}`);

    // Login Student A
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'aarav.patel@campusbite.edu',
      password: 'StudentPassword123!'
    });
    studentCookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0].split(';')[0] : null;
    recordTest('Student Login & Session Cookie Generation', 'AUTH', loginRes.statusCode === 200 && !!studentCookie, `Cookie: ${studentCookie ? 'Received' : 'Missing'}`);

    // Register & Login Student B (for ownership cross-check tests)
    await makeRequest('POST', '/api/auth/register', {
      name: 'Diya Sharma',
      email: 'diya.sharma@campusbite.edu',
      password: 'StudentPassword123!',
      confirmPassword: 'StudentPassword123!'
    });
    const loginB = await makeRequest('POST', '/api/auth/login', {
      email: 'diya.sharma@campusbite.edu',
      password: 'StudentPassword123!'
    });
    otherStudentCookie = loginB.headers['set-cookie'] ? loginB.headers['set-cookie'][0].split(';')[0] : null;

    // Create and login Administrator (simulating setup-admin.js)
    const bcrypt = require('bcryptjs');
    const userService = require('../server/services/userService');
    const existingAdmin = await userService.findByEmail('canteen.admin@campusbite.edu');
    if (!existingAdmin) {
      const adminHash = await bcrypt.hash('AdminPassword123!', 10);
      await userService.createUser({
        name: 'Head Chef Administrator',
        email: 'canteen.admin@campusbite.edu',
        passwordHash: adminHash,
        role: 'admin'
      });
    }
    const adminLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'canteen.admin@campusbite.edu',
      password: 'AdminPassword123!'
    });
    adminCookie = adminLogin.headers['set-cookie'] ? adminLogin.headers['set-cookie'][0].split(';')[0] : null;
    recordTest('Administrator Account Setup & Login', 'AUTH', adminLogin.statusCode === 200 && !!adminCookie, 'Admin session authenticated');
  } catch (err) {
    recordTest('Authentication Setup Suite', 'AUTH', false, err.message);
  }

  // ─── 5. TASK 06: Order Creation & Pricing Integrity Tests ─────────
  let createdOrderId = null;
  let createdOrderNumber = null;

  try {
    // 5.1 Unauthenticated order placement must be rejected (401)
    const unauthOrder = await makeRequest('POST', '/api/orders', {
      items: [{ menuItemId: primaryItem._id, quantity: 1 }]
    });
    recordTest('Order Creation: Unauthenticated request rejected (401)', 'ORDER_ENGINE', unauthOrder.statusCode === 401, `Status ${unauthOrder.statusCode}`);

    // 5.2 Invalid item ID must be rejected (400)
    const invalidItemRes = await makeRequest('POST', '/api/orders', {
      items: [{ menuItemId: '60d5ecb8b5c9c62b3c7c9999', quantity: 1 }]
    }, {}, studentCookie);
    recordTest('Order Creation: Non-existent item ID rejected (400)', 'ORDER_ENGINE', invalidItemRes.statusCode === 400, `Status ${invalidItemRes.statusCode}`);

    // 5.3 Unavailable/Sold out item must be rejected (400)
    let unavailableItem = allMenuItems.find(i => i.isAvailable === false);
    let tempToggled = false;
    if (!unavailableItem && allMenuItems.length > 2) {
      unavailableItem = allMenuItems[allMenuItems.length - 1];
      await menuService.toggleAvailability(unavailableItem._id, false);
      tempToggled = true;
    } else if (!unavailableItem) {
      unavailableItem = inMemoryMenuItems[5];
    }

    const unavailableRes = await makeRequest('POST', '/api/orders', {
      items: [{ menuItemId: unavailableItem._id, quantity: 1 }]
    }, {}, studentCookie);
    recordTest('Order Creation: Unavailable/Sold out item rejected (400)', 'ORDER_ENGINE', unavailableRes.statusCode === 400, `Status ${unavailableRes.statusCode}`);

    if (tempToggled && unavailableItem) {
      await menuService.toggleAvailability(unavailableItem._id, true);
    }

    // 5.4 Invalid quantity: negative, 0, or > 20
    const invalidQtyRes = await makeRequest('POST', '/api/orders', {
      items: [{ menuItemId: primaryItem._id, quantity: 0 }]
    }, {}, studentCookie);
    recordTest('Order Creation: Quantity < 1 rejected (400)', 'ORDER_ENGINE', invalidQtyRes.statusCode === 400, `Status ${invalidQtyRes.statusCode}`);

    const excessiveQtyRes = await makeRequest('POST', '/api/orders', {
      items: [{ menuItemId: primaryItem._id, quantity: 50 }]
    }, {}, studentCookie);
    recordTest('Order Creation: Excessive quantity > 20 rejected (400)', 'ORDER_ENGINE', excessiveQtyRes.statusCode === 400, `Status ${excessiveQtyRes.statusCode}`);

    // 5.5 Price manipulation attack: client passes fake cheap price
    // Server must IGNORE client-submitted price and calculate exact price from DB
    const itemUnitPrice = Number(primaryItem.price);
    const expectedSubtotal = itemUnitPrice * 2;
    const expectedTax = Math.round(expectedSubtotal * 0.05 * 100) / 100;
    const expectedFee = 10;
    const expectedTotal = Math.round((expectedSubtotal + expectedTax + expectedFee) * 100) / 100;

    const priceAttackRes = await makeRequest('POST', '/api/orders', {
      items: [{ menuItemId: primaryItem._id, quantity: 2, price: 1.00 }], // malicious manipulated price
      clientTotal: 5.00,
      paymentMethod: 'Cash at Counter',
      notes: 'No spicy sauce'
    }, {}, studentCookie);

    const priceOrder = priceAttackRes.json?.order;
    const isPriceCalculatedServerSide = priceAttackRes.statusCode === 201 &&
      priceOrder &&
      priceOrder.subtotal === expectedSubtotal &&
      priceOrder.tax === expectedTax &&
      priceOrder.campusFee === expectedFee &&
      priceOrder.totalAmount === expectedTotal &&
      priceOrder.status === 'Placed' &&
      priceOrder.paymentStatus === 'Pending';

    recordTest(
      'Order Creation: Server-side pricing enforcement (Client price ignored)',
      'ORDER_ENGINE',
      isPriceCalculatedServerSide,
      `Calculated: Subtotal=₹${priceOrder?.subtotal}, Tax=₹${priceOrder?.tax}, Total=₹${priceOrder?.totalAmount}`
    );

    createdOrderId = priceOrder?._id;
    createdOrderNumber = priceOrder?.orderNumber;

    // 5.6 Idempotency Key Duplicate Submission Prevention
    const idempKey = 'test_idemp_key_999';
    const firstReq = await makeRequest('POST', '/api/orders', {
      items: [{ menuItemId: secondaryItem._id, quantity: 1 }],
      idempotencyKey: idempKey
    }, {}, studentCookie);

    const duplicateReq = await makeRequest('POST', '/api/orders', {
      items: [{ menuItemId: secondaryItem._id, quantity: 1 }],
      idempotencyKey: idempKey
    }, {}, studentCookie);

    const isDuplicateHandled = duplicateReq.statusCode === 200 &&
      duplicateReq.json?.duplicate === true &&
      duplicateReq.json?.order?.orderNumber === firstReq.json?.order?.orderNumber;

    recordTest(
      'Order Creation: Idempotency Protection (Duplicate checkout prevented)',
      'ORDER_ENGINE',
      isDuplicateHandled,
      `Duplicate detected: order #${duplicateReq.json?.order?.orderNumber}`
    );
  } catch (err) {
    recordTest('Order Creation & Pricing Integrity Suite', 'ORDER_ENGINE', false, err.message);
  }

  // ─── 6. TASK 07: Student Order Management & Ownership ─────────────
  try {
    // 6.1 Get my orders
    const myOrdersRes = await makeRequest('GET', '/api/orders/my', null, {}, studentCookie);
    const myOrders = myOrdersRes.json?.orders;
    const hasMyOrders = myOrdersRes.statusCode === 200 && Array.isArray(myOrders) && myOrders.length >= 2;
    recordTest('Student Orders: GET /api/orders/my retrieves student orders', 'STUDENT_ORDERS', hasMyOrders, `Found ${myOrders?.length} orders`);

    // 6.2 Get order by orderNumber (owner access allowed)
    const getByNumRes = await makeRequest('GET', `/api/orders/number/${createdOrderNumber}`, null, {}, studentCookie);
    const isOwnerViewOk = getByNumRes.statusCode === 200 && getByNumRes.json?.order?.orderNumber === createdOrderNumber;
    recordTest('Student Orders: Owner can view order by orderNumber', 'STUDENT_ORDERS', isOwnerViewOk, `Order #${createdOrderNumber}`);

    // 6.3 Security Check: Other student accessing another student's order (MUST BE REJECTED 403)
    const crossAccessRes = await makeRequest('GET', `/api/orders/number/${createdOrderNumber}`, null, {}, otherStudentCookie);
    const isCrossAccessBlocked = crossAccessRes.statusCode === 403;
    recordTest('Security: Student blocked from viewing another student’s order (403)', 'SECURITY', isCrossAccessBlocked, `Status ${crossAccessRes.statusCode}`);

    // 6.4 Valid Order Cancellation (when status is 'Placed')
    const cancelRes = await makeRequest('POST', `/api/orders/${createdOrderId}/cancel`, {}, {}, studentCookie);
    const isCancelled = cancelRes.statusCode === 200 && cancelRes.json?.order?.status === 'Cancelled';
    recordTest('Order Cancellation: Student can cancel order in Placed status', 'STUDENT_ORDERS', isCancelled, `Status transitioned to Cancelled`);

    // 6.5 Cancel already cancelled order (must fail)
    const cancelAgainRes = await makeRequest('POST', `/api/orders/${createdOrderId}/cancel`, {}, {}, studentCookie);
    recordTest('Order Cancellation: Re-cancelling cancelled order rejected (400)', 'STUDENT_ORDERS', cancelAgainRes.statusCode === 400, `Status ${cancelAgainRes.statusCode}`);
  } catch (err) {
    recordTest('Student Order Management Suite', 'STUDENT_ORDERS', false, err.message);
  }

  // ─── 7. TASK 08: Admin Order Operations & State Machine ───────────
  let testOrderForTransitions = null;

  try {
    // Place a fresh order to test lifecycle transitions
    const freshOrderRes = await makeRequest('POST', '/api/orders', {
      items: [{ menuItemId: primaryItem._id, quantity: 1 }]
    }, {}, studentCookie);
    testOrderForTransitions = freshOrderRes.json?.order;

    // 7.1 Student attempting admin route must be rejected (403)
    const studentAsAdmin = await makeRequest('GET', '/api/admin/orders', null, {}, studentCookie);
    recordTest('Authorization: Student blocked from /api/admin/orders (403)', 'ADMIN_OPS', studentAsAdmin.statusCode === 403, `Status ${studentAsAdmin.statusCode}`);

    // For testing admin operations, grant admin role to our admin user session
    const { inMemoryOrders } = require('../server/config/mockStore');
    // Ensure admin user session has role 'admin'
    // Let's create an admin session helper via login request
    const adminUserDoc = {
      id: 'admin_test_user_id',
      name: 'Head Chef Administrator',
      email: 'canteen.admin@campusbite.edu',
      role: 'admin'
    };

    // 7.2 State Machine Valid Transitions: Placed -> Preparing -> Ready -> Completed
    const orderService = require('../server/services/orderService');

    // Placed -> Preparing
    const prepOrder = await orderService.updateOrderStatus(testOrderForTransitions.orderNumber, 'Preparing');
    recordTest('State Machine: Placed ➔ Preparing transition valid', 'STATE_MACHINE', prepOrder.status === 'Preparing');

    // 7.3 Invalid Cancellation: Cannot cancel after preparation has started!
    let cancelAfterPrepFailed = false;
    try {
      await orderService.cancelOrder(testOrderForTransitions.orderNumber, { id: testOrderForTransitions.userId, role: 'student' });
    } catch (e) {
      cancelAfterPrepFailed = e.statusCode === 400 && e.message.toLowerCase().includes('kitchen preparation has already commenced');
    }
    recordTest('Security: Cancellation blocked once preparation has started (400)', 'SECURITY', cancelAfterPrepFailed, 'Preparation locked');

    // Preparing -> Ready
    const readyOrder = await orderService.updateOrderStatus(testOrderForTransitions.orderNumber, 'Ready');
    recordTest('State Machine: Preparing ➔ Ready transition valid', 'STATE_MACHINE', readyOrder.status === 'Ready');

    // Ready -> Completed
    const compOrder = await orderService.updateOrderStatus(testOrderForTransitions.orderNumber, 'Completed');
    recordTest(
      'State Machine: Ready ➔ Completed transition valid (Auto-settles payment to Paid)',
      'STATE_MACHINE',
      compOrder.status === 'Completed' && compOrder.paymentStatus === 'Paid'
    );

    // 7.4 Invalid Re-opening: Cannot transition Completed -> Preparing
    let reopenFailed = false;
    try {
      await orderService.updateOrderStatus(testOrderForTransitions.orderNumber, 'Preparing');
    } catch (e) {
      reopenFailed = e.statusCode === 400 && e.message.includes('Invalid status transition');
    }
    recordTest('State Machine: Completed order cannot be reopened (Terminal state)', 'STATE_MACHINE', reopenFailed, 'Re-opening prevented');

    // 7.5 Payment Status Update: Mark Payment Paid
    const freshOrder2 = await orderService.createOrder({
      userId: 'test_user_2',
      customerName: 'Samir',
      items: [{ menuItemId: secondaryItem._id, quantity: 1 }]
    });
    const paidOrder = await orderService.updatePaymentStatus(freshOrder2.order.orderNumber, 'Paid');
    recordTest('Admin Operations: Mark payment as Paid', 'ADMIN_OPS', paidOrder.paymentStatus === 'Paid');
  } catch (err) {
    recordTest('Admin Order Operations Suite', 'ADMIN_OPS', false, err.message);
  }

  // ─── 8. TASK 09: Analytics & Smart Preparation Time ───────────────
  try {
    const orderService = require('../server/services/orderService');
    const analytics = await orderService.getDashboardAnalytics();

    const hasMetrics = analytics &&
      typeof analytics.metrics.totalOrders === 'number' &&
      typeof analytics.metrics.grossOrderValue === 'number' &&
      typeof analytics.metrics.totalCollectedRevenue === 'number' &&
      typeof analytics.metrics.activeKitchenOrders === 'number';

    recordTest(
      'Analytics: Real dashboard metrics calculation (Gross vs Collected Revenue)',
      'ANALYTICS',
      hasMetrics,
      `Total: ${analytics?.metrics.totalOrders}, Collected: ₹${analytics?.metrics.totalCollectedRevenue}`
    );

    const hasPopular = Array.isArray(analytics?.popularProducts);
    recordTest('Analytics: Popular food calculation from order items', 'ANALYTICS', hasPopular, `Found ${analytics?.popularProducts.length} top products`);

    const hasTrends = Array.isArray(analytics?.dailyTrends) && analytics.dailyTrends.length === 7;
    recordTest('Analytics: 7-day revenue trajectory breakdown', 'ANALYTICS', hasTrends, '7 daily buckets calculated');

    // 8.2 Smart Preparation Time Algorithm Verification
    // Single item (prepTime 12) with 0 active orders in queue
    const t1 = calculateEstimatedPrepTime([{ preparationTime: 12, quantity: 1 }], 0);
    // 3 items (prepTime 15, total qty 4) with 3 active orders in queue:
    // Base = 15. Batch overhead = min((4-1)*1.5, 8) = 4.5. Queue delay = min(3*2.5, 25) = 7.5.
    // Total = 15 + 4.5 + 7.5 = 27 mins.
    const t2 = calculateEstimatedPrepTime([
      { preparationTime: 15, quantity: 2 },
      { preparationTime: 10, quantity: 2 }
    ], 3);

    const isFormulaAccurate = t1 === 12 && t2 === 27;
    recordTest(
      'Smart Preparation Algorithm: Transparent formula verification (Viva Ready)',
      'SMART_FEATURES',
      isFormulaAccurate,
      `Single item: ${t1}m | Multi-item + queue: ${t2}m`
    );
  } catch (err) {
    recordTest('Analytics & Smart Features Suite', 'ANALYTICS', false, err.message);
  }

  // ─── 9. Document Validators Tests ─────────────────────────────────
  try {
    const validOrder = validateOrderDocument({
      orderNumber: 'CB-883921',
      userId: 'user_123',
      items: [{ menuItemId: 'item_1', name: 'Veg Burger', price: 99, quantity: 2 }],
      totalAmount: 218.4,
      paymentMethod: 'Cash at Counter',
      paymentStatus: 'Pending',
      status: 'Placed'
    });
    recordTest('Validator: Valid order document matches schema', 'VALIDATORS', validOrder.isValid);

    const badOrder = validateOrderDocument({
      orderNumber: 'CB-883921',
      userId: 'user_123',
      items: [], // empty items
      totalAmount: 0
    });
    recordTest('Validator: Reject empty items in order document', 'VALIDATORS', !badOrder.isValid);
  } catch (err) {
    recordTest('Document Validators Suite', 'VALIDATORS', false, err.message);
  }

  // ─── 10. Frontend Delivery & Route Integrity Tests ────────────────
  const pages = [
    { url: '/index.html', title: 'Home' },
    { url: '/menu.html', title: 'Menu' },
    { url: '/cart.html', title: 'Cart' },
    { url: '/checkout.html', title: 'Checkout' },
    { url: '/orders.html', title: 'Orders' },
    { url: '/tracking.html', title: 'Tracking' },
    { url: '/login.html', title: 'Login' },
    { url: '/register.html', title: 'Register' }
  ];

  for (const page of pages) {
    try {
      const res = await makeRequest('GET', page.url);
      const isOk = res.statusCode === 200 && res.body.includes('CampusBite');
      recordTest(`Frontend Page: ${page.title} (${page.url})`, 'FRONTEND', isOk, `Status ${res.statusCode}`);
    } catch (err) {
      recordTest(`Frontend Page: ${page.title}`, 'FRONTEND', false, err.message);
    }
  }

  // ─── Finish & Summary ─────────────────────────────────────────────
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = total - passedCount;

  console.log('\n======================================================');
  console.log(`TEST SUITE SUMMARY: ${passedCount}/${total} PASSED (${failedCount} FAILED)`);
  console.log('======================================================\n');

  // Post-test cleanup of test data from MongoDB
  try {
    const { isConnected, getDB, COLLECTIONS } = require('../server/config/database');
    if (isConnected()) {
      const db = getDB();
      await db.collection(COLLECTIONS.USERS).deleteMany({
        email: { $in: ['aarav.patel@campusbite.edu', 'diya.sharma@campusbite.edu', 'canteen.admin@campusbite.edu'] }
      });
      await db.collection(COLLECTIONS.ORDERS).deleteMany({
        customerEmail: { $in: ['aarav.patel@campusbite.edu', 'diya.sharma@campusbite.edu', 'canteen.admin@campusbite.edu'] }
      });
    }
  } catch (_) {}

  server.close(() => {
    process.exit(failedCount > 0 ? 1 : 0);
  });
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  if (server) server.close();
  process.exit(1);
});
