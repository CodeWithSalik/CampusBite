'use strict';

/**
 * CampusBite — System Constants
 */

const ORDER_STATUS = {
  PLACED: 'Placed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

const PAYMENT_STATUS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed'
};

const PAYMENT_METHODS = {
  CASH: 'Cash at Counter',
  UPI: 'UPI at Counter'
};

const ALLOWED_STATUS_TRANSITIONS = {
  [ORDER_STATUS.PLACED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY],
  [ORDER_STATUS.READY]: [ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.COMPLETED]: [], // Terminal state
  [ORDER_STATUS.CANCELLED]: []  // Terminal state
};

const FINANCIAL_CONFIG = {
  TAX_RATE: 0.05,     // 5% GST
  CAMPUS_FEE: 10,     // ₹10 campus convenience charge
  MAX_QTY_PER_ITEM: 20
};

module.exports = {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  ALLOWED_STATUS_TRANSITIONS,
  FINANCIAL_CONFIG
};
