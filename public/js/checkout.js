/**
 * CampusBite — Checkout Controller
 */
const Checkout = {
  init() {
    Cart.init();
    this.renderSummary();
    this.setupForm();
  },

  renderSummary() {
    const items = Cart.getItems();
    const container = document.getElementById('checkout-items-list');
    const emptyNotice = document.getElementById('checkout-empty-notice');
    const checkoutContent = document.getElementById('checkout-content');

    if (!items || items.length === 0) {
      if (emptyNotice) emptyNotice.style.display = 'block';
      if (checkoutContent) checkoutContent.style.display = 'none';
      return;
    }

    if (emptyNotice) emptyNotice.style.display = 'none';
    if (checkoutContent) checkoutContent.style.display = 'grid';

    if (container) {
      container.innerHTML = items.map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 0; border-bottom:1px solid var(--color-border-light);">
          <div>
            <div style="font-weight:600; font-size:0.95rem;">${Utils.escapeHTML(item.name)}</div>
            <div style="font-size:0.8rem; color:var(--color-text-muted);">Qty: ${item.quantity} × ${Utils.formatCurrency(item.price)}</div>
          </div>
          <div style="font-weight:700;">${Utils.formatCurrency(item.price * item.quantity)}</div>
        </div>
      `).join('');
    }

    const subtotalEl = document.getElementById('summary-subtotal');
    const taxEl = document.getElementById('summary-tax');
    const feeEl = document.getElementById('summary-fee');
    const totalEl = document.getElementById('summary-total');

    if (subtotalEl) subtotalEl.textContent = Utils.formatCurrency(Cart.getSubtotal());
    if (taxEl) taxEl.textContent = Utils.formatCurrency(Cart.getTax());
    if (feeEl) feeEl.textContent = Utils.formatCurrency(Cart.getConvenienceFee());
    if (totalEl) totalEl.textContent = Utils.formatCurrency(Cart.getTotal());
  },

  setupForm() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const items = Cart.getItems();
      if (items.length === 0) {
        Utils.showToast('Your cart is empty!', 'error');
        return;
      }

      const notes = document.getElementById('order-notes')?.value || '';
      const submitBtn = document.getElementById('place-order-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳ Processing order...</span>';
      }

      // Generate order record (saved in localStorage as mock demonstration, connected to backend in full flow)
      const orderNumber = 'CB-' + Math.floor(100000 + Math.random() * 900000);
      const user = Utils.getStorage(CONFIG.STORAGE_KEYS.USER, { name: 'Campus Student', email: 'student@campus.edu' });

      const newOrder = {
        _id: 'order-' + Date.now(),
        orderNumber: orderNumber,
        userId: user._id || 'guest',
        customerName: user.name,
        customerEmail: user.email,
        items: items.map(i => ({
          menuItemId: i._id,
          name: i.name,
          price: i.price,
          quantity: i.quantity
        })),
        totalAmount: Cart.getTotal(),
        paymentMethod: 'Cash at Counter',
        paymentStatus: 'Pending',
        status: 'Placed',
        estimatedPreparationTime: Math.max(...items.map(i => i.preparationTime || 15)),
        notes: notes,
        createdAt: new Date().toISOString()
      };

      // Save to recent order and order history
      Utils.setStorage(CONFIG.STORAGE_KEYS.RECENT_ORDER, newOrder);
      const history = Utils.getStorage(CONFIG.STORAGE_KEYS.ORDER_HISTORY, []);
      history.unshift(newOrder);
      Utils.setStorage(CONFIG.STORAGE_KEYS.ORDER_HISTORY, history);

      // Clear the cart
      Cart.clear();

      // Show confirmation modal/screen
      setTimeout(() => {
        const modal = document.getElementById('order-success-modal');
        if (modal) {
          document.getElementById('modal-order-number').textContent = orderNumber;
          document.getElementById('modal-order-total').textContent = Utils.formatCurrency(newOrder.totalAmount);
          modal.style.display = 'flex';
        } else {
          window.location.href = `/tracking.html?order=${orderNumber}`;
        }
      }, 700);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Checkout.init();
});
