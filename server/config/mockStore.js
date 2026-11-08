'use strict';

/**
 * CampusBite — In-Memory Store Fallback
 * Used seamlessly when MongoDB Atlas connection is offline / unconfigured,
 * ensuring all order workflows, validations, and tests remain runnable.
 */

const { ObjectId } = require('mongodb');

const inMemoryOrders = [];
const inMemoryUsers = [];
const inMemoryIdempotencyKeys = new Map(); // key -> { order, timestamp }

// Default sample menu items loaded into memory
const inMemoryMenuItems = [
  {
    _id: new ObjectId('60d5ecb8b5c9c62b3c7c1001'),
    name: 'Paneer Makhani Burger',
    description: 'Crispy seasoned spiced cottage cheese patty topped with rich butter makhani sauce and fresh iceberg lettuce.',
    price: 129,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId('60d5ecb8b5c9c62b3c7c1002'),
    name: 'Classic Veggie Delight Burger',
    description: 'Golden potato and herb patty with mint mayo, tomato slices, pickled gherkins on a toasted sesame bun.',
    price: 99,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 10,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId('60d5ecb8b5c9c62b3c7c1003'),
    name: 'Farmhouse Special Pizza (7")',
    description: 'Hand-stretched crust loaded with mozzarella, grilled paneer cubes, crisp capsicum, red onion, and sweet corn.',
    price: 189,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId('60d5ecb8b5c9c62b3c7c1004'),
    name: 'Fiery Jalapeno & Corn Pizza',
    description: 'Zesty tomato concasse, melted cheddar-mozzarella blend, spicy jalapenos, and oregano seasoning.',
    price: 169,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 14,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId('60d5ecb8b5c9c62b3c7c1005'),
    name: 'Crispy Peri-Peri Fries',
    description: 'Hot salted French fries tossed generously in African bird’s eye peri-peri spice dust with garlic dip.',
    price: 79,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 8,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId('60d5ecb8b5c9c62b3c7c1006'),
    name: 'Mumbai Samosa Pav Duo',
    description: 'Two golden spiced potato samosas tucked inside buttered pav with spicy garlic chutney and fried green chillies.',
    price: 60,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    isAvailable: false, // For testing unavailable item checks
    preparationTime: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId('60d5ecb8b5c9c62b3c7c1007'),
    name: 'Thick Cold Coffee with Ice Cream',
    description: 'Blended arabica coffee brew with cold cream milk, topped with a scoop of rich vanilla ice cream.',
    price: 85,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 6,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

module.exports = {
  inMemoryOrders,
  inMemoryUsers,
  inMemoryMenuItems,
  inMemoryIdempotencyKeys
};
