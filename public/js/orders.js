/**
 * CampusBite — Order History Controller
 */
const Orders = {
  init() {
    this.renderOrders();
  },

  getOrders() {
    return Utils.getStorage(CONFIG.STORAGE_KEYS.ORDER_HISTORY, []);
  },

  renderOrders() {
    const listEl = document.getElementById('orders-list');
    const emptyEl = document.getElementById('orders-empty');
    if (!listEl) return;

    const orders = this.getOrders();

    if (!orders || orders.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      listEl.innerHTML = '';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    listEl.innerHTML = orders.map(order => {
      const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const statusBadge = this.getStatusBadge(order.status);

      return `
        <div class="card" style="margin-bottom:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; border-bottom:1px solid var(--color-border-light); padding-bottom:1rem; margin-bottom:1rem;">
            <div>
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <h3 style="font-size:1.15rem;">#${Utils.escapeHTML(order.orderNumber)}</h3>
                ${statusBadge}
              </div>
              <div style="font-size:0.85rem; color:var(--color-text-muted); margin-top:0.25rem;">Placed on ${dateStr}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:1.25rem; font-weight:800; color:var(--color-text);">${Utils.formatCurrency(order.totalAmount)}</div>
              <div style="font-size:0.8rem; color:var(--color-text-muted);">${Utils.escapeHTML(order.paymentMethod || 'Cash at Counter')}</div>
            </div>
          </div>

          <div style="margin-bottom:1rem;">
            <div style="font-size:0.85rem; font-weight:700; color:var(--color-text-muted); margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.04em;">Order Items</div>
            <div style="display:flex; flex-direction:column; gap:0.4rem;">
              ${order.items.map(i => `
                <div style="display:flex; justify-content:space-between; font-size:0.92rem;">
                  <span>${i.quantity} × ${Utils.escapeHTML(i.name)}</span>
                  <span style="font-weight:600;">${Utils.formatCurrency(i.price * i.quantity)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.75rem; border-top:1px solid var(--color-border-light); padding-top:0.85rem;">
            <a href="/tracking.html?order=${encodeURIComponent(order.orderNumber)}" class="btn btn-primary btn-sm">
              Live Track Order ➔
            </a>
          </div>
        </div>
      `;
    }).join('');
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
        return '<span class="badge badge-success">✓ Completed</span>';
      default:
        return `<span class="badge badge-info">${Utils.escapeHTML(status)}</span>`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Orders.init();
});
