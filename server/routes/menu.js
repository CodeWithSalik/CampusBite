'use strict';

const { Router } = require('express');
const menuController = require('../controllers/menuController');
const { requireAdmin } = require('../middleware/auth');

const router = Router();

// Public: Get menu catalogue
router.get('/', menuController.getMenu);

// Admin Protected: Canteen operations
router.post('/', requireAdmin, menuController.createItem);
router.put('/:id', requireAdmin, menuController.updateItem);
router.delete('/:id', requireAdmin, menuController.deleteItem);

module.exports = router;
