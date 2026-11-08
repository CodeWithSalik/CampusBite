'use strict';

const orderService = require('../services/orderService');

const orderController = {
  /**
   * POST /api/orders
   * Place a new order with server-side validation and pricing
   */
  async createOrder(req, res, next) {
    try {
      const user = req.session.user;
      const { items, paymentMethod, notes, idempotencyKey: bodyKey } = req.body;
      const headerKey = req.headers['x-idempotency-key'];
      const idempotencyKey = headerKey || bodyKey || null;

      const result = await orderService.createOrder({
        userId: user.id || user._id,
        customerName: user.name,
        customerEmail: user.email,
        items,
        paymentMethod,
        notes,
        idempotencyKey
      });

      res.status(result.duplicate ? 200 : 201).json({
        success: true,
        message: result.duplicate ? 'Duplicate submission detected; returning existing order.' : 'Order placed successfully.',
        order: result.order,
        duplicate: result.duplicate
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/orders/my
   * Get all orders placed by the currently logged-in student
   */
  async getMyOrders(req, res, next) {
    try {
      const user = req.session.user;
      const orders = await orderService.getOrdersByUser(user.id || user._id);

      res.json({
        success: true,
        count: orders.length,
        orders
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/orders/number/:orderNumber
   * Get order by order token with ownership authorization check
   */
  async getOrderByNumber(req, res, next) {
    try {
      const { orderNumber } = req.params;
      const user = req.session.user;

      const order = await orderService.getOrderByNumber(orderNumber, user);

      res.json({
        success: true,
        order
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/orders/:id
   * Get order by _id with ownership authorization check
   */
  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.session.user;

      const order = await orderService.getOrderById(id, user);

      res.json({
        success: true,
        order
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/orders/:id/cancel
   * Cancel an order (allowed only if status is 'Placed')
   */
  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.session.user;

      const updated = await orderService.cancelOrder(id, user);

      res.json({
        success: true,
        message: 'Order cancelled successfully.',
        order: updated
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = orderController;
