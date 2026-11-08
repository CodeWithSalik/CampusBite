/**
 * CampusBite — Admin Dashboard Controller (Real Backend API Connected)
 * Full Order Management, Menu Management, and Live MongoDB Analytics.
 */
const Admin = {
  orders: [],
  menuItems: [],
  metrics: null,
  activeFilter: 'all',
  searchQuery: '',

  async init() {
    this.checkAdminAuth();
    await Promise.all([
      this.loadMenu(),
      this.loadOrders()
    ]);
  },

  checkAdminAuth() {
    const user = Utils.getStorage(CONFIG.STORAGE_KEYS.USER, null);
    const userEl = document.getElementById('admin-user-name');
    if (userEl && user) {
      userEl.textContent = user.name || 'Canteen Manager';
    }
  },

  async loadMenu() {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/menu`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          this.menuItems = data.items;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load menu from server:', e);
    }
    this.menuItems = [];
  },

  async loadOrders() {
    try {
      let url = `${CONFIG.API_BASE}/admin/orders?`;
      if (this.activeFilter && this.activeFilter !== 'all') {
        url += `status=${encodeURIComponent(this.activeFilter)}&`;
      }
      if (this.searchQuery && this.searchQuery.trim()) {
        url += `search=${encodeURIComponent(this.searchQuery.trim())}&`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          this.orders = data.orders;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load orders from admin API:', e);
    }
    this.orders = [];
  },

  async fetchDashboardTelemetry() {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/admin/dashboard`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          this.metrics = data.metrics;
          return data;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch dashboard telemetry:', e);
    }
    return null;
  },

  /* ─── Dashboard Tab ──────────────────────────────────────────────── */
  async renderDashboard() {
    const telemetry = await this.fetchDashboardTelemetry();
    await this.loadOrders();

    const m = (telemetry && telemetry.metrics) ? telemetry.metrics : {
      totalOrders: this.orders.length,
      todayOrdersCount: this.orders.length,
      grossOrderValue: this.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      totalCollectedRevenue: this.orders.filter(o => o.paymentStatus === 'Paid' && o.status !== 'Cancelled').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      activeKitchenOrders: this.orders.filter(o => o.status === 'Placed' || o.status === 'Preparing').length,
      completedOrders: this.orders.filter(o => o.status === 'Completed').length
    };

    const elTotal = document.getElementById('stat-total-orders');
    const elRevenue = document.getElementById('stat-revenue');
    const elPending = document.getElementById('stat-pending');
    const elCompleted = document.getElementById('stat-completed');

    if (elTotal) elTotal.textContent = m.totalOrders;
    if (elRevenue) elRevenue.textContent = Utils.formatCurrency(m.totalCollectedRevenue);
    if (elPending) elPending.textContent = m.activeKitchenOrders;
    if (elCompleted) elCompleted.textContent = m.completedOrders;

    // Recent orders stream (top 5)
    const tableBody = document.getElementById('recent-orders-tbody');
    if (tableBody) {
      const recent = this.orders.slice(0, 5);
      if (recent.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--color-text-muted);">No orders logged yet.</td></tr>`;
      } else {
        tableBody.innerHTML = recent.map(o => `
          <tr>
            <td><strong style="color:var(--color-primary);">#${Utils.escapeHTML(o.orderNumber)}</strong></td>
            <td>${Utils.escapeHTML(o.customerName || 'Student')}</td>
            <td>${(o.items || []).length} items</td>
            <td><strong>${Utils.formatCurrency(o.totalAmount)}</strong></td>
            <td>${this.getStatusBadge(o.status)}</td>
            <td>${new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
        `).join('');
      }
    }

    if (telemetry && Array.isArray(telemetry.dailyTrends)) {
      this.renderSalesChartWithData(telemetry.dailyTrends);
    } else {
      this.renderFallbackSalesChart();
    }
  },

  /* ─── Native SVG/CSS Chart ───────────────────────────────────────── */
  renderSalesChartWithData(dailyTrends) {
    const chartEl = document.getElementById('sales-bar-chart');
    if (!chartEl) return;

    if (!dailyTrends || dailyTrends.length === 0) {
      chartEl.innerHTML = '<div style="text-align:center; width:100%; color:var(--color-text-muted); padding:2rem;">No sales data available.</div>';
      return;
    }

    const max = Math.max(...dailyTrends.map(d => d.revenue), 100);

    chartEl.innerHTML = dailyTrends.map(d => {
      const heightPercent = Math.max(6, Math.round((d.revenue / max) * 100));
      return `
        <div class="bar-group">
          <div class="bar-value">₹${Math.round(d.revenue)}</div>
          <div class="bar-fill" style="height: ${heightPercent}%;"></div>
          <div class="bar-label">${Utils.escapeHTML(d.label)}</div>
        </div>
      `;
    }).join('');
  },

  renderFallbackSalesChart() {
    const chartEl = document.getElementById('sales-bar-chart');
    if (!chartEl) return;
    chartEl.innerHTML = `
      <div class="bar-group">
        <div class="bar-value">₹0</div>
        <div class="bar-fill" style="height: 10%;"></div>
        <div class="bar-label">Today</div>
      </div>
    `;
  },

  /* ─── Menu Management ────────────────────────────────────────────── */
  async renderMenuManagement() {
    await this.loadMenu();
    const tbody = document.getElementById('admin-menu-tbody');
    if (!tbody) return;

    if (this.menuItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--color-text-muted);">No menu items found. Click "+ Add New Food Item" above.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.menuItems.map(item => `
      <tr data-id="${item._id}">
        <td>
          <img src="${Utils.escapeHTML(item.image)}" 
               alt="${Utils.escapeHTML(item.name)}" 
               style="width:48px; height:48px; border-radius:var(--radius-sm); object-fit:cover; background:var(--color-surface-alt);"
               onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80';">
        </td>
        <td>
          <div style="font-weight:700;">${Utils.escapeHTML(item.name)}</div>
          <div style="font-size:0.8rem; color:var(--color-text-muted); max-width:260px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${Utils.escapeHTML(item.description)}</div>
        </td>
        <td><span class="badge badge-info">${Utils.escapeHTML(item.category)}</span></td>
        <td><strong>${Utils.formatCurrency(item.price)}</strong></td>
        <td>${item.preparationTime || 10} mins</td>
        <td>
          <label class="switch">
            <input type="checkbox" ${item.isAvailable ? 'checked' : ''} onchange="Admin.toggleItemAvailability('${item._id}', this.checked)">
            <span class="slider"></span>
          </label>
        </td>
        <td>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-secondary btn-sm" onclick="Admin.openEditModal('${item._id}')">Edit</button>
            <button class="btn btn-outline btn-sm" style="color:var(--color-danger); border-color:var(--color-danger);" onclick="Admin.confirmDelete('${item._id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  async toggleItemAvailability(itemId, isAvailable) {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Utils.showToast(`Updated availability to ${isAvailable ? 'Available' : 'Sold Out'}.`, 'success');
      } else {
        Utils.showToast(data.error || 'Failed to update availability', 'error');
      }
    } catch (e) {
      Utils.showToast('Network error while updating availability.', 'error');
    }
  },

  openAddModal() {
    document.getElementById('modal-item-id').value = '';
    document.getElementById('modal-item-title').textContent = 'Add New Menu Item';
    document.getElementById('item-form').reset();
    document.getElementById('item-modal').style.display = 'flex';
  },

  openEditModal(itemId) {
    const item = this.menuItems.find(i => String(i._id) === String(itemId));
    if (!item) return;

    document.getElementById('modal-item-id').value = item._id;
    document.getElementById('modal-item-title').textContent = 'Edit Menu Item';
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-category').value = item.category;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-preptime').value = item.preparationTime || 10;
    document.getElementById('item-desc').value = item.description || '';
    document.getElementById('item-image').value = item.image || '';
    document.getElementById('item-available').checked = item.isAvailable !== false;

    document.getElementById('item-modal').style.display = 'flex';
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  },

  async saveMenuItem(e) {
    e.preventDefault();
    const id = document.getElementById('modal-item-id').value;
    const name = document.getElementById('item-name').value.trim();
    const category = document.getElementById('item-category').value;
    const price = Number(document.getElementById('item-price').value);
    const preparationTime = Number(document.getElementById('item-preptime').value);
    const description = document.getElementById('item-desc').value.trim();
    const image = document.getElementById('item-image').value.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
    const isAvailable = document.getElementById('item-available').checked;

    if (!name || price <= 0) {
      Utils.showToast('Please enter valid item name and positive price.', 'error');
      return;
    }

    const payload = { name, category, price, preparationTime, description, image, isAvailable };

    try {
      const url = id ? `${CONFIG.API_BASE}/menu/${id}` : `${CONFIG.API_BASE}/menu`;
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Utils.showToast(id ? 'Menu item updated!' : 'New menu item created!', 'success');
        this.closeModal('item-modal');
        await this.renderMenuManagement();
      } else {
        Utils.showToast(data.error || 'Failed to save menu item.', 'error');
      }
    } catch (err) {
      Utils.showToast('Network error while saving item.', 'error');
    }
  },

  async confirmDelete(itemId) {
    const item = this.menuItems.find(i => String(i._id) === String(itemId));
    if (!item) return;

    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        const res = await fetch(`${CONFIG.API_BASE}/menu/${itemId}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.success) {
          Utils.showToast(`Deleted "${item.name}" from catalogue.`, 'info');
          await this.renderMenuManagement();
        } else {
          Utils.showToast(data.error || 'Failed to delete item.', 'error');
        }
      } catch (e) {
        Utils.showToast('Network error while deleting item.', 'error');
      }
    }
  },

  /* ─── Order Management ───────────────────────────────────────────── */
  async renderOrdersManagement() {
    await this.loadOrders();
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;

    if (this.orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:3rem; color:var(--color-text-muted);">
            No orders match the current filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.orders.map(order => {
      const isTerminal = order.status === 'Completed' || order.status === 'Cancelled';
      const isPaid = order.paymentStatus === 'Paid';

      return `
        <tr data-order-id="${order._id}">
          <td>
            <strong style="color:var(--color-primary); font-size:1.05rem;">#${Utils.escapeHTML(order.orderNumber)}</strong>
            <div style="font-size:0.75rem; color:var(--color-text-muted);">${new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </td>
          <td>
            <div style="font-weight:700;">${Utils.escapeHTML(order.customerName || 'Student')}</div>
            <div style="font-size:0.8rem; color:var(--color-text-muted);">${Utils.escapeHTML(order.customerEmail || '')}</div>
          </td>
          <td>
            <div style="font-size:0.88rem; max-width:240px;">
              ${(order.items || []).map(i => `<span style="display:inline-block; margin-right:0.4rem;"><strong>${i.quantity}x</strong> ${Utils.escapeHTML(i.name)}</span>`).join(', ')}
            </div>
            ${order.notes ? `<div style="font-size:0.78rem; color:#b45309; margin-top:0.25rem;">📝 ${Utils.escapeHTML(order.notes)}</div>` : ''}
          </td>
          <td>
            <strong style="font-size:1.05rem;">${Utils.formatCurrency(order.totalAmount)}</strong>
            <div style="font-size:0.78rem; color:var(--color-text-muted);">${Utils.escapeHTML(order.paymentMethod || 'Cash at Counter')}</div>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <span class="badge ${isPaid ? 'badge-success' : 'badge-warning'}">
                ${order.paymentStatus || 'Pending'}
              </span>
              ${!isPaid && order.status !== 'Cancelled' ? `
                <button class="btn btn-secondary btn-sm" style="font-size:0.7rem; padding:0.15rem 0.4rem;" onclick="Admin.markOrderPaid('${order._id}', '${order.orderNumber}')" title="Confirm Payment Received">
                  Mark Paid
                </button>
              ` : ''}
            </div>
          </td>
          <td>
            ${isTerminal ? `
              ${this.getStatusBadge(order.status)}
            ` : `
              <select class="form-control" style="padding:0.35rem 0.6rem; font-size:0.85rem; font-weight:600;" onchange="Admin.updateOrderStatus('${order._id}', this.value, '${order.orderNumber}')">
                <option value="Placed" ${order.status === 'Placed' ? 'selected' : ''}>1. Placed</option>
                <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>2. Preparing</option>
                <option value="Ready" ${order.status === 'Ready' ? 'selected' : ''}>3. Ready for Pickup</option>
                <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>4. Completed</option>
                <option value="Cancelled">✕ Cancel Order</option>
              </select>
            `}
          </td>
          <td>
            <span style="font-size:0.85rem; color:var(--color-text-muted);">
              ⏱️ ${order.estimatedPreparationTime || 12}m
            </span>
          </td>
        </tr>
      `;
    }).join('');
  },

  async updateOrderStatus(orderId, newStatus, orderNumber) {
    if (!newStatus) return;

    if (newStatus === 'Cancelled' && !confirm(`Are you sure you want to cancel order #${orderNumber}?`)) {
      await this.renderOrdersManagement();
      return;
    }

    try {
      const res = await fetch(`${CONFIG.API_BASE}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Utils.showToast(`Order #${orderNumber} transitioned to "${newStatus}".`, 'success');
        await this.renderOrdersManagement();
      } else {
        Utils.showToast(data.error || 'Failed to update status.', 'error');
        await this.renderOrdersManagement(); // Reset dropdown
      }
    } catch (e) {
      Utils.showToast('Network error while updating status.', 'error');
      await this.renderOrdersManagement();
    }
  },

  async markOrderPaid(orderId, orderNumber) {
    if (!confirm(`Confirm that payment for order #${orderNumber} was collected at the counter?`)) {
      return;
    }

    try {
      const res = await fetch(`${CONFIG.API_BASE}/admin/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'Paid' })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Utils.showToast(`Order #${orderNumber} payment marked as Paid!`, 'success');
        await this.renderOrdersManagement();
      } else {
        Utils.showToast(data.error || 'Failed to update payment.', 'error');
      }
    } catch (e) {
      Utils.showToast('Network error while marking payment.', 'error');
    }
  },

  /* ─── Analytics Tab ──────────────────────────────────────────────── */
  async renderAnalytics() {
    const telemetry = await this.fetchDashboardTelemetry();
    await this.loadOrders();

    const m = (telemetry && telemetry.metrics) ? telemetry.metrics : {
      totalOrders: this.orders.length,
      grossOrderValue: this.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      totalCollectedRevenue: this.orders.filter(o => o.paymentStatus === 'Paid' && o.status !== 'Cancelled').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      activeKitchenOrders: this.orders.filter(o => o.status === 'Placed' || o.status === 'Preparing').length
    };

    const revEl = document.getElementById('analytics-revenue');
    const ordEl = document.getElementById('analytics-orders');
    const aovEl = document.getElementById('analytics-aov');

    if (revEl) revEl.textContent = Utils.formatCurrency(m.totalCollectedRevenue);
    if (ordEl) ordEl.textContent = m.totalOrders;
    if (aovEl) {
      const settledCount = this.orders.filter(o => o.paymentStatus === 'Paid' && o.status !== 'Cancelled').length;
      aovEl.textContent = Utils.formatCurrency(settledCount > 0 ? m.totalCollectedRevenue / settledCount : 0);
    }

    // Render Status Distribution Bars
    const dist = (telemetry && telemetry.statusDistribution) ? telemetry.statusDistribution : {
      Placed: this.orders.filter(o => o.status === 'Placed').length,
      Preparing: this.orders.filter(o => o.status === 'Preparing').length,
      Ready: this.orders.filter(o => o.status === 'Ready').length,
      Completed: this.orders.filter(o => o.status === 'Completed').length,
      Cancelled: this.orders.filter(o => o.status === 'Cancelled').length
    };

    const totalCount = Object.values(dist).reduce((a, b) => a + b, 0);
    const statusContainer = document.getElementById('status-distribution-bars');
    if (statusContainer) {
      statusContainer.innerHTML = Object.entries(dist).map(([status, count]) => {
        const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
        let color = 'var(--color-primary)';
        if (status === 'Cancelled') color = 'var(--color-danger)';
        if (status === 'Completed') color = 'var(--color-success)';
        if (status === 'Preparing') color = 'var(--color-warning)';

        return `
          <div style="margin-bottom:1rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:0.35rem;">
              <span><strong>${status}</strong> (${count})</span>
              <span>${pct}%</span>
            </div>
            <div style="height:10px; background:var(--color-surface-alt); border-radius:var(--radius-full); overflow:hidden;">
              <div style="height:100%; width:${pct}%; background:${color}; border-radius:var(--radius-full);"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Top Selling Products
    const popContainer = document.getElementById('popular-products-tbody');
    if (popContainer) {
      const popItems = (telemetry && Array.isArray(telemetry.popularProducts)) ? telemetry.popularProducts : [];
      if (popItems.length === 0) {
        popContainer.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--color-text-muted);">No sales records logged yet.</td></tr>`;
      } else {
        popContainer.innerHTML = popItems.map((p, idx) => `
          <tr>
            <td><strong>#${idx + 1}</strong></td>
            <td><strong>${Utils.escapeHTML(p.name)}</strong></td>
            <td><span class="badge badge-info">${Utils.escapeHTML(p.category || 'Food')}</span></td>
            <td>${Utils.formatCurrency(p.price)}</td>
            <td><strong>${p.unitsSold} units</strong></td>
            <td>${p.orderFrequency} orders</td>
          </tr>
        `).join('');
      }
    }

    // Daily Sales Chart
    if (telemetry && Array.isArray(telemetry.dailyTrends)) {
      this.renderSalesChartWithData(telemetry.dailyTrends);
    }
  },

  getStatusBadge(status) {
    switch (status) {
      case 'Placed': return '<span class="badge badge-info">Placed</span>';
      case 'Preparing': return '<span class="badge badge-warning">Preparing</span>';
      case 'Ready': return '<span class="badge badge-success">Ready</span>';
      case 'Completed': return '<span class="badge badge-success">Completed</span>';
      case 'Cancelled': return '<span class="badge badge-danger">Cancelled</span>';
      default: return `<span class="badge badge-info">${Utils.escapeHTML(status)}</span>`;
    }
  }
};
