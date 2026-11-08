'use strict';

const { Router } = require('express');
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

const router = Router();

// All administrative endpoints strictly require administrator role
router.use(requireAdmin);

// Admin Orders Management
router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderDetails);
router.patch('/orders/:id/status', adminController.updateStatus);
router.patch('/orders/:id/payment', adminController.updatePayment);

// Admin Telemetry & Analytics
router.get('/dashboard', adminController.getDashboard);
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
