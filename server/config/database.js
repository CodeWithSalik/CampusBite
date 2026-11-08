'use strict';

const { MongoClient } = require('mongodb');

let client = null;
let db = null;

/**
 * Connect to MongoDB Atlas using the official MongoDB Node.js driver.
 * Reuses the existing connection if already connected.
 *
 * @returns {Promise<import('mongodb').Db>} The database instance.
 */
async function connectDB() {
  if (db) {
    return db;
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'campusbite';

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined. Set it in your .env file.'
    );
  }

  try {
    client = new MongoClient(uri);
    await client.connect();

    // Verify the connection with a ping
    await client.db(dbName).command({ ping: 1 });

    db = client.db(dbName);
    console.log(`[DB] Connected to MongoDB — database: ${dbName}`);
    return db;
  } catch (err) {
    // Reset state so a retry can attempt a fresh connection
    client = null;
    db = null;
    console.error('[DB] MongoDB connection failed:', err.message);
    throw err;
  }
}

/**
 * Return the cached database instance.
 * Throws if connectDB() has not been called yet.
 *
 * @returns {import('mongodb').Db}
 */
function getDB() {
  if (!db) {
    throw new Error(
      'Database not initialised. Call connectDB() first.'
    );
  }
  return db;
}

/**
 * Gracefully close the MongoDB connection.
 */
async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[DB] MongoDB connection closed.');
  }
}

module.exports = { connectDB, getDB, closeDB };
