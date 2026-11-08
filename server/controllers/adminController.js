'use strict';

const orderService = require('../services/orderService');

const adminController = {
  /**
   * GET /api/admin/orders
   * List all orders with filters (status, search, dates)
   */
  async getOrders(req, res, next) {
    try {
      const { status, search, dateFrom, dateTo } = req.query;
      const orders = await orderService.getAllOrders({ status, search, dateFrom, dateTo });

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
   * GET /api/admin/orders/:id
   * Get single order details
   */
  async getOrderDetails(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id, req.session.user);

      res.json({
        success: true,
        order
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/orders/:id/status
   * Advance order lifecycle status with state machine validation
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, error: 'Target status is required.' });
      }

      const updated = await orderService.updateOrderStatus(id, status);

      res.json({
        success: true,
        message: `Order status transitioned to "${status}".`,
        order: updated
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/orders/:id/payment
   * Mark order payment status (Paid, Pending, Failed)
   */
  async updatePayment(req, res, next) {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;

      if (!paymentStatus) {
        return res.status(400).json({ success: false, error: 'Target paymentStatus is required.' });
      }

      const updated = await orderService.updatePaymentStatus(id, paymentStatus);

      res.json({
        success: true,
        message: `Payment status marked as "${paymentStatus}".`,
        order: updated
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/dashboard
   * Consolidated operational metrics, daily chart data, and kitchen workload
   */
  async getDashboard(req, res, next) {
    try {
      const data = await orderService.getDashboardAnalytics();
      res.json({
        success: true,
        ...data
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/analytics
   * Deep analytics reporting
   */
  async getAnalytics(req, res, next) {
    try {
      const data = await orderService.getDashboardAnalytics();
      res.json({
        success: true,
        ...data
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = adminController;
