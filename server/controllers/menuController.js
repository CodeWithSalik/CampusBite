'use strict';

const menuService = require('../services/menuService');
const { isConnected } = require('../config/database');

const menuController = {
  /**
   * GET /api/menu
   */
  async getMenu(req, res, next) {
    try {
      const { category, availableOnly } = req.query;

      const items = await menuService.getAllItems({
        category,
        availableOnly: availableOnly === 'true'
      });

      res.json({
        success: true,
        count: items.length,
        items
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/menu (Admin only)
   */
  async createItem(req, res, next) {
    try {
      const item = await menuService.createItem(req.body);
      res.status(201).json({
        success: true,
        message: 'Menu item created successfully.',
        item
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/menu/:id (Admin only)
   */
  async updateItem(req, res, next) {
    try {
      const item = await menuService.updateItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Menu item not found.' });
      }
      res.json({
        success: true,
        message: 'Menu item updated.',
        item
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/menu/:id (Admin only)
   */
  async deleteItem(req, res, next) {
    try {
      const deleted = await menuService.deleteItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Menu item not found.' });
      }
      res.json({
        success: true,
        message: 'Menu item deleted.'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = menuController;
