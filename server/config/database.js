'use strict';

const { MongoClient } = require('mongodb');

// Serverless-safe cache attached to global to persist across warm invocations
if (!global._mongoCache) {
  global._mongoCache = {
    client: null,
    db: null,
    promise: null
  };
}

const cache = global._mongoCache;

const COLLECTIONS = {
  USERS: 'users',
  MENU_ITEMS: 'menuItems',
  ORDERS: 'orders'
};

/**
 * Connect to MongoDB Atlas using the official MongoDB Node.js driver.
 * Reuses the existing connection across warm serverless invocations.
 * Deduplicates in-flight connection promises to prevent race conditions.
 *
 * @returns {Promise<import('mongodb').Db>} The database instance.
 */
async function connectDB() {
  // If already connected and active, return cached db immediately
  if (cache.db && cache.client) {
    return cache.db;
  }

  // If a connection attempt is currently in-flight, await the same promise
  if (cache.promise) {
    return cache.promise;
  }

  const rawUri = process.env.MONGODB_URI;
  if (!rawUri || typeof rawUri !== 'string' || !rawUri.trim()) {
    throw new Error('MONGODB_URI is not defined. Set it in your environment variables.');
  }

  const uri = rawUri.trim();
  const dbName = process.env.DB_NAME || 'campusbite';

  // Serverless-optimized connection settings
  const clientOptions = {
    maxPoolSize: 10,
    minPoolSize: 0,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 10000
  };

  cache.promise = (async () => {
    let clientInstance = null;
    try {
      clientInstance = new MongoClient(uri, clientOptions);
      await clientInstance.connect();

      // Verify connectivity with database ping
      await clientInstance.db(dbName).command({ ping: 1 });

      cache.client = clientInstance;
      cache.db = clientInstance.db(dbName);

      console.log(`[DB] Connected to MongoDB Atlas — database: ${dbName} (serverless connection cached)`);
      return cache.db;
    } catch (err) {
      // Clean up failed state so future requests can retry cleanly
      if (clientInstance) {
        try {
          await clientInstance.close();
        } catch (_) {
          // ignore close error
        }
      }
      cache.client = null;
      cache.db = null;
      cache.promise = null;

      // Safe logging without exposing credentials or full URI
      const sanitizedErr = err.message || 'Unknown connection error';
      console.error(`[DB] MongoDB Atlas connection failed: ${sanitizedErr}`);
      throw err;
    }
  })();

  return cache.promise;
}

/**
 * Return a promise resolving to the shared MongoClient instance.
 * Used by connect-mongo to share the exact same connection pool.
 *
 * @returns {Promise<import('mongodb').MongoClient>}
 */
async function getClientPromise() {
  await connectDB();
  return cache.client;
}

/**
 * Return the cached database instance.
 * Throws an operational error if connectDB() has not succeeded yet.
 *
 * @returns {import('mongodb').Db}
 */
function getDB() {
  if (!cache.db) {
    const err = new Error('Database not initialised. Call connectDB() first.');
    err.statusCode = 503;
    err.code = 'DATABASE_NOT_INITIALIZED';
    throw err;
  }
  return cache.db;
}

/**
 * Returns whether the database is actively connected and cached.
 *
 * @returns {boolean}
 */
function isConnected() {
  return cache.db !== null && cache.client !== null;
}

/**
 * Gracefully close the MongoDB connection.
 * Used primarily by test runners and graceful shutdown scripts.
 */
async function closeDB() {
  if (cache.client) {
    try {
      await cache.client.close();
    } catch (_) {
      // ignore
    }
    cache.client = null;
    cache.db = null;
    cache.promise = null;
    console.log('[DB] MongoDB connection closed.');
  }
}

/**
 * Production-safe diagnostics reporting configuration & connection status.
 * Never exposes credentials, passwords, or raw connection strings.
 */
function getSafeDiagnostics() {
  return {
    configured: Boolean(process.env.MONGODB_URI),
    connected: isConnected(),
    databaseName: process.env.DB_NAME || 'campusbite',
    environment: process.env.NODE_ENV || 'development',
    hasSessionSecret: Boolean(process.env.SESSION_SECRET),
    nodeVersion: process.version
  };
}

module.exports = {
  connectDB,
  getClientPromise,
  getDB,
  isConnected,
  closeDB,
  COLLECTIONS,
  getSafeDiagnostics
};
