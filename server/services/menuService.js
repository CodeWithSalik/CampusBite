'use strict';

const { ObjectId } = require('mongodb');
const { getDB, isConnected, COLLECTIONS } = require('../config/database');
const { validateMenuItemDocument } = require('../utils/dbValidators');
const { inMemoryMenuItems } = require('../config/mockStore');

const menuService = {
  /**
   * Get all menu items with optional category and availability filter
   */
  async getAllItems(filter = {}) {
    if (isConnected()) {
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
    }

    // In-memory fallback
    let items = [...inMemoryMenuItems];
    if (filter.category && filter.category !== 'all') {
      items = items.filter(i => i.category === filter.category);
    }
    if (filter.availableOnly) {
      items = items.filter(i => i.isAvailable);
    }
    return items;
  },

  /**
   * Get a single menu item by ID
   */
  async getItemById(id) {
    if (isConnected()) {
      const db = getDB();
      const query = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
      return db.collection(COLLECTIONS.MENU_ITEMS).findOne(query);
    }

    // In-memory lookup
    return inMemoryMenuItems.find(i => String(i._id) === String(id)) || null;
  },

  /**
   * Create a new menu item
   */
  async createItem(itemData) {
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

    if (isConnected()) {
      const db = getDB();
      const result = await db.collection(COLLECTIONS.MENU_ITEMS).insertOne(doc);
      return { _id: result.insertedId, ...doc };
    }

    // In-memory insertion
    const newItem = { _id: new ObjectId(), ...doc };
    inMemoryMenuItems.unshift(newItem);
    return newItem;
  },

  /**
   * Update an existing menu item
   */
  async updateItem(id, updateData) {
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    };
    if (updateFields.price) updateFields.price = Number(updateFields.price);
    if (updateFields.preparationTime) updateFields.preparationTime = Number(updateFields.preparationTime);

    if (isConnected()) {
      const db = getDB();
      const query = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
      return db.collection(COLLECTIONS.MENU_ITEMS).findOneAndUpdate(
        query,
        { $set: updateFields },
        { returnDocument: 'after' }
      );
    }

    const idx = inMemoryMenuItems.findIndex(i => String(i._id) === String(id));
    if (idx === -1) return null;
    inMemoryMenuItems[idx] = { ...inMemoryMenuItems[idx], ...updateFields };
    return inMemoryMenuItems[idx];
  },

  /**
   * Toggle item availability
   */
  async toggleAvailability(id, isAvailable) {
    return this.updateItem(id, { isAvailable: Boolean(isAvailable) });
  },

  /**
   * Delete a menu item
   */
  async deleteItem(id) {
    if (isConnected()) {
      const db = getDB();
      const query = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
      const result = await db.collection(COLLECTIONS.MENU_ITEMS).deleteOne(query);
      return result.deletedCount > 0;
    }

    const idx = inMemoryMenuItems.findIndex(i => String(i._id) === String(id));
    if (idx === -1) return false;
    inMemoryMenuItems.splice(idx, 1);
    return true;
  }
};

module.exports = menuService;
