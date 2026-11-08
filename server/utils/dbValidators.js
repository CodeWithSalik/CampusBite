'use strict';

/**
 * CampusBite — Schema & Input Validators
 */

const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  FINANCIAL_CONFIG
} = require('../config/constants');

const VALID_ROLES = ['student', 'admin'];
const VALID_CATEGORIES = ['Burgers', 'Pizza', 'Snacks', 'Indian Food', 'Beverages', 'Desserts'];
const VALID_ORDER_STATUSES = Object.values(ORDER_STATUS);
const VALID_PAYMENT_STATUSES = Object.values(PAYMENT_STATUS);
const VALID_PAYMENT_METHODS = Object.values(PAYMENT_METHODS);

function validateEmail(email) {
  if (typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function validateUserDocument(doc) {
  const errors = [];
  if (!doc.name || typeof doc.name !== 'string' || doc.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long.');
  }
  if (!validateEmail(doc.email)) {
    errors.push('A valid email address is required.');
  }
  if (!doc.passwordHash || typeof doc.passwordHash !== 'string') {
    errors.push('Password hash is required.');
  }
  if (!VALID_ROLES.includes(doc.role)) {
    errors.push(`Role must be one of: ${VALID_ROLES.join(', ')}.`);
  }
  return { isValid: errors.length === 0, errors };
}

function validateMenuItemDocument(doc) {
  const errors = [];
  if (!doc.name || typeof doc.name !== 'string' || doc.name.trim().length < 2) {
    errors.push('Menu item name must be at least 2 characters long.');
  }
  if (typeof doc.price !== 'number' || doc.price <= 0) {
    errors.push('Price must be a positive number in INR.');
  }
  if (!VALID_CATEGORIES.includes(doc.category)) {
    errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`);
  }
  if (typeof doc.isAvailable !== 'boolean') {
    errors.push('isAvailable must be a boolean flag.');
  }
  if (doc.preparationTime && (typeof doc.preparationTime !== 'number' || doc.preparationTime < 1)) {
    errors.push('Preparation time must be a positive number of minutes.');
  }
  return { isValid: errors.length === 0, errors };
}

function validateOrderDocument(doc) {
  const errors = [];
  if (!doc.orderNumber || typeof doc.orderNumber !== 'string') {
    errors.push('Order number is required.');
  }
  if (!doc.userId) {
    errors.push('userId is required for order creation.');
  }
  if (!Array.isArray(doc.items) || doc.items.length === 0) {
    errors.push('Order must contain at least one item.');
  } else {
    doc.items.forEach((item, idx) => {
      if (!item.name || typeof item.price !== 'number' || !item.quantity || item.quantity < 1) {
        errors.push(`Invalid order item at index ${idx}.`);
      }
      if (item.quantity > FINANCIAL_CONFIG.MAX_QTY_PER_ITEM) {
        errors.push(`Item quantity at index ${idx} exceeds maximum allowed (${FINANCIAL_CONFIG.MAX_QTY_PER_ITEM}).`);
      }
    });
  }
  if (typeof doc.totalAmount !== 'number' || doc.totalAmount <= 0) {
    errors.push('Total amount must be a positive number.');
  }
  if (doc.status && !VALID_ORDER_STATUSES.includes(doc.status)) {
    errors.push(`Order status must be one of: ${VALID_ORDER_STATUSES.join(', ')}.`);
  }
  if (doc.paymentStatus && !VALID_PAYMENT_STATUSES.includes(doc.paymentStatus)) {
    errors.push(`Payment status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}.`);
  }
  if (doc.paymentMethod && !VALID_PAYMENT_METHODS.includes(doc.paymentMethod)) {
    errors.push(`Payment method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}.`);
  }
  return { isValid: errors.length === 0, errors };
}

module.exports = {
  VALID_ROLES,
  VALID_CATEGORIES,
  VALID_ORDER_STATUSES,
  VALID_PAYMENT_STATUSES,
  VALID_PAYMENT_METHODS,
  validateEmail,
  normalizeEmail,
  validateUserDocument,
  validateMenuItemDocument,
  validateOrderDocument
};
