/**
 * CampusBite — Order Tracking Controller
 */
const Tracking = {
  order: null,
  stages: ['Placed', 'Preparing', 'Ready', 'Completed'],

  init() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderNum = urlParams.get('order');

    if (orderNum) {
      const history = Utils.getStorage(CONFIG.STORAGE_KEYS.ORDER_HISTORY, []);
      this.order = history.find(o => o.orderNumber === orderNum);
    }

    if (!this.order) {
      this.order = Utils.getStorage(CONFIG.STORAGE_KEYS.RECENT_ORDER, null);
    }

    // If still no order, create a realistic mock order for demonstration
    if (!this.order) {
      this.order = {
        orderNumber: 'CB-948122',
        customerName: 'Student User',
        items: [
          { name: 'Paneer Makhani Burger', price: 129, quantity: 1 },
          { name: 'Crispy Peri-Peri Fries', price: 79, quantity: 1 }
        ],
        totalAmount: 218.40,
        paymentMethod: 'Cash at Counter',
        status: 'Preparing',
        estimatedPreparationTime: 12,
        createdAt: new Date().toISOString()
      };
    }

    this.render();
  },

  render() {
    const order = this.order;
    const orderNumEl = document.getElementById('tracking-order-number');
    const prepTimeEl = document.getElementById('tracking-prep-time');
    const customerEl = document.getElementById('tracking-customer');
    const totalEl = document.getElementById('tracking-total');
    const itemsEl = document.getElementById('tracking-items-list');

    if (orderNumEl) orderNumEl.textContent = '#' + order.orderNumber;
    if (prepTimeEl) prepTimeEl.textContent = (order.estimatedPreparationTime || 12) + ' Mins';
    if (customerEl) customerEl.textContent = order.customerName || 'Campus Student';
    if (totalEl) totalEl.textContent = Utils.formatCurrency(order.totalAmount);

    if (itemsEl && Array.isArray(order.items)) {
      itemsEl.innerHTML = order.items.map(i => `
        <div style="display:flex; justify-content:space-between; font-size:0.95rem; padding:0.4rem 0;">
          <span>${i.quantity} × ${Utils.escapeHTML(i.name)}</span>
          <span style="font-weight:600;">${Utils.formatCurrency(i.price * i.quantity)}</span>
        </div>
      `).join('');
    }

    this.updateTimeline(order.status || 'Placed');
  },

  updateTimeline(currentStatus) {
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

    const statusBanner = document.getElementById('status-banner');
    if (statusBanner) {
      let desc = '';
      if (currentStatus === 'Placed') desc = 'Order received by the canteen counter.';
      if (currentStatus === 'Preparing') desc = 'Chef is preparing your hot fresh meal!';
      if (currentStatus === 'Ready') desc = 'Order is packed and ready! Please show order # at the pickup counter.';
      if (currentStatus === 'Completed') desc = 'Order completed. Enjoy your CampusBite meal!';

      statusBanner.innerHTML = `
        <h2 style="font-size:1.4rem; margin-bottom:0.35rem;">Status: ${currentStatus}</h2>
        <p style="color:var(--color-text-muted);">${desc}</p>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Tracking.init();
});
