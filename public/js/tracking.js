/**
 * CampusBite — Order Tracking Controller (Real Backend Polling Connected)
 */
const Tracking = {
  order: null,
  pollInterval: null,
  stages: ['Placed', 'Preparing', 'Ready', 'Completed'],
  orderNumber: null,

  async init() {
    const urlParams = new URLSearchParams(window.location.search);
    this.orderNumber = urlParams.get('order');

    if (!this.orderNumber) {
      // Look up most recent order
      const recent = Utils.getStorage(CONFIG.STORAGE_KEYS.RECENT_ORDER, null);
      if (recent && recent.orderNumber) {
        this.orderNumber = recent.orderNumber;
      }
    }

    if (!this.orderNumber) {
      this.renderNoOrderFound();
      return;
    }

    await this.fetchOrderStatus();
    this.startPolling();
  },

  async fetchOrderStatus() {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/orders/number/${encodeURIComponent(this.orderNumber)}`);
      
      if (res.status === 401) {
        Utils.showToast('Please log in to track your order.', 'error');
        return;
      }

      if (res.status === 403) {
        Utils.showToast('Forbidden: You can only track your own campus orders.', 'error');
        return;
      }

      const data = await res.json();
      if (res.ok && data.success && data.order) {
        this.order = data.order;
        this.render();

        // If order reached terminal state (Completed or Cancelled), stop polling!
        if (this.order.status === 'Completed' || this.order.status === 'Cancelled') {
          this.stopPolling();
        }
      } else {
        throw new Error(data.error || 'Order not found');
      }
    } catch (err) {
      console.warn('Tracking fetch error:', err.message);
      // Fallback: check localStorage if offline
      const history = Utils.getStorage(CONFIG.STORAGE_KEYS.ORDER_HISTORY, []);
      const local = history.find(o => o.orderNumber === this.orderNumber);
      if (local) {
        this.order = local;
        this.render();
      }
    }
  },

  startPolling() {
    this.stopPolling();
    this.pollInterval = setInterval(async () => {
      await this.fetchOrderStatus();
    }, 4500); // Sensible 4.5s polling interval
  },

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  },

  renderNoOrderFound() {
    const banner = document.getElementById('status-banner');
    if (banner) {
      banner.innerHTML = `
        <div class="empty-state" style="padding:2rem;">
          <div class="empty-state-icon">🔍</div>
          <h3>No Order Selected</h3>
          <p>Please select an order from your order history to track live kitchen preparation.</p>
          <a href="/orders.html" class="btn btn-primary">View My Orders</a>
        </div>
      `;
    }
  },

  render() {
    const order = this.order;
    if (!order) return;

    const orderNumEl = document.getElementById('tracking-order-number');
    const prepTimeEl = document.getElementById('tracking-prep-time');
    const customerEl = document.getElementById('tracking-customer');
    const totalEl = document.getElementById('tracking-total');
    const itemsEl = document.getElementById('tracking-items-list');
    const paymentEl = document.getElementById('tracking-payment-info');

    if (orderNumEl) orderNumEl.textContent = '#' + order.orderNumber;
    if (prepTimeEl) {
      prepTimeEl.textContent = (order.estimatedPreparationTime || 12) + ' Mins (Approx.)';
    }
    if (customerEl) customerEl.textContent = order.customerName || 'Campus Student';
    if (totalEl) totalEl.textContent = Utils.formatCurrency(order.totalAmount);

    if (paymentEl) {
      paymentEl.innerHTML = `
        <span style="font-size:0.85rem; color:var(--color-text-muted);">
          Method: <strong>${Utils.escapeHTML(order.paymentMethod || 'Cash at Counter')}</strong>
          • Payment Status: <span class="badge ${order.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}">${order.paymentStatus || 'Pending'}</span>
        </span>
      `;
    }

    if (itemsEl && Array.isArray(order.items)) {
      itemsEl.innerHTML = order.items.map(i => `
        <div style="display:flex; justify-content:space-between; font-size:0.95rem; padding:0.4rem 0; border-bottom:1px solid var(--color-border-light);">
          <span>${i.quantity} × ${Utils.escapeHTML(i.name)}</span>
          <span style="font-weight:600;">${Utils.formatCurrency(i.price * i.quantity)}</span>
        </div>
      `).join('');
    }

    this.updateTimeline(order.status || 'Placed');
    this.renderCancelAction(order);
  },

  updateTimeline(currentStatus) {
    const timelineEl = document.querySelector('.timeline');
    const statusBanner = document.getElementById('status-banner');

    if (currentStatus === 'Cancelled') {
      if (timelineEl) timelineEl.style.display = 'none';
      if (statusBanner) {
        statusBanner.style.borderColor = 'var(--color-danger)';
        statusBanner.style.background = 'var(--color-danger-bg)';
        statusBanner.innerHTML = `
          <h2 style="font-size:1.4rem; color:var(--color-danger); margin-bottom:0.25rem;">✕ Order Cancelled</h2>
          <p style="color:var(--color-danger); font-size:0.92rem;">This order was cancelled prior to kitchen preparation.</p>
        `;
      }
      return;
    }

    if (timelineEl) timelineEl.style.display = 'flex';

    const stageIndex = this.stages.indexOf(currentStatus);
    const progressEl = document.getElementById('timeline-progress-bar');
    
    if (progressEl) {
      const percentage = stageIndex <= 0 ? 0 : (stageIndex / (this.stages.length - 1)) * 100;
      progressEl.style.width = `${percentage}%`;
    }

    this.stages.forEach((stage, idx) => {
      const stepEl = document.getElementById(`step-${stage.toLowerCase()}`);
      if (!stepEl) return;

      stepEl.classList.remove('active', 'completed');
      if (idx < stageIndex) {
        stepEl.classList.add('completed');
      } else if (idx === stageIndex) {
        stepEl.classList.add('active');
      }
    });

    if (statusBanner) {
      statusBanner.style.borderColor = 'var(--color-border)';
      statusBanner.style.background = 'var(--color-surface)';
      let desc = '';
      if (currentStatus === 'Placed') desc = 'Order logged in queue. Waiting for kitchen chef to start preparation.';
      if (currentStatus === 'Preparing') desc = 'Chef is actively preparing your hot meal at the kitchen station!';
      if (currentStatus === 'Ready') desc = 'Order is packed and ready! Please show your order token at the pickup counter.';
      if (currentStatus === 'Completed') desc = 'Order completed and collected. Enjoy your meal!';

      statusBanner.innerHTML = `
        <h2 style="font-size:1.35rem; margin-bottom:0.25rem;">Status: ${currentStatus}</h2>
        <p style="color:var(--color-text-muted); font-size:0.92rem;">${desc}</p>
      `;
    }
  },

  renderCancelAction(order) {
    let cancelWrapper = document.getElementById('tracking-cancel-wrapper');
    if (!cancelWrapper) {
      cancelWrapper = document.createElement('div');
      cancelWrapper.id = 'tracking-cancel-wrapper';
      cancelWrapper.style.marginTop = '1.5rem';
      cancelWrapper.style.textAlign = 'center';
      const mainCard = document.querySelector('.card.text-center');
      if (mainCard) mainCard.appendChild(cancelWrapper);
    }

    if (order.status === 'Placed') {
      cancelWrapper.innerHTML = `
        <button class="btn btn-outline btn-sm" style="color:var(--color-danger); border-color:var(--color-danger);" onclick="Tracking.cancelCurrentOrder()">
          Cancel This Order
        </button>
      `;
    } else {
      cancelWrapper.innerHTML = '';
    }
  },

  async cancelCurrentOrder() {
    if (!this.order) return;
    if (!confirm(`Are you sure you want to cancel order #${this.order.orderNumber}?`)) {
      return;
    }

    try {
      const id = this.order._id || this.order.orderNumber;
      const res = await fetch(`${CONFIG.API_BASE}/orders/${id}/cancel`, {
        method: 'POST'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Utils.showToast('Order cancelled.', 'info');
        await this.fetchOrderStatus();
      } else {
        Utils.showToast(data.error || 'Cancellation rejected.', 'error');
      }
    } catch (err) {
      Utils.showToast('Failed to cancel order.', 'error');
    }
  }
};

window.addEventListener('beforeunload', () => {
  Tracking.stopPolling();
});

document.addEventListener('DOMContentLoaded', () => {
  Tracking.init();
});
