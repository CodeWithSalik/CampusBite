'use strict';

const { ObjectId } = require('mongodb');
const { getDB, COLLECTIONS } = require('../config/database');
const { normalizeEmail, validateUserDocument } = require('../utils/dbValidators');

const userService = {
  /**
   * Find user by email
   */
  async findByEmail(email) {
    const db = getDB();
    const normalized = normalizeEmail(email);
    return db.collection(COLLECTIONS.USERS).findOne({ email: normalized });
  },

  /**
   * Find user by _id
   */
  async findById(id) {
    const db = getDB();
    const query = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    return db.collection(COLLECTIONS.USERS).findOne(query, {
      projection: { passwordHash: 0 } // exclude hash by default
    });
  },

  /**
   * Create a new user (student or admin)
   */
  async createUser({ name, email, passwordHash, role = 'student' }) {
    const db = getDB();
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
  },

  /**
   * List users (excluding password hashes)
   */
  async listUsers(role = null) {
    const db = getDB();
    const query = role ? { role } : {};
    return db.collection(COLLECTIONS.USERS)
      .find(query, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
  }
};

module.exports = userService;
