'use strict';

const bcrypt = require('bcryptjs');
const userService = require('./userService');
const { validateEmail, normalizeEmail } = require('../utils/dbValidators');
const { isConnected } = require('../config/database');

const SALT_ROUNDS = 10;

const authService = {
  /**
   * Register a new student account.
   * STRICT: Public registration ALWAYS assigns role: 'student'.
   */
  async registerStudent({ name, email, password, confirmPassword }) {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      const err = new Error('Full name must be at least 2 characters long.');
      err.statusCode = 400;
      throw err;
    }

    if (!validateEmail(email)) {
      const err = new Error('Please provide a valid email address.');
      err.statusCode = 400;
      throw err;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      const err = new Error('Password must be at least 6 characters long.');
      err.statusCode = 400;
      throw err;
    }

    if (password !== confirmPassword) {
      const err = new Error('Passwords do not match.');
      err.statusCode = 400;
      throw err;
    }

    const normalized = normalizeEmail(email);

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with explicit role 'student' (ignoring any user supplied role)
    const user = await userService.createUser({
      name: name.trim(),
      email: normalized,
      passwordHash,
      role: 'student'
    });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  },

  /**
   * Verify credentials and return sanitized user profile.
   * Emits safe diagnostics for production troubleshooting without exposing sensitive values.
   */
  async verifyCredentials(email, password) {
    if (!email || !password) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 400;
      throw err;
    }

    const normalized = normalizeEmail(email);

    console.log('[Auth Diagnostic] Verifying credentials for authentication attempt.');
    const user = await userService.findByEmail(normalized);

    const dbConnected = isConnected();
    console.log(`[Auth Diagnostic] User lookup reached MongoDB: ${dbConnected}`);
    console.log(`[Auth Diagnostic] Account found: ${Boolean(user)}`);

    // Generic error message to prevent account enumeration
    if (!user || !user.passwordHash) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(`[Auth Diagnostic] Password comparison result: ${isMatch}`);

    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }
};

module.exports = authService;
