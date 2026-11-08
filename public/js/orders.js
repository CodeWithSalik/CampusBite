/**
 * CampusBite — Order History Controller (Real Backend Connected)
 */
const Orders = {
  orders: [],
  isLoading: true,

  async init() {
    await this.fetchOrders();
  },

  async fetchOrders() {
    const listEl = document.getElementById('orders-list');
    const emptyEl = document.getElementById('orders-empty');
    if (!listEl) return;

    this.isLoading = true;
    listEl.innerHTML = `
      <div style="text-align:center; padding:3rem 1rem; color:var(--color-text-muted);">
        <div style="font-size:2rem; margin-bottom:0.5rem;">⏳</div>
        <p>Loading your orders from kitchen database...</p>
      </div>
    `;

    try {
      const res = await fetch(`${CONFIG.API_BASE}/orders/my`);
      
      if (res.status === 401) {
        listEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🔒</div>
            <h3>Authentication Required</h3>
            <p>Please log in with your campus account to view your past and active orders.</p>
            <a href="/login.html?redirect=orders" class="btn btn-primary">Sign In</a>
          </div>
        `;
        if (emptyEl) emptyEl.style.display = 'none';
        return;
      }

      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.orders)) {
        this.orders = data.orders;
        this.renderOrders();
      } else {
        throw new Error(data.error || 'Failed to fetch orders.');
      }
    } catch (err) {
      console.warn('Orders fetch error:', err);
      // Fallback to local storage if offline
      const stored = Utils.getStorage(CONFIG.STORAGE_KEYS.ORDER_HISTORY, []);
      if (stored.length > 0) {
        this.orders = stored;
        this.renderOrders();
      } else {
        listEl.innerHTML = `
          <div class="alert alert-danger" style="margin-top:1rem;">
            <span>⚠️ Could not load order history. Please check your connection and retry.</span>
          </div>
        `;
      }
    } finally {
      this.isLoading = false;
    }
  },

  renderOrders() {
    const listEl = document.getElementById('orders-list');
    const emptyEl = document.getElementById('orders-empty');
    if (!listEl) return;

    if (!this.orders || this.orders.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      listEl.innerHTML = '';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    listEl.innerHTML = this.orders.map(order => {
      const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const statusBadge = this.getStatusBadge(order.status);
      const paymentBadge = order.paymentStatus === 'Paid'
        ? '<span class="badge badge-success" style="font-size:0.75rem;">Paid</span>'
        : '<span class="badge badge-warning" style="font-size:0.75rem;">Payment Pending</span>';

      const canCancel = order.status === 'Placed';

      return `
        <div class="card" style="margin-bottom:1.5rem;" data-order-id="${order._id}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; border-bottom:1px solid var(--color-border-light); padding-bottom:1rem; margin-bottom:1rem;">
            <div>
              <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
                <h3 style="font-size:1.2rem;">#${Utils.escapeHTML(order.orderNumber)}</h3>
                ${statusBadge}
                ${paymentBadge}
              </div>
              <div style="font-size:0.85rem; color:var(--color-text-muted); margin-top:0.35rem;">Placed on ${dateStr}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:1.35rem; font-weight:800; color:var(--color-text);">${Utils.formatCurrency(order.totalAmount)}</div>
              <div style="font-size:0.8rem; color:var(--color-text-muted);">${Utils.escapeHTML(order.paymentMethod || 'Cash at Counter')}</div>
            </div>
          </div>

          <div style="margin-bottom:1rem;">
            <div style="font-size:0.85rem; font-weight:700; color:var(--color-text-muted); margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.04em;">Order Items</div>
            <div style="display:flex; flex-direction:column; gap:0.4rem;">
              ${(order.items || []).map(i => `
                <div style="display:flex; justify-content:space-between; font-size:0.92rem;">
                  <span>${i.quantity} × ${Utils.escapeHTML(i.name)}</span>
                  <span style="font-weight:600;">${Utils.formatCurrency(i.price * i.quantity)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-border-light); padding-top:0.85rem; flex-wrap:wrap; gap:0.75rem;">
            <div>
              ${canCancel ? `
                <button class="btn btn-outline btn-sm" style="color:var(--color-danger); border-color:var(--color-danger);" onclick="Orders.cancelOrder('${order._id}', '${order.orderNumber}')">
                  Cancel Order
                </button>
              ` : ''}
            </div>
            <div>
              <a href="/tracking.html?order=${encodeURIComponent(order.orderNumber)}" class="btn btn-primary btn-sm">
                Live Kitchen Tracking ➔
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  async cancelOrder(orderId, orderNumber) {
    if (!confirm(`Are you sure you want to cancel order #${orderNumber}?`)) {
      return;
    }

    try {
      const res = await fetch(`${CONFIG.API_BASE}/orders/${orderId}/cancel`, {
        method: 'POST'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Utils.showToast(`Order #${orderNumber} cancelled successfully.`, 'info');
        await this.fetchOrders();
      } else {
        Utils.showToast(data.error || 'Could not cancel order.', 'error');
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      Utils.showToast('Network error while cancelling order.', 'error');
    }
  },

  getStatusBadge(status) {
    switch (status) {
      case 'Placed':
        return '<span class="badge badge-info">● Placed</span>';
      case 'Preparing':
        return '<span class="badge badge-warning">🍳 Preparing</span>';
      case 'Ready':
        return '<span class="badge badge-success">🔔 Ready for Pickup</span>';
      case 'Completed':
        return '<span class="badge badge-success">✓ Picked Up</span>';
      case 'Cancelled':
        return '<span class="badge badge-danger">✕ Cancelled</span>';
      default:
        return `<span class="badge badge-info">${Utils.escapeHTML(status)}</span>`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Orders.init();
});
