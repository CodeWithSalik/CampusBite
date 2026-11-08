'use strict';

const { ObjectId } = require('mongodb');
const { getDB, COLLECTIONS } = require('../config/database');
const { validateMenuItemDocument } = require('../utils/dbValidators');

const menuService = {
  /**
   * Get all menu items with optional category and availability filter
   */
  async getAllItems(filter = {}) {
    const db = getDB();
    const query = {};
    if (filter.category && filter.category !== 'all') {
      query.category = filter.category;
    }
    if (filter.availableOnly) {
      query.isAvailable = true;
    }
    return db.collection(COLLECTIONS.MENU_ITEMS)
      .find(query)
      .sort({ category: 1, name: 1 })
      .toArray();
  },

  /**
   * Get a single menu item by ID
   */
  async getItemById(id) {
    const db = getDB();
    const query = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    return db.collection(COLLECTIONS.MENU_ITEMS).findOne(query);
  },

  /**
   * Create a new menu item
   */
  async createItem(itemData) {
    const db = getDB();
    const doc = {
      name: itemData.name.trim(),
      description: itemData.description ? itemData.description.trim() : '',
      price: Number(itemData.price),
      category: itemData.category,
      image: itemData.image || '',
      isAvailable: typeof itemData.isAvailable === 'boolean' ? itemData.isAvailable : true,
      preparationTime: Number(itemData.preparationTime) || 10,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validation = validateMenuItemDocument(doc);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(' '));
      err.statusCode = 400;
      throw err;
    }

    const result = await db.collection(COLLECTIONS.MENU_ITEMS).insertOne(doc);
    return { _id: result.insertedId, ...doc };
  },

  /**
   * Update an existing menu item
   */
  async updateItem(id, updateData) {
    const db = getDB();
    const query = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };

    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    };
    if (updateFields.price) updateFields.price = Number(updateFields.price);
    if (updateFields.preparationTime) updateFields.preparationTime = Number(updateFields.preparationTime);

    const result = await db.collection(COLLECTIONS.MENU_ITEMS).findOneAndUpdate(
      query,
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    return result;
  },

  /**
   * Toggle item availability
   */
  async toggleAvailability(id, isAvailable) {
    const db = getDB();
    const query = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };

    return db.collection(COLLECTIONS.MENU_ITEMS).findOneAndUpdate(
      query,
      { $set: { isAvailable: Boolean(isAvailable), updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
  },

  /**
   * Delete a menu item
   */
  async deleteItem(id) {
    const db = getDB();
    const query = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const result = await db.collection(COLLECTIONS.MENU_ITEMS).deleteOne(query);
    return result.deletedCount > 0;
  }
};

module.exports = menuService;
