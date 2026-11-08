'use strict';

/**
 * CampusBite — End-to-End User Journeys & Workflows Test
 * Verifies all 8 workflows specified in Task Sprint 2
 */

const http = require('http');
const app = require('../server');
const bcrypt = require('bcryptjs');
const userService = require('../server/services/userService');
const { inMemoryMenuItems } = require('../server/config/mockStore');

let server;
let baseUrl;
const PORT = 5077;

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
        } catch (e) {}
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

async function runE2E() {
  console.log('\n======================================================');
  console.log('       CAMPUSBITE END-TO-END WORKFLOW SUITE          ');
  console.log('======================================================\n');

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(PORT, () => {
      baseUrl = `http://localhost:${PORT}`;
      resolve();
    });
  });

  let allPassed = true;

  try {
    // Pre-test cleanup of previous E2E test users
    try {
      const { connectDB, COLLECTIONS } = require('../server/config/database');
      if (process.env.MONGODB_URI) {
        const db = await connectDB();
        await db.collection(COLLECTIONS.USERS).deleteMany({
          email: { $in: ['rohan.sharma@campusbite.edu', 'sneha.roy@campusbite.edu', 'chef.supervisor@campusbite.edu'] }
        });
        await db.collection(COLLECTIONS.ORDERS).deleteMany({
          customerEmail: { $in: ['rohan.sharma@campusbite.edu', 'sneha.roy@campusbite.edu'] }
        });
      }
    } catch (_) {}

    // ─── WORKFLOW 1: Student Order Journey ────────────────────────────
    console.log('--- WORKFLOW 1: Student Order Journey ---');
    // 1. Register & Login student
    await makeRequest('POST', '/api/auth/register', {
      name: 'Rohan Sharma',
      email: 'rohan.sharma@campusbite.edu',
      password: 'RohanPassword123!',
      confirmPassword: 'RohanPassword123!'
    });
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'rohan.sharma@campusbite.edu',
      password: 'RohanPassword123!'
    });
    const rohanCookie = loginRes.headers['set-cookie'][0].split(';')[0];

    // 2. Browse menu
    const menuRes = await makeRequest('GET', '/api/menu');
    const menuItems = menuRes.json?.items || inMemoryMenuItems;

    // 3. Place order with 2x Paneer Burger (₹129 ea) + 1x Cold Coffee (₹85)
    // Expected Subtotal: 129*2 + 85 = 343. GST (5%): 17.15. Fee: 10. Total: 370.15
    const orderRes = await makeRequest('POST', '/api/orders', {
      items: [
        { menuItemId: menuItems[0]._id, quantity: 2 },
        { menuItemId: menuItems[4]._id, quantity: 1 }
      ],
      paymentMethod: 'Cash at Counter',
      notes: 'Make it fast please'
    }, {}, rohanCookie);

    const wf1Order = orderRes.json?.order;
    const wf1Ok = orderRes.statusCode === 201 && wf1Order && wf1Order.orderNumber && wf1Order.status === 'Placed';
    console.log(wf1Ok ? '✅ PASS: Workflow 1 — Order created with token #' + wf1Order?.orderNumber : '❌ FAIL: Workflow 1');
    if (!wf1Ok) allPassed = false;

    // ─── WORKFLOW 2: Student Order History & Tracking ─────────────────
    console.log('\n--- WORKFLOW 2: Student Order History & Tracking ---');
    const myOrdersRes = await makeRequest('GET', '/api/orders/my', null, {}, rohanCookie);
    const trackingRes = await makeRequest('GET', `/api/orders/number/${wf1Order.orderNumber}`, null, {}, rohanCookie);

    const wf2Ok = myOrdersRes.statusCode === 200 &&
      trackingRes.statusCode === 200 &&
      trackingRes.json?.order?.orderNumber === wf1Order.orderNumber &&
      trackingRes.json?.order?.status === 'Placed';

    console.log(wf2Ok ? '✅ PASS: Workflow 2 — Order history & live tracking verified' : '❌ FAIL: Workflow 2');
    if (!wf2Ok) allPassed = false;

    // ─── WORKFLOW 3: Administrator Status Lifecycle ───────────────────
    console.log('\n--- WORKFLOW 3: Administrator Status Lifecycle ---');
    // Ensure admin user exists
    const existingAdmin = await userService.findByEmail('chef.supervisor@campusbite.edu');
    if (!existingAdmin) {
      const adminHash = await bcrypt.hash('ChefPassword123!', 10);
      await userService.createUser({
        name: 'Chef Supervisor',
        email: 'chef.supervisor@campusbite.edu',
        passwordHash: adminHash,
        role: 'admin'
      });
    }
    const adminLoginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'chef.supervisor@campusbite.edu',
      password: 'ChefPassword123!'
    });
    const chefAdminCookie = adminLoginRes.headers['set-cookie'][0].split(';')[0];

    // Chef marks Preparing
    const prepRes = await makeRequest('PATCH', `/api/admin/orders/${wf1Order.orderNumber}/status`, {
      status: 'Preparing'
    }, {}, chefAdminCookie);

    // Chef marks Ready
    const readyRes = await makeRequest('PATCH', `/api/admin/orders/${wf1Order.orderNumber}/status`, {
      status: 'Ready'
    }, {}, chefAdminCookie);

    // Chef marks Completed
    const compRes = await makeRequest('PATCH', `/api/admin/orders/${wf1Order.orderNumber}/status`, {
      status: 'Completed'
    }, {}, chefAdminCookie);

    const wf3Ok = prepRes.statusCode === 200 &&
      readyRes.statusCode === 200 &&
      compRes.statusCode === 200 &&
      compRes.json?.order?.status === 'Completed' &&
      compRes.json?.order?.paymentStatus === 'Paid';

    console.log(wf3Ok ? '✅ PASS: Workflow 3 — Order transitioned: Placed ➔ Preparing ➔ Ready ➔ Completed' : '❌ FAIL: Workflow 3');
    if (!wf3Ok) allPassed = false;

    // ─── WORKFLOW 4: Student Refreshes Tracking ───────────────────────
    console.log('\n--- WORKFLOW 4: Student Tracking Real-Time Reflection ---');
    const studentPolled = await makeRequest('GET', `/api/orders/number/${wf1Order.orderNumber}`, null, {}, rohanCookie);
    const wf4Ok = studentPolled.statusCode === 200 && studentPolled.json?.order?.status === 'Completed';
    console.log(wf4Ok ? '✅ PASS: Workflow 4 — Student tracking immediately sees Completed status' : '❌ FAIL: Workflow 4');
    if (!wf4Ok) allPassed = false;

    // ─── WORKFLOW 5: Administrator Counter Payment Update ─────────────
    console.log('\n--- WORKFLOW 5: Administrator Payment Collection ---');
    // Create another pending order
    const o2Res = await makeRequest('POST', '/api/orders', {
      items: [{ menuItemId: menuItems[1]._id, quantity: 1 }],
      paymentMethod: 'UPI at Counter'
    }, {}, rohanCookie);
    const o2 = o2Res.json?.order;

    const payRes = await makeRequest('PATCH', `/api/admin/orders/${o2.orderNumber}/payment`, {
      paymentStatus: 'Paid'
    }, {}, chefAdminCookie);

    const wf5Ok = payRes.statusCode === 200 && payRes.json?.order?.paymentStatus === 'Paid';
    console.log(wf5Ok ? '✅ PASS: Workflow 5 — Counter payment verified and marked Paid' : '❌ FAIL: Workflow 5');
    if (!wf5Ok) allPassed = false;

    // ─── WORKFLOW 6: Unauthorized Cross-Student Access Block ──────────
    console.log('\n--- WORKFLOW 6: Cross-Student Privacy Enforcement ---');
    // Register another student Sneha
    await makeRequest('POST', '/api/auth/register', {
      name: 'Sneha Roy',
      email: 'sneha.roy@campusbite.edu',
      password: 'SnehaPassword123!',
      confirmPassword: 'SnehaPassword123!'
    });
    const snehaLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'sneha.roy@campusbite.edu',
      password: 'SnehaPassword123!'
    });
    const snehaCookie = snehaLogin.headers['set-cookie'][0].split(';')[0];

    // Sneha attempts to view Rohan's order
    const eavesdropRes = await makeRequest('GET', `/api/orders/number/${wf1Order.orderNumber}`, null, {}, snehaCookie);
    const wf6Ok = eavesdropRes.statusCode === 403;
    console.log(wf6Ok ? '✅ PASS: Workflow 6 — Unauthorized student blocked from other orders (403)' : '❌ FAIL: Workflow 6');
    if (!wf6Ok) allPassed = false;

    // ─── WORKFLOW 7: Price Manipulation Tampering Prevention ──────────
    console.log('\n--- WORKFLOW 7: Price Tampering Prevention ---');
    // Sneha attempts to buy item for fake price ₹1.00
    const targetItem = menuItems.find(i => i.name.includes('Pizza')) || menuItems[0];
    const tamperRes = await makeRequest('POST', '/api/orders', {
      items: [{ menuItemId: targetItem._id, quantity: 1, price: 1.00 }],
      totalAmount: 1.00
    }, {}, snehaCookie);

    const tamperedOrder = tamperRes.json?.order;
    const expectedSubtotal = Number(targetItem.price);
    const expectedTax = Math.round(expectedSubtotal * 0.05 * 100) / 100;
    const expectedTotal = Math.round((expectedSubtotal + expectedTax + 10) * 100) / 100;

    const wf7Ok = tamperRes.statusCode === 201 &&
      tamperedOrder &&
      tamperedOrder.subtotal === expectedSubtotal &&
      tamperedOrder.totalAmount === expectedTotal;

    console.log(wf7Ok ? `✅ PASS: Workflow 7 — Tampered price ₹1 rejected, genuine total ₹${tamperedOrder?.totalAmount} enforced` : '❌ FAIL: Workflow 7');
    if (!wf7Ok) allPassed = false;

    // ─── WORKFLOW 8: Idempotent Duplicate Submission Prevention ───────
    console.log('\n--- WORKFLOW 8: Duplicate Checkout Prevention ---');
    const testIdempKey = 'wf8_unique_key_123';
    const click1 = await makeRequest('POST', '/api/orders', {
      items: [{ menuItemId: menuItems[0]._id, quantity: 1 }],
      idempotencyKey: testIdempKey
    }, {}, snehaCookie);

    const click2 = await makeRequest('POST', '/api/orders', {
      items: [{ menuItemId: menuItems[0]._id, quantity: 1 }],
      idempotencyKey: testIdempKey
    }, {}, snehaCookie);

    const wf8Ok = click1.statusCode === 201 &&
      click2.statusCode === 200 &&
      click2.json?.duplicate === true &&
      click1.json?.order?.orderNumber === click2.json?.order?.orderNumber;

    console.log(wf8Ok ? `✅ PASS: Workflow 8 — Double-click prevented, single order #${click1.json?.order?.orderNumber} returned` : '❌ FAIL: Workflow 8');
    if (!wf8Ok) allPassed = false;

  } catch (err) {
    console.error('Fatal E2E test failure:', err);
    allPassed = false;
  } finally {
    try {
      const { isConnected, getDB, COLLECTIONS } = require('../server/config/database');
      if (isConnected()) {
        const db = getDB();
        await db.collection(COLLECTIONS.USERS).deleteMany({
          email: { $in: ['rohan.sharma@campusbite.edu', 'sneha.roy@campusbite.edu', 'chef.supervisor@campusbite.edu'] }
        });
        await db.collection(COLLECTIONS.ORDERS).deleteMany({
          customerEmail: { $in: ['rohan.sharma@campusbite.edu', 'sneha.roy@campusbite.edu'] }
        });
      }
    } catch (_) {}

    server.close(() => {
      console.log('\n======================================================');
      console.log(allPassed ? 'ALL 8 END-TO-END WORKFLOWS PASSED PERFECTLY!' : 'SOME WORKFLOWS FAILED');
      console.log('======================================================\n');
      process.exit(allPassed ? 0 : 1);
    });
  }
}

runE2E();
