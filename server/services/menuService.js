'use strict';

const { ObjectId } = require('mongodb');
const { connectDB, getDB, isConnected, COLLECTIONS } = require('../config/database');
const { validateMenuItemDocument } = require('../utils/dbValidators');
const { inMemoryMenuItems } = require('../config/mockStore');

/**
 * Helper to ensure a live database connection or throw a 503 error in production.
 */
async function resolveDB() {
  if (isConnected()) {
    return getDB();
  }

  if (process.env.MONGODB_URI) {
    try {
      return await connectDB();
    } catch (err) {
      console.error('[Menu Service Diagnostic] Database connection unavailable during menu operation:', err.message);
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

const menuService = {
  /**
   * Get all menu items with optional category and availability filter
   */
  async getAllItems(filter = {}) {
    const db = await resolveDB();

    if (db) {
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

    // In-memory fallback (local standalone mock mode only)
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
    const db = await resolveDB();

    if (db) {
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
      image: itemData.image || itemData.imageUrl || '',
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

    const db = await resolveDB();

    if (db) {
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

    const db = await resolveDB();

    if (db) {
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
    const db = await resolveDB();

    if (db) {
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
