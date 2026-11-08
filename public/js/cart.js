/**
 * CampusBite — Cart Manager
 * Persists cart state in LocalStorage across page refreshes.
 */
const Cart = {
  items: [],

  init() {
    this.items = Utils.getStorage(CONFIG.STORAGE_KEYS.CART, []);
    this.updateNavbarCounter();
  },

  getItems() {
    return this.items;
  },

  save() {
    Utils.setStorage(CONFIG.STORAGE_KEYS.CART, this.items);
    this.updateNavbarCounter();
  },

  addItem(item, quantity = 1) {
    if (!item || !item._id) return;
    const existingIndex = this.items.findIndex(i => i._id === item._id);

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({
        _id: item._id,
        name: item.name,
        price: Number(item.price),
        category: item.category || 'Food',
        image: item.image || '',
        preparationTime: item.preparationTime || 15,
        quantity: quantity
      });
    }

    this.save();
    Utils.showToast(`Added "${item.name}" to cart!`, 'success');
  },

  updateQuantity(itemId, change) {
    const item = this.items.find(i => i._id === itemId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
      this.removeItem(itemId);
      return;
    }
    this.save();
  },

  removeItem(itemId) {
    const item = this.items.find(i => i._id === itemId);
    const itemName = item ? item.name : 'Item';
    this.items = this.items.filter(i => i._id !== itemId);
    this.save();
    Utils.showToast(`Removed "${itemName}" from cart`, 'info');
  },

  clear() {
    this.items = [];
    this.save();
  },

  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getTax() {
    return this.getSubtotal() * CONFIG.TAX_RATE;
  },

  getConvenienceFee() {
    return this.items.length > 0 ? CONFIG.CAMPUS_FEE : 0;
  },

  getTotal() {
    if (this.items.length === 0) return 0;
    return this.getSubtotal() + this.getTax() + this.getConvenienceFee();
  },

  updateNavbarCounter() {
    const badges = document.querySelectorAll('.cart-counter');
    const count = this.getCount();
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  }
};

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
  Cart.init();
});
