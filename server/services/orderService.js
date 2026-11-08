'use strict';

const { ObjectId } = require('mongodb');
const { connectDB, getDB, isConnected, COLLECTIONS } = require('../config/database');

async function resolveDB() {
  if (isConnected()) {
    return getDB();
  }
  if (process.env.MONGODB_URI) {
    try {
      return await connectDB();
    } catch (err) {
      console.error('[Order Service Diagnostic] Database connection unavailable during order operation:', err.message);
      const dbErr = new Error('Database service is temporarily unavailable. Please try again shortly.');
      dbErr.statusCode = 503;
      dbErr.code = 'DATABASE_UNAVAILABLE';
      throw dbErr;
    }
  }
  if (process.env.NODE_ENV === 'production') {
    const err = new Error('Database service is temporarily unavailable. Please try again shortly.');
    err.statusCode = 503;
    err.code = 'DATABASE_UNAVAILABLE';
    throw err;
  }
  return null;
}
const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  ALLOWED_STATUS_TRANSITIONS,
  FINANCIAL_CONFIG
} = require('../config/constants');
const { validateOrderDocument } = require('../utils/dbValidators');
const { calculateEstimatedPrepTime } = require('../utils/prepTimeEstimator');
const menuService = require('./menuService');
const { inMemoryOrders, inMemoryIdempotencyKeys } = require('../config/mockStore');

