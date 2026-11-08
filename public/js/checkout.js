/**
 * CampusBite — Checkout Controller (Real Backend Connected)
 */
const Checkout = {
  idempotencyKey: null,
  isSubmitting: false,

  async init() {
    Cart.init();
    this.idempotencyKey = 'idemp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    this.renderSummary();
    this.setupForm();
    await this.verifyAuthentication();
  },

  async verifyAuthentication() {
    const user = await Auth.checkSession();
    const authWarning = document.getElementById('checkout-auth-warning');
    if (!user) {
      if (authWarning) {
        authWarning.style.display = 'block';
      } else {
        const content = document.getElementById('checkout-content');
        if (content) {
          const banner = document.createElement('div');
          banner.id = 'checkout-auth-warning';
          banner.className = 'alert alert-warning';
          banner.style.marginBottom = '1.5rem';
          banner.innerHTML = `
            <span>⚠️ Please <strong><a href="/login.html?redirect=checkout" style="text-decoration:underline;">Log In</a></strong> with your student account before placing an order.</span>
          `;
          content.parentElement.insertBefore(banner, content);
        }
      }
    } else if (authWarning) {
      authWarning.style.display = 'none';
    }
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

      if (this.isSubmitting) return;

      const items = Cart.getItems();
      if (items.length === 0) {
        Utils.showToast('Your cart is empty!', 'error');
        return;
      }

      // Check user session
      const user = await Auth.checkSession();
      if (!user) {
        Utils.showToast('Please log in with your student account to place orders.', 'error');
        setTimeout(() => {
          window.location.href = '/login.html?redirect=checkout';
        }, 1200);
        return;
      }

      const notes = document.getElementById('order-notes')?.value || '';
      const paymentMethodRadio = document.querySelector('input[name="paymentMethod"]:checked');
      const paymentMethod = paymentMethodRadio ? paymentMethodRadio.value : 'Cash at Counter';

      const submitBtn = document.getElementById('place-order-btn');
      this.isSubmitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳ Confirming order with canteen kitchen...</span>';
      }

      try {
        const payload = {
          items: items.map(i => ({
            menuItemId: i._id,
            quantity: Number(i.quantity)
          })),
          paymentMethod,
          notes,
          idempotencyKey: this.idempotencyKey
        };

        const res = await fetch(`${CONFIG.API_BASE}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': this.idempotencyKey
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success && data.order) {
          const order = data.order;

          // Clear shopping cart on successful placement
          Cart.clear();

          // Show confirmation modal
          const modal = document.getElementById('order-success-modal');
          if (modal) {
            document.getElementById('modal-order-number').textContent = '#' + order.orderNumber;
            document.getElementById('modal-order-total').textContent = Utils.formatCurrency(order.totalAmount);
            modal.style.display = 'flex';
          } else {
            window.location.href = `/tracking.html?order=${order.orderNumber}`;
          }
        } else {
          Utils.showToast(data.error || 'Failed to place order. Please review your cart.', 'error');
          this.isSubmitting = false;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Place Order Now ➔';
          }
        }
      } catch (err) {
        console.error('Order submission error:', err);
        Utils.showToast('Network error while placing order. Please try again.', 'error');
        this.isSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Place Order Now ➔';
        }
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Checkout.init();
});
