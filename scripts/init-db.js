'use strict';

require('dotenv').config();
const { connectDB, closeDB, COLLECTIONS } = require('../server/config/database');

/**
 * Non-destructive database initialization script.
 * Creates essential indexes and verifies collections.
 */
async function initDatabase() {
  console.log('─── CampusBite Database Initialization ───');
  
  if (!process.env.MONGODB_URI) {
    console.error('[Error] MONGODB_URI is not defined in environment variables or .env file.');
    console.error('Please configure your MongoDB Atlas connection string before running init-db.');
    process.exit(1);
  }

  try {
    const db = await connectDB();
    console.log('[Init] Database connected successfully.');

    // 1. Users collection indexes
    console.log('[Init] Setting up indexes for "users" collection...');
    const usersCollection = db.collection(COLLECTIONS.USERS);
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    console.log('  ✓ Unique index on users.email established');

    // 2. Menu Items collection indexes
    console.log('[Init] Setting up indexes for "menuItems" collection...');
    const menuCollection = db.collection(COLLECTIONS.MENU_ITEMS);
    await menuCollection.createIndex({ category: 1 });
    await menuCollection.createIndex({ isAvailable: 1 });
    console.log('  ✓ Index on menuItems.category established');
    console.log('  ✓ Index on menuItems.isAvailable established');

    // 3. Orders collection indexes
    console.log('[Init] Setting up indexes for "orders" collection...');
    const ordersCollection = db.collection(COLLECTIONS.ORDERS);
    await ordersCollection.createIndex({ orderNumber: 1 }, { unique: true });
    await ordersCollection.createIndex({ userId: 1 });
    await ordersCollection.createIndex({ createdAt: -1 });
    console.log('  ✓ Unique index on orders.orderNumber established');
    console.log('  ✓ Index on orders.userId established');
    console.log('  ✓ Index on orders.createdAt established');

    // Report status
    const collections = await db.listCollections().toArray();
    console.log('[Init] Active collections in database:');
    collections.forEach(c => console.log(`  - ${c.name}`));

    console.log('[Init] Database initialization completed successfully without data loss.');
  } catch (err) {
    console.error('[Init] Initialization failed:', err.message);
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