const orderService = {
  /**
   * Create a new order with server-side validation and pricing
   */
  async createOrder({
    userId,
    customerName,
    customerEmail,
    items,
    paymentMethod = PAYMENT_METHODS.CASH,
    notes = '',
    idempotencyKey = null
  }) {
    if (!userId) {
      const err = new Error('User authentication is required to place an order.');
      err.statusCode = 401;
      throw err;
    }

    if (!Array.isArray(items) || items.length === 0) {
      const err = new Error('Your order must contain at least one item.');
      err.statusCode = 400;
      throw err;
    }

    // ─── 1. Idempotency Check ───────────────────────────────────────
    if (idempotencyKey) {
      const existing = await this.findOrderByIdempotencyKey(userId, idempotencyKey);
      if (existing) {
        return { order: existing, duplicate: true };
      }
    }

    // ─── 2. Fetch Actual Prices & Validate Availability from DB ─────
    const itemSnapshots = [];
    let subtotal = 0;

    for (const requestedItem of items) {
      const id = requestedItem.menuItemId || requestedItem._id;
      const quantity = Number(requestedItem.quantity);

      if (!id) {
        const err = new Error('Each order item must specify a valid menuItemId.');
        err.statusCode = 400;
        throw err;
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        const err = new Error('Quantity must be an integer greater than zero.');
        err.statusCode = 400;
        throw err;
      }

      if (quantity > FINANCIAL_CONFIG.MAX_QTY_PER_ITEM) {
        const err = new Error(`Quantity cannot exceed ${FINANCIAL_CONFIG.MAX_QTY_PER_ITEM} per item.`);
        err.statusCode = 400;
        throw err;
      }

      // Fetch official menu item record directly from DB service
      const menuItem = await menuService.getItemById(id);
      if (!menuItem) {
        const err = new Error(`Menu item with ID "${id}" was not found.`);
        err.statusCode = 400;
        throw err;
      }

      if (menuItem.isAvailable === false) {
        const err = new Error(`Item "${menuItem.name}" is currently sold out and unavailable.`);
        err.statusCode = 400;
        throw err;
      }

      const itemPrice = Number(menuItem.price);
      subtotal += itemPrice * quantity;

      itemSnapshots.push({
        menuItemId: String(menuItem._id),
        name: menuItem.name,
        price: itemPrice,
        category: menuItem.category || 'Food',
        quantity,
        preparationTime: Number(menuItem.preparationTime) || 10
      });
    }

    // ─── 3. Server-side Financial Calculations ──────────────────────
    subtotal = Math.round(subtotal * 100) / 100;
    const tax = Math.round(subtotal * FINANCIAL_CONFIG.TAX_RATE * 100) / 100;
    const campusFee = subtotal > 0 ? FINANCIAL_CONFIG.CAMPUS_FEE : 0;
    const totalAmount = Math.round((subtotal + tax + campusFee) * 100) / 100;

    // ─── 4. Validate Payment Method ─────────────────────────────────
    const validPaymentMethod = Object.values(PAYMENT_METHODS).includes(paymentMethod)
      ? paymentMethod
      : PAYMENT_METHODS.CASH;

    // ─── 5. Smart Preparation Time Estimation ───────────────────────
    const activeKitchenCount = await this.countActiveKitchenOrders();
    const estimatedPrepTime = calculateEstimatedPrepTime(itemSnapshots, activeKitchenCount);

    // ─── 6. Build Order Document ───────────────────────────────────
    const orderNumber = await this.generateUniqueOrderNumber();

    const orderDoc = {
      orderNumber,
      userId: String(userId),
      customerName: customerName || 'Campus Student',
      customerEmail: customerEmail || '',
      items: itemSnapshots,
      subtotal,
      tax,
      campusFee,
      totalAmount,
      paymentMethod: validPaymentMethod,
      paymentStatus: PAYMENT_STATUS.PENDING,
      status: ORDER_STATUS.PLACED,
      estimatedPreparationTime: estimatedPrepTime,
      notes: typeof notes === 'string' ? notes.trim() : '',
      idempotencyKey: idempotencyKey || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validation = validateOrderDocument(orderDoc);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(' '));
      err.statusCode = 400;
      throw err;
    }

    // ─── 7. Persistence (MongoDB or In-Memory) ─────────────────────
    const db = await resolveDB();
    if (db) {
      const result = await db.collection(COLLECTIONS.ORDERS).insertOne(orderDoc);
      orderDoc._id = result.insertedId;
    } else {
      orderDoc._id = new ObjectId();
      inMemoryOrders.unshift(orderDoc);
      if (idempotencyKey) {
        inMemoryIdempotencyKeys.set(`${userId}:${idempotencyKey}`, {
          order: orderDoc,
          timestamp: Date.now()
        });
      }
    }

    return { order: orderDoc, duplicate: false };
  },

  /**
   * Check for duplicate submission using idempotency key
   */
  async findOrderByIdempotencyKey(userId, idempotencyKey) {
    if (!idempotencyKey) return null;

    const db = await resolveDB();
    if (db) {
      return db.collection(COLLECTIONS.ORDERS).findOne({
        userId: String(userId),
        idempotencyKey: String(idempotencyKey)
      });
    }

    const cached = inMemoryIdempotencyKeys.get(`${userId}:${idempotencyKey}`);
    if (cached) return cached.order;
    return inMemoryOrders.find(o => o.userId === String(userId) && o.idempotencyKey === String(idempotencyKey)) || null;
  },

  /**
   * Count active kitchen orders ('Placed' or 'Preparing')
   */
  async countActiveKitchenOrders() {
    const db = await resolveDB();
    if (db) {
      return db.collection(COLLECTIONS.ORDERS).countDocuments({
        status: { $in: [ORDER_STATUS.PLACED, ORDER_STATUS.PREPARING] }
      });
    }
    return inMemoryOrders.filter(o => o.status === ORDER_STATUS.PLACED || o.status === ORDER_STATUS.PREPARING).length;
  },

  /**
   * Generate unique order token (e.g., CB-849201)
   */
  async generateUniqueOrderNumber() {
    for (let attempts = 0; attempts < 10; attempts++) {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const candidate = `CB-${randomNum}`;

      let exists = false;
      const db = await resolveDB();
    if (db) {
        const found = await db.collection(COLLECTIONS.ORDERS).findOne({ orderNumber: candidate });
        if (found) exists = true;
      } else {
        exists = inMemoryOrders.some(o => o.orderNumber === candidate);
      }

      if (!exists) return candidate;
    }
    return `CB-${Date.now().toString().slice(-6)}`;
  },

  /**
   * Get single order by orderNumber with ownership authorization check
   */
  async getOrderByNumber(orderNumber, requestingUser) {
    let order = null;
    const db = await resolveDB();
    if (db) {
      order = await db.collection(COLLECTIONS.ORDERS).findOne({ orderNumber });
    } else {
      order = inMemoryOrders.find(o => o.orderNumber === orderNumber) || null;
    }

    if (!order) {
      const err = new Error(`Order #${orderNumber} not found.`);
      err.statusCode = 404;
      throw err;
    }

    // Ownership check
    if (requestingUser.role !== 'admin' && String(order.userId) !== String(requestingUser.id)) {
      const err = new Error('Forbidden: You do not have permission to view this order.');
      err.statusCode = 403;
      throw err;
    }

    return order;
  },

  /**
   * Get single order by ID with ownership authorization check
   */
  async getOrderById(id, requestingUser) {
    let order = null;
    const db = await resolveDB();
    if (db) {
      const query = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
      order = await db.collection(COLLECTIONS.ORDERS).findOne(query);
    } else {
      order = inMemoryOrders.find(o => String(o._id) === String(id)) || null;
    }

    if (!order) {
      const err = new Error('Order not found.');
      err.statusCode = 404;
      throw err;
    }

    // Ownership check
    if (requestingUser.role !== 'admin' && String(order.userId) !== String(requestingUser.id)) {
      const err = new Error('Forbidden: You do not have permission to view this order.');
      err.statusCode = 403;
      throw err;
    }

    return order;
  },

  /**
   * Get all orders for current authenticated student
   */
  async getOrdersByUser(userId) {
    const db = await resolveDB();
    if (db) {
      return db.collection(COLLECTIONS.ORDERS)
        .find({ userId: String(userId) })
        .sort({ createdAt: -1 })
        .toArray();
    }
    return inMemoryOrders
      .filter(o => String(o.userId) === String(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Cancel order (allowed ONLY when status is 'Placed')
   */
  async cancelOrder(idOrNumber, requestingUser) {
    // Find order by ID or orderNumber
    let order = null;
    if (typeof idOrNumber === 'string' && idOrNumber.startsWith('CB-')) {
      order = await this.getOrderByNumber(idOrNumber, requestingUser);
    } else {
      order = await this.getOrderById(idOrNumber, requestingUser);
    }

    // Ownership check
    if (requestingUser.role !== 'admin' && String(order.userId) !== String(requestingUser.id)) {
      const err = new Error('Forbidden: You cannot cancel another user’s order.');
      err.statusCode = 403;
      throw err;
    }

    // State machine check: cancellation is only allowed if status is Placed
    if (order.status !== ORDER_STATUS.PLACED) {
      const err = new Error(
        `Order cannot be cancelled because it is in '${order.status}' status. Kitchen preparation has already commenced.`
      );
      err.statusCode = 400;
      throw err;
    }

    const update = {
      status: ORDER_STATUS.CANCELLED,
      updatedAt: new Date()
    };

    const db = await resolveDB();
    if (db) {
      return db.collection(COLLECTIONS.ORDERS).findOneAndUpdate(
        { _id: order._id },
        { $set: update },
        { returnDocument: 'after' }
      );
    }

    order.status = ORDER_STATUS.CANCELLED;
    order.updatedAt = update.updatedAt;
    return order;
  },

  /**
   * Admin: Get all orders with filtering, searching, and sorting
   */
  async getAllOrders({ status, search, dateFrom, dateTo } = {}) {
    const db = await resolveDB();
    if (db) {
      const query = {};

      if (status && status !== 'all') {
        query.status = status;
      }

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { orderNumber: regex },
          { customerName: regex },
          { customerEmail: regex }
        ];
      }

      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      return db.collection(COLLECTIONS.ORDERS)
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
    }

    // In-memory filtered list
    let list = [...inMemoryOrders];

    if (status && status !== 'all') {
      list = list.filter(o => o.status === status);
    }

    if (search && search.trim()) {
      const s = search.toLowerCase().trim();
      list = list.filter(o =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(s)) ||
        (o.customerName && o.customerName.toLowerCase().includes(s)) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(s))
      );
    }

    if (dateFrom) {
      list = list.filter(o => new Date(o.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      list = list.filter(o => new Date(o.createdAt) <= new Date(dateTo));
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Admin: Update order status with strict lifecycle transition validation
   */
  async updateOrderStatus(idOrNumber, newStatus) {
    if (!Object.values(ORDER_STATUS).includes(newStatus)) {
      const err = new Error(`Invalid status "${newStatus}". Must be one of: ${Object.values(ORDER_STATUS).join(', ')}.`);
      err.statusCode = 400;
      throw err;
    }

    let order = null;
    const db = await resolveDB();
    if (db) {
      const query = typeof idOrNumber === 'string' && idOrNumber.startsWith('CB-')
        ? { orderNumber: idOrNumber }
        : { _id: typeof idOrNumber === 'string' && ObjectId.isValid(idOrNumber) ? new ObjectId(idOrNumber) : idOrNumber };
      order = await db.collection(COLLECTIONS.ORDERS).findOne(query);
    } else {
      order = inMemoryOrders.find(o =>
        o.orderNumber === idOrNumber || String(o._id) === String(idOrNumber)
      );
    }

    if (!order) {
      const err = new Error('Order not found.');
      err.statusCode = 404;
      throw err;
    }

    const currentStatus = order.status;

    // Validate lifecycle transition
    const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      const err = new Error(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: [${allowedNext.join(', ') || 'None (Terminal state)'}].`
      );
      err.statusCode = 400;
      throw err;
    }

    const update = {
      status: newStatus,
      updatedAt: new Date()
    };

    // If order is completed, counter payments become settled (Paid)
    if (newStatus === ORDER_STATUS.COMPLETED && order.paymentStatus === PAYMENT_STATUS.PENDING) {
      update.paymentStatus = PAYMENT_STATUS.PAID;
    }

    if (db) {
      return db.collection(COLLECTIONS.ORDERS).findOneAndUpdate(
        { _id: order._id },
        { $set: update },
        { returnDocument: 'after' }
      );
    }

    order.status = newStatus;
    if (update.paymentStatus) order.paymentStatus = update.paymentStatus;
    order.updatedAt = update.updatedAt;
    return order;
  },

  /**
   * Admin: Update payment status
   */
  async updatePaymentStatus(idOrNumber, newPaymentStatus) {
    if (!Object.values(PAYMENT_STATUS).includes(newPaymentStatus)) {
      const err = new Error(`Invalid payment status. Allowed: ${Object.values(PAYMENT_STATUS).join(', ')}.`);
      err.statusCode = 400;
      throw err;
    }

    let order = null;
    const db = await resolveDB();
    if (db) {
      const query = typeof idOrNumber === 'string' && idOrNumber.startsWith('CB-')
        ? { orderNumber: idOrNumber }
        : { _id: typeof idOrNumber === 'string' && ObjectId.isValid(idOrNumber) ? new ObjectId(idOrNumber) : idOrNumber };
      order = await db.collection(COLLECTIONS.ORDERS).findOne(query);
    } else {
      order = inMemoryOrders.find(o =>
        o.orderNumber === idOrNumber || String(o._id) === String(idOrNumber)
      );
    }

    if (!order) {
      const err = new Error('Order not found.');
      err.statusCode = 404;
      throw err;
    }

    const update = {
      paymentStatus: newPaymentStatus,
      updatedAt: new Date()
    };

    if (db) {
      return db.collection(COLLECTIONS.ORDERS).findOneAndUpdate(
        { _id: order._id },
        { $set: update },
        { returnDocument: 'after' }
      );
    }

    order.paymentStatus = newPaymentStatus;
    order.updatedAt = update.updatedAt;
    return order;
  },

  /**
   * Admin Dashboard & Analytics Calculations
   */
  async getDashboardAnalytics() {
    const orders = await this.getAllOrders();

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter(o => new Date(o.createdAt).toISOString().slice(0, 10) === todayStr);

    const totalOrders = orders.length;
    const todayOrdersCount = todayOrders.length;

    // Gross Order Value = sum of all non-cancelled orders
    const grossOrderValue = orders
      .filter(o => o.status !== ORDER_STATUS.CANCELLED)
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    // Collected Revenue = strictly paid orders that are NOT cancelled
    const totalCollectedRevenue = orders
      .filter(o => o.paymentStatus === PAYMENT_STATUS.PAID && o.status !== ORDER_STATUS.CANCELLED)
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const todayCollectedRevenue = todayOrders
      .filter(o => o.paymentStatus === PAYMENT_STATUS.PAID && o.status !== ORDER_STATUS.CANCELLED)
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const pendingCount = orders.filter(o => o.status === ORDER_STATUS.PLACED).length;
    const preparingCount = orders.filter(o => o.status === ORDER_STATUS.PREPARING).length;
    const readyCount = orders.filter(o => o.status === ORDER_STATUS.READY).length;
    const completedCount = orders.filter(o => o.status === ORDER_STATUS.COMPLETED).length;
    const cancelledCount = orders.filter(o => o.status === ORDER_STATUS.CANCELLED).length;

    // Daily breakdown for last 7 days
    const dailyStatsMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
      dailyStatsMap[key] = { date: key, label, revenue: 0, count: 0 };
    }

    orders.forEach(o => {
      const dateKey = new Date(o.createdAt).toISOString().slice(0, 10);
      if (dailyStatsMap[dateKey]) {
        dailyStatsMap[dateKey].count += 1;
        if (o.paymentStatus === PAYMENT_STATUS.PAID && o.status !== ORDER_STATUS.CANCELLED) {
          dailyStatsMap[dateKey].revenue += Number(o.totalAmount) || 0;
        }
      }
    });

    const dailyTrends = Object.values(dailyStatsMap).map(d => ({
      ...d,
      revenue: Math.round(d.revenue * 100) / 100
    }));

    // Top Selling Food Items aggregation
    const productStats = {};
    orders
      .filter(o => o.status !== ORDER_STATUS.CANCELLED)
      .forEach(o => {
        (o.items || []).forEach(item => {
          const name = item.name;
          if (!productStats[name]) {
            productStats[name] = {
              name,
              category: item.category || 'Food',
              price: item.price,
              unitsSold: 0,
              orderFrequency: 0
            };
          }
          productStats[name].unitsSold += Number(item.quantity) || 1;
          productStats[name].orderFrequency += 1;
        });
      });

    const popularProducts = Object.values(productStats)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    return {
      metrics: {
        totalOrders,
        todayOrdersCount,
        grossOrderValue: Math.round(grossOrderValue * 100) / 100,
        totalCollectedRevenue: Math.round(totalCollectedRevenue * 100) / 100,
        todayCollectedRevenue: Math.round(todayCollectedRevenue * 100) / 100,
        pendingOrders: pendingCount,
        preparingOrders: preparingCount,
        readyOrders: readyCount,
        completedOrders: completedCount,
        cancelledOrders: cancelledCount,
        activeKitchenOrders: pendingCount + preparingCount
      },
      statusDistribution: {
        Placed: pendingCount,
        Preparing: preparingCount,
        Ready: readyCount,
        Completed: completedCount,
        Cancelled: cancelledCount
      },
      dailyTrends,
      popularProducts,
      smartWorkload: {
        activeKitchenOrders: pendingCount + preparingCount,
        avgPrepEstimate: calculateEstimatedPrepTime([{ preparationTime: 12 }], pendingCount + preparingCount)
      }
    };
  }
};

module.exports = orderService;
