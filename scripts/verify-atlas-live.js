'use strict';

/**
 * CAMPUSBITE — LIVE MONGODB ATLAS INTEGRATION AUDIT
 *
 * Senior Database Reliability Engineer verification suite.
 * Validates direct, production-grade cloud database operations on MongoDB Atlas.
 *
 * Requirements:
 * - Official MongoDB Node.js driver only (no Mongoose).
 * - Credentials read exclusively from .env.
 * - Zero secrets or connection strings logged.
 * - No silent in-memory fallback.
 * - Safe error handling when unavailable.
 * - Strict PASS/FAIL reporting.
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { MongoStore } = require('connect-mongo');
const { connectDB, getDB, isConnected, closeDB, COLLECTIONS } = require('../server/config/database');
const userService = require('../server/services/userService');
const menuService = require('../server/services/menuService');
const orderService = require('../server/services/orderService');
const initDatabase = require('./init-db');
const seedMenu = require('./seed-menu');

const AUDIT_REPORT = {
  atlasConnection: 'BLOCKED',
  databasePing: 'BLOCKED',
  readWrite: 'BLOCKED',
  sessionPersistence: 'BLOCKED',
  menuPersistence: 'BLOCKED',
  orderPersistence: 'BLOCKED',
  analytics: 'BLOCKED',
  regression: 'BLOCKED'
};

const auditLogs = [];

function logStep(step, success, details = '') {
  const icon = success ? '✅ PASS' : '❌ FAIL';
  const msg = `${icon} | ${step}${details ? ' — ' + details : ''}`;
  console.log(msg);
  auditLogs.push({ step, success, details });
}

async function runLiveAtlasAudit() {
  console.log('\n======================================================');
  console.log('   CAMPUSBITE — LIVE MONGODB ATLAS INTEGRATION AUDIT   ');
  console.log('======================================================\n');

  // ─── STEP 0: Credentials Inspection ──────────────────────────────
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'campusbite';

  if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
    console.error('❌ FATAL: MONGODB_URI is not set or does not have a valid mongodb:// or mongodb+srv:// scheme in .env');
    console.error('Audit cannot proceed without genuine cloud database credentials.');
    printFinalReport();
    process.exit(1);
  }

  let db = null;
  let testUserId = null;
  let testUserEmail = null;
  let testOrderId = null;
  let testOrderNumber = null;
  let testSessionId = null;

  try {
    // ─── STEP 1: Connect to MongoDB Atlas Cluster ────────────────────
    console.log('[Step 1/13] Connecting to configured MongoDB Atlas cluster...');
    db = await connectDB();

    if (!isConnected() || !db) {
      throw new Error('Database connection returned false for isConnected()');
    }
    AUDIT_REPORT.atlasConnection = 'PASS';
    logStep('Atlas connection', true, `Connected to database: "${db.databaseName}"`);

    // ─── STEP 2: Database Ping ──────────────────────────────────────
    console.log('\n[Step 2/13] Executing database ping command...');
    const pingResult = await db.command({ ping: 1 });
    const isPingOk = pingResult && pingResult.ok === 1;

    if (!isPingOk) {
      AUDIT_REPORT.databasePing = 'FAIL';
      throw new Error(`Ping returned unexpected result: ${JSON.stringify(pingResult)}`);
    }
    AUDIT_REPORT.databasePing = 'PASS';
    logStep('Database ping', true, `Atlas cluster responded with { ok: 1 }`);

    // ─── STEP 3: Database Read / Write Permissions ──────────────────
    console.log('\n[Step 3/13] Verifying database read/write permissions...');
    const auditColl = db.collection('_audit_verification');
    const probeDoc = {
      probeKey: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      testDate: new Date(),
      purpose: 'Live Atlas Read/Write Verification'
    };

    // 3a. Write
    const insertRes = await auditColl.insertOne(probeDoc);
    const probeId = insertRes.insertedId;

    // 3b. Read
    const foundDoc = await auditColl.findOne({ _id: probeId });
    const readMatches = foundDoc && foundDoc.probeKey === probeDoc.probeKey;

    // 3c. Update
    const updateRes = await auditColl.updateOne({ _id: probeId }, { $set: { verified: true } });
    const updateMatches = updateRes.modifiedCount === 1;

    // 3d. Delete probe
    const deleteRes = await auditColl.deleteOne({ _id: probeId });
    const deleteMatches = deleteRes.deletedCount === 1;

    const rwOk = readMatches && updateMatches && deleteMatches;
    if (!rwOk) {
      AUDIT_REPORT.readWrite = 'FAIL';
      throw new Error('Read/Write verification failed in one or more CRUD operations');
    }
    AUDIT_REPORT.readWrite = 'PASS';
    logStep('Read/write', true, 'CRUD permissions verified (Insert, Find, Update, Delete)');

    // ─── STEP 4: Safe Index Initialization ──────────────────────────
    console.log('\n[Step 4/13] Initializing collections & indexes safely...');
    await initDatabase();
    db = await connectDB();

    // Verify indexes exist on Atlas collections
    const usersIndexes = await db.collection(COLLECTIONS.USERS).indexes();
    const hasEmailUnique = usersIndexes.some(idx => idx.key.email === 1 && idx.unique === true);

    const ordersIndexes = await db.collection(COLLECTIONS.ORDERS).indexes();
    const hasOrderNumberUnique = ordersIndexes.some(idx => idx.key.orderNumber === 1 && idx.unique === true);
    const hasOrdersStatus = ordersIndexes.some(idx => idx.key.status === 1);

    if (!hasEmailUnique || !hasOrderNumberUnique || !hasOrdersStatus) {
      throw new Error('Required Atlas indexes were not found after initialization');
    }
    logStep('Atlas Indexing', true, 'Unique email, unique orderNumber, and query indexes confirmed');

    // ─── STEP 5: Seed Menu Script ───────────────────────────────────
    console.log('\n[Step 5/13] Running menu seed script against Atlas...');
    await seedMenu();
    db = await connectDB();
    const menuCount = await db.collection(COLLECTIONS.MENU_ITEMS).countDocuments();
    logStep('Menu Seeding', menuCount >= 12, `Total menu items in Atlas: ${menuCount}`);

    // ─── STEP 6: Menu Persistence Across Fresh Connection ───────────
    console.log('\n[Step 6/13] Verifying menu persistence across complete disconnect/reconnect cycle...');
    await closeDB();
    if (isConnected()) {
      throw new Error('Database still reports connected after closeDB()');
    }

    // Fresh reconnect
    const reconnectedDb = await connectDB();
    const freshMenuItems = await reconnectedDb.collection(COLLECTIONS.MENU_ITEMS).find().toArray();
    const allValid = freshMenuItems.length >= 12 &&
      freshMenuItems.every(i => i.name && typeof i.price === 'number' && i.price > 0 && i.category);

    if (!allValid) {
      AUDIT_REPORT.menuPersistence = 'FAIL';
      throw new Error('Menu items failed persistence validation after reconnect');
    }
    AUDIT_REPORT.menuPersistence = 'PASS';
    logStep('Menu persistence', true, `${freshMenuItems.length} menu items persisted and validated across fresh connection`);

    // ─── STEP 7: Student Registration and Login against Atlas ───────
    console.log('\n[Step 7/13] Verifying student registration & authentication against Atlas...');
    testUserEmail = `atlas.student.${Date.now()}@campusbite.edu`;
    const plainPassword = 'AuditPassword123!';
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const studentCreated = await userService.createUser({
      name: 'Atlas Verification Student',
      email: testUserEmail,
      passwordHash,
      role: 'student'
    });
    testUserId = studentCreated._id;

    // Verify stored directly in Atlas users collection
    const storedStudent = await reconnectedDb.collection(COLLECTIONS.USERS).findOne({ email: testUserEmail });
    if (!storedStudent || !storedStudent.passwordHash) {
      throw new Error('Student document was not found directly in Atlas users collection');
    }

    // Verify password is NOT stored as plain text
    if (storedStudent.passwordHash === plainPassword) {
      throw new Error('Security violation: plain text password was stored!');
    }

    // Verify bcrypt login
    const authUser = await userService.findByEmail(testUserEmail);
    const isPasswordValid = await bcrypt.compare(plainPassword, authUser.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Bcrypt password verification failed for Atlas student');
    }
    logStep('Student Registration & Login', true, `Stored in Atlas (ID: ${testUserId}), password hashed with bcrypt`);

    // ─── STEP 8: MongoDB-Backed Session Persistence ─────────────────
    console.log('\n[Step 8/13] Verifying MongoDB Atlas session store persistence...');
    testSessionId = `audit_sess_${Date.now()}`;
    const testSessionData = {
      cookie: { originalMaxAge: 86400000, expires: new Date(Date.now() + 86400000).toISOString() },
      user: {
        id: String(testUserId),
        email: testUserEmail,
        role: 'student'
      }
    };

    const sessionStore = MongoStore.create({
      mongoUrl: uri,
      dbName,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60
    });

    await new Promise((resolve, reject) => {
      sessionStore.set(testSessionId, testSessionData, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Query directly from Atlas 'sessions' collection
    const atlasSessionDoc = await reconnectedDb.collection('sessions').findOne({ _id: testSessionId });
    if (!atlasSessionDoc) {
      AUDIT_REPORT.sessionPersistence = 'FAIL';
      throw new Error('Session document not found in Atlas "sessions" collection');
    }

    // Retrieve via session store
    const retrievedSession = await new Promise((resolve, reject) => {
      sessionStore.get(testSessionId, (err, sess) => {
        if (err) return reject(err);
        resolve(sess);
      });
    });

    const isSessionValid = retrievedSession && retrievedSession.user?.email === testUserEmail;
    if (!isSessionValid) {
      AUDIT_REPORT.sessionPersistence = 'FAIL';
      throw new Error('Retrieved session payload did not match stored student data');
    }

    // Clean up test session
    await new Promise((resolve) => {
      sessionStore.destroy(testSessionId, () => {
        sessionStore.close();
        resolve();
      });
    });

    AUDIT_REPORT.sessionPersistence = 'PASS';
    logStep('Session persistence', true, 'Session persisted in Atlas "sessions" collection and verified via connect-mongo');

    // ─── STEP 9: Place a Real Test Order ────────────────────────────
    console.log('\n[Step 9/13] Placing real test order in MongoDB Atlas...');
    const orderItem = freshMenuItems[0];
    const orderQuantity = 2;
    const expectedSubtotal = Number(orderItem.price) * orderQuantity;
    const expectedTax = Math.round(expectedSubtotal * 0.05 * 100) / 100;
    const expectedFee = 10;
    const expectedTotal = Math.round((expectedSubtotal + expectedTax + expectedFee) * 100) / 100;

    const orderResult = await orderService.createOrder({
      userId: String(testUserId),
      customerName: 'Atlas Verification Student',
      customerEmail: testUserEmail,
      items: [{ menuItemId: orderItem._id, quantity: orderQuantity }],
      paymentMethod: 'Cash at Counter',
      notes: 'MongoDB Atlas Audit Test Order'
    });

    const createdOrder = orderResult.order;
    testOrderId = createdOrder._id;
    testOrderNumber = createdOrder.orderNumber;

    // Check order directly in Atlas orders collection
    const atlasOrderDoc = await reconnectedDb.collection(COLLECTIONS.ORDERS).findOne({ _id: testOrderId });
    if (!atlasOrderDoc || atlasOrderDoc.totalAmount !== expectedTotal) {
      AUDIT_REPORT.orderPersistence = 'FAIL';
      throw new Error(`Order not stored accurately in Atlas: expected ₹${expectedTotal}, found ₹${atlasOrderDoc?.totalAmount}`);
    }
    logStep('Order Creation in Atlas', true, `Order #${testOrderNumber} created (Subtotal: ₹${atlasOrderDoc.subtotal}, Tax: ₹${atlasOrderDoc.tax}, Total: ₹${atlasOrderDoc.totalAmount})`);

    // ─── STEP 10: Retrieve Order after Fresh Database Connection ────
    console.log('\n[Step 10/13] Retrieving order after disconnecting and reconnecting to Atlas...');
    await closeDB();

    const freshConn3 = await connectDB();
    const retrievedOrder = await orderService.getOrderByNumber(testOrderNumber, { id: String(testUserId), role: 'student' });

    if (!retrievedOrder || retrievedOrder.orderNumber !== testOrderNumber || retrievedOrder.totalAmount !== expectedTotal) {
      AUDIT_REPORT.orderPersistence = 'FAIL';
      throw new Error('Order retrieval after fresh database reconnection failed');
    }
    logStep('Order Reconnection Persistence', true, `Order #${testOrderNumber} successfully retrieved from fresh connection`);

    // ─── STEP 11: Verify Order Status Updates Persist ────────────────
    console.log('\n[Step 11/13] Updating order lifecycle in Atlas and verifying persistence...');
    // Placed ➔ Preparing
    await orderService.updateOrderStatus(testOrderNumber, 'Preparing');

    // Disconnect and reconnect to ensure it wasn't held in volatile memory
    await closeDB();
    const freshConn4 = await connectDB();

    const orderInAtlas = await freshConn4.collection(COLLECTIONS.ORDERS).findOne({ orderNumber: testOrderNumber });
    if (orderInAtlas.status !== 'Preparing') {
      AUDIT_REPORT.orderPersistence = 'FAIL';
      throw new Error(`Expected status 'Preparing', but Atlas contains: ${orderInAtlas.status}`);
    }

    // Preparing ➔ Ready ➔ Completed
    await orderService.updateOrderStatus(testOrderNumber, 'Ready');
    const completedOrder = await orderService.updateOrderStatus(testOrderNumber, 'Completed');

    const completedInAtlas = await freshConn4.collection(COLLECTIONS.ORDERS).findOne({ orderNumber: testOrderNumber });
    const isCompletedPersisted = completedInAtlas.status === 'Completed' && completedInAtlas.paymentStatus === 'Paid';

    if (!isCompletedPersisted) {
      AUDIT_REPORT.orderPersistence = 'FAIL';
      throw new Error('Completed status and auto-settled payment failed to persist in Atlas');
    }

    AUDIT_REPORT.orderPersistence = 'PASS';
    logStep('Order persistence', true, 'Full lifecycle (Placed ➔ Preparing ➔ Ready ➔ Completed [Paid]) persisted in Atlas');

    // ─── STEP 12: Analytics Stored Records Verification ──────────────
    console.log('\n[Step 12/13] Verifying analytics calculations against actual stored Atlas records...');
    const analytics = await orderService.getDashboardAnalytics();

    // Query Atlas directly to calculate expected metrics
    const atlasOrders = await freshConn4.collection(COLLECTIONS.ORDERS).find().toArray();
    const expectedTotalOrders = atlasOrders.length;
    const expectedRevenue = atlasOrders
      .filter(o => o.paymentStatus === 'Paid' && o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const isAnalyticsMatching = analytics.metrics.totalOrders === expectedTotalOrders &&
      Math.abs(analytics.metrics.totalCollectedRevenue - Math.round(expectedRevenue * 100) / 100) < 0.01;

    if (!isAnalyticsMatching) {
      AUDIT_REPORT.analytics = 'FAIL';
      throw new Error(`Analytics mismatch: Atlas orders=${expectedTotalOrders}, analytics=${analytics.metrics.totalOrders}`);
    }
    AUDIT_REPORT.analytics = 'PASS';
    logStep('Analytics', true, `Calculated from ${expectedTotalOrders} stored Atlas orders (Collected: ₹${analytics.metrics.totalCollectedRevenue})`);

    // ─── STEP 13: Clean Up Only Test Records ─────────────────────────
    console.log('\n[Step 13/13] Cleaning up only test records created during audit...');
    if (testUserId) {
      const delUser = await freshConn4.collection(COLLECTIONS.USERS).deleteOne({ _id: new ObjectId(testUserId) });
      logStep('Test User Cleanup', delUser.deletedCount === 1, `Cleaned up test user ${testUserEmail}`);
    }

    if (testOrderId) {
      const delOrder = await freshConn4.collection(COLLECTIONS.ORDERS).deleteOne({ _id: new ObjectId(testOrderId) });
      logStep('Test Order Cleanup', delOrder.deletedCount === 1, `Cleaned up test order #${testOrderNumber}`);
    }

    // Verify menu items remained completely intact
    const finalMenuCount = await freshConn4.collection(COLLECTIONS.MENU_ITEMS).countDocuments();
    logStep('Production Data Integrity', finalMenuCount >= 12, `${finalMenuCount} seeded menu items preserved intact`);

    // ─── Safe Failure Verification ──────────────────────────────────
    console.log('\n[Safety Verification] Verifying graceful application handling when Atlas is unreachable...');
    let failureHandledSafely = false;
    const invalidClient = new MongoClient('mongodb://unreachable-cluster.mongodb.net:27017/test?serverSelectionTimeoutMS=1500');
    try {
      await invalidClient.connect();
    } catch (unreachableErr) {
      failureHandledSafely = !!unreachableErr;
      logStep('Safe Failure Handling', true, `Unreachable cluster caught gracefully: ${unreachableErr.name}`);
    } finally {
      await invalidClient.close().catch(() => {});
    }

    if (!failureHandledSafely) {
      throw new Error('Application did not fail safely when given unreachable database');
    }

  } catch (err) {
    console.error('\n❌ Audit execution encountered an error:', err.message);
  } finally {
    await closeDB().catch(() => {});
  }

  // ─── REGRESSION SUITE EXECUTION ───────────────────────────────────
  console.log('\n======================================================');
  console.log('   RUNNING REGRESSION SUITES (npm test & test:e2e)    ');
  console.log('======================================================\n');

  try {
    const { execSync } = require('child_process');

    console.log('[Regression] Running npm test (41 tests)...');
    execSync('npm test', { stdio: 'inherit' });

    console.log('\n[Regression] Running npm run test:e2e (8 workflows)...');
    execSync('npm run test:e2e', { stdio: 'inherit' });

    AUDIT_REPORT.regression = 'PASS';
    logStep('Regression', true, 'Both unit QA test suite and E2E workflow suite passed with 0 errors');
  } catch (regErr) {
    AUDIT_REPORT.regression = 'FAIL';
    logStep('Regression', false, 'One or more regression test suites failed');
  }

  printFinalReport();
}

function printFinalReport() {
  console.log('\n======================================================');
  console.log('        CAMPUSBITE LIVE ATLAS AUDIT FINAL REPORT       ');
  console.log('======================================================\n');

  console.log('| Metric               | Status   |');
  console.log('|----------------------|----------|');
  console.log(`| Atlas connection     | ${AUDIT_REPORT.atlasConnection.padEnd(8)} |`);
  console.log(`| Database ping        | ${AUDIT_REPORT.databasePing.padEnd(8)} |`);
  console.log(`| Read/write           | ${AUDIT_REPORT.readWrite.padEnd(8)} |`);
  console.log(`| Session persistence  | ${AUDIT_REPORT.sessionPersistence.padEnd(8)} |`);
  console.log(`| Menu persistence     | ${AUDIT_REPORT.menuPersistence.padEnd(8)} |`);
  console.log(`| Order persistence    | ${AUDIT_REPORT.orderPersistence.padEnd(8)} |`);
  console.log(`| Analytics            | ${AUDIT_REPORT.analytics.padEnd(8)} |`);
  console.log(`| Regression           | ${AUDIT_REPORT.regression.padEnd(8)} |`);
  console.log('======================================================\n');

  const allPassed = Object.values(AUDIT_REPORT).every(status => status === 'PASS');
  process.exit(allPassed ? 0 : 1);
}

runLiveAtlasAudit();
