/**
 * CampusBite — Client Configuration
 */
const CONFIG = {
  API_BASE: '/api',
  CURRENCY_SYMBOL: '₹',
  TAX_RATE: 0.05, // 5% GST
  CAMPUS_FEE: 10,  // ₹10 campus convenience charge
  STORAGE_KEYS: {
    CART: 'campusbite_cart',
    USER: 'campusbite_user',
    RECENT_ORDER: 'campusbite_recent_order',
    ORDER_HISTORY: 'campusbite_orders'
  },
  CATEGORIES: [
    { id: 'all', name: 'All Items', icon: '🍽️' },
    { id: 'Burgers', name: 'Burgers', icon: '🍔' },
    { id: 'Pizza', name: 'Pizza', icon: '🍕' },
    { id: 'Snacks', name: 'Snacks', icon: '🍟' },
    { id: 'Indian Food', name: 'Indian Food', icon: '🍛' },
    { id: 'Beverages', name: 'Beverages', icon: '🥤' },
    { id: 'Desserts', name: 'Desserts', icon: '🍨' }
  ]
};
