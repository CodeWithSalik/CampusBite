'use strict';

const { ObjectId } = require('mongodb');
const { getDB, isConnected, COLLECTIONS } = require('../config/database');
const { normalizeEmail, validateUserDocument } = require('../utils/dbValidators');
const { inMemoryUsers } = require('../config/mockStore');

const userService = {
  /**
   * Find user by email
   */
  async findByEmail(email) {
    const normalized = normalizeEmail(email);

    if (isConnected()) {
      const db = getDB();
      return db.collection(COLLECTIONS.USERS).findOne({ email: normalized });
    }

    // In-memory fallback
    return inMemoryUsers.find(u => u.email === normalized) || null;
  },

  /**
   * Find user by _id
   */
  async findById(id) {
    if (isConnected()) {
      const db = getDB();
      const query = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
      return db.collection(COLLECTIONS.USERS).findOne(query, {
        projection: { passwordHash: 0 } // exclude hash by default
      });
    }

    const user = inMemoryUsers.find(u => String(u._id) === String(id));
    if (!user) return null;
    const { passwordHash, ...safe } = user;
    return safe;
  },

  /**
   * Create a new user (student or admin)
   */
  async createUser({ name, email, passwordHash, role = 'student' }) {
    const normalized = normalizeEmail(email);

    const doc = {
      name: name.trim(),
      email: normalized,
      passwordHash,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validation = validateUserDocument(doc);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(' '));
      err.statusCode = 400;
      throw err;
    }

    if (isConnected()) {
      const db = getDB();
      const existing = await db.collection(COLLECTIONS.USERS).findOne({ email: normalized });
      if (existing) {
        const err = new Error('An account with this email already exists.');
        err.statusCode = 409;
        throw err;
      }

      const result = await db.collection(COLLECTIONS.USERS).insertOne(doc);
      return {
        _id: result.insertedId,
        name: doc.name,
        email: doc.email,
        role: doc.role,
        createdAt: doc.createdAt
      };
    }

    // In-memory insertion
    const existing = inMemoryUsers.find(u => u.email === normalized);
    if (existing) {
      const err = new Error('An account with this email already exists.');
      err.statusCode = 409;
      throw err;
    }

    doc._id = new ObjectId();
    inMemoryUsers.push(doc);

    return {
      _id: doc._id,
      name: doc.name,
      email: doc.email,
      role: doc.role,
      createdAt: doc.createdAt
    };
  },

  /**
   * List users (excluding password hashes)
   */
  async listUsers(role = null) {
    if (isConnected()) {
      const db = getDB();
      const query = role ? { role } : {};
      return db.collection(COLLECTIONS.USERS)
        .find(query, { projection: { passwordHash: 0 } })
        .sort({ createdAt: -1 })
        .toArray();
    }

    let list = inMemoryUsers;
    if (role) {
      list = list.filter(u => u.role === role);
    }
    return list.map(({ passwordHash, ...safe }) => safe);
  }
};

module.exports = userService;
