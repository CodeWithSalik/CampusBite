'use strict';

const { ObjectId } = require('mongodb');
const { getDB, COLLECTIONS } = require('../config/database');
const { validateOrderDocument } = require('../utils/dbValidators');

const orderService = {
  /**
   * Create a new order
   */
  async createOrder(orderData) {
    const db = getDB();

    const orderNumber = orderData.orderNumber || 'CB-' + Math.floor(100000 + Math.random() * 900000);

    const doc = {
      orderNumber,
      userId: orderData.userId,
      items: orderData.items.map(i => ({
        menuItemId: i.menuItemId,
        name: i.name,
        price: Number(i.price),
        quantity: Number(i.quantity)
      })),
      totalAmount: Number(orderData.totalAmount),
      paymentMethod: orderData.paymentMethod || 'Cash at Counter',
      paymentStatus: orderData.paymentStatus || 'Pending',
      status: orderData.status || 'Placed',
      estimatedPreparationTime: Number(orderData.estimatedPreparationTime) || 15,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validation = validateOrderDocument(doc);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(' '));
      err.statusCode = 400;
      throw err;
    }

    const result = await db.collection(COLLECTIONS.ORDERS).insertOne(doc);
    return { _id: result.insertedId, ...doc };
  },

  /**
   * Get order by orderNumber
   */
  async getOrderByNumber(orderNumber) {
    const db = getDB();
    return db.collection(COLLECTIONS.ORDERS).findOne({ orderNumber });
  },

  /**
   * Get orders for a specific user
   */
  async getOrdersByUser(userId) {
    const db = getDB();
    return db.collection(COLLECTIONS.ORDERS)
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
  },

  /**
   * Get all orders (admin view)
   */
  async getAllOrders(filter = {}) {
    const db = getDB();
    const query = {};
    if (filter.status) query.status = filter.status;
    return db.collection(COLLECTIONS.ORDERS)
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
  },

  /**
   * Update order status (Placed -> Preparing -> Ready -> Completed)
   */
  async updateOrderStatus(orderNumber, status) {
    const db = getDB();
    const update = {
      status,
      updatedAt: new Date()
    };
    if (status === 'Completed') {
      update.paymentStatus = 'Paid';
    }

    return db.collection(COLLECTIONS.ORDERS).findOneAndUpdate(
      { orderNumber },
      { $set: update },
      { returnDocument: 'after' }
    );
  }
};

module.exports = orderService;
