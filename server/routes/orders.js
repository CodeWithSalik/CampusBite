'use strict';

const { Router } = require('express');
const orderController = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// All order endpoints require authenticated student/user session
router.use(requireAuth);

// Place new order
router.post('/', orderController.createOrder);

// Get current student's orders
router.get('/my', orderController.getMyOrders);

// Get order by unique orderNumber (e.g. CB-849201)
router.get('/number/:orderNumber', orderController.getOrderByNumber);

// Get order by MongoDB ID
router.get('/:id', orderController.getOrderById);

// Cancel order (only allowed if status === 'Placed')
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router;
