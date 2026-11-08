/**
 * CampusBite — Admin Dashboard Controller
 * Implements Menu Management, Order Management & Visual Analytics.
 */
const Admin = {
  // Demo baseline orders to ensure complete demonstrability even before live orders are recorded
  demoOrders: [
    {
      _id: 'adm-ord-1',
      orderNumber: 'CB-948101',
      customerName: 'Aditya Verma',
      customerEmail: 'aditya.v@univ.edu',
      items: [
        { name: 'Paneer Makhani Burger', price: 129, quantity: 2 },
        { name: 'Thick Cold Coffee', price: 85, quantity: 2 }
      ],
      totalAmount: 450.00,
      paymentMethod: 'Cash at Counter',
      paymentStatus: 'Paid',
      status: 'Completed',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      _id: 'adm-ord-2',
      orderNumber: 'CB-948102',
      customerName: 'Priya Nambiar',
      customerEmail: 'priya.n@univ.edu',
      items: [
        { name: 'Farmhouse Special Pizza (7")', price: 189, quantity: 1 },
        { name: 'Crispy Peri-Peri Fries', price: 79, quantity: 1 }
      ],
      totalAmount: 291.40,
      paymentMethod: 'UPI at Counter',
      paymentStatus: 'Pending',
      status: 'Preparing',
      createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
    },
    {
      _id: 'adm-ord-3',
      orderNumber: 'CB-948103',
      customerName: 'Rohan Mehra',
      customerEmail: 'rohan.m@univ.edu',
      items: [
        { name: 'Mumbai Samosa Pav Duo', price: 60, quantity: 3 },
        { name: 'Masala Chai', price: 30, quantity: 3 }
      ],
      totalAmount: 294.00,
      paymentMethod: 'Cash at Counter',
      paymentStatus: 'Pending',
      status: 'Placed',
      createdAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
      _id: 'adm-ord-4',
      orderNumber: 'CB-948104',
      customerName: 'Sneha Kapoor',
      customerEmail: 'sneha.k@univ.edu',
      items: [
        { name: 'Chole Bhature Platter', price: 140, quantity: 1 },
        { name: 'Gulab Jamun (2 Pcs)', price: 50, quantity: 1 }
      ],
      totalAmount: 209.50,
      paymentMethod: 'UPI at Counter',
      paymentStatus: 'Paid',
      status: 'Ready',
      createdAt: new Date(Date.now() - 900000).toISOString()
    }
  ],

  orders: [],
  menuItems: [],

  async init() {
    this.loadOrders();
    await this.loadMenu();
    this.checkAdminAuth();
  },

  checkAdminAuth() {
    const user = Utils.getStorage(CONFIG.STORAGE_KEYS.USER, null);
    const userEl = document.getElementById('admin-user-name');
    if (userEl && user) {
      userEl.textContent = user.name || 'Canteen Manager';
    }
  },

  loadOrders() {
    const stored = Utils.getStorage(CONFIG.STORAGE_KEYS.ORDER_HISTORY, []);
    // Combine live student orders with baseline demo orders
    this.orders = [...stored, ...this.demoOrders];
  },

  async loadMenu() {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/menu`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items) && data.items.length > 0) {
          this.menuItems = data.items;
          return;
        }
      }
    } catch (e) {
      console.info('Using fallback menu items for admin view');
    }
    // Fallback to sample items if database menu isn't seeded yet
    this.menuItems = Menu.sampleItems || [];
  },

  /* ─── Dashboard Tab ──────────────────────────────────────────────── */
  renderDashboard() {
    this.loadOrders();
    const totalOrders = this.orders.length;
    const revenue = this.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pending = this.orders.filter(o => o.status === 'Placed' || o.status === 'Preparing').length;
    const completed = this.orders.filter(o => o.status === 'Completed').length;

    const elTotal = document.getElementById('stat-total-orders');
    const elRevenue = document.getElementById('stat-revenue');
    const elPending = document.getElementById('stat-pending');
    const elCompleted = document.getElementById('stat-completed');

    if (elTotal) elTotal.textContent = totalOrders;
    if (elRevenue) elRevenue.textContent = Utils.formatCurrency(revenue);
    if (elPending) elPending.textContent = pending;
    if (elCompleted) elCompleted.textContent = completed;

    // Recent orders table
    const tableBody = document.getElementById('recent-orders-tbody');
    if (tableBody) {
      const recent = this.orders.slice(0, 5);
      tableBody.innerHTML = recent.map(o => `
        <tr>
          <td><strong style="color:var(--color-primary);">#${Utils.escapeHTML(o.orderNumber)}</strong></td>
          <td>${Utils.escapeHTML(o.customerName || 'Student')}</td>
          <td>${o.items.length} items</td>
          <td><strong>${Utils.formatCurrency(o.totalAmount)}</strong></td>
          <td>${this.getStatusBadge(o.status)}</td>
          <td>${new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        </tr>
      `).join('');
    }

    this.renderSalesChart();
  },

  /* ─── Native SVG/CSS Chart ───────────────────────────────────────── */
  renderSalesChart() {
    const chartEl = document.getElementById('sales-bar-chart');
    if (!chartEl) return;

    // Daily buckets for last 6 days
    const days = [
      { label: 'Mon', val: 3200 },
      { label: 'Tue', val: 4100 },
      { label: 'Wed', val: 3850 },
      { label: 'Thu', val: 5400 },
      { label: 'Fri', val: 6200 },
      { label: 'Today', val: 4950 }
    ];

    const max = Math.max(...days.map(d => d.val));

    chartEl.innerHTML = days.map(d => {
      const heightPercent = Math.round((d.val / max) * 100);
      return `
        <div class="bar-group">
          <div class="bar-value">₹${d.val}</div>
          <div class="bar-fill" style="height: ${heightPercent}%;"></div>
          <div class="bar-label">${d.label}</div>
        </div>
      `;
    }).join('');
  },

  /* ─── Menu Management ────────────────────────────────────────────── */
  renderMenuManagement() {
    const tbody = document.getElementById('admin-menu-tbody');
    if (!tbody) return;

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

  toggleItemAvailability(itemId, isAvailable) {
    const item = this.menuItems.find(i => String(i._id) === String(itemId));
    if (item) {
      item.isAvailable = isAvailable;
      Utils.showToast(`Updated "${item.name}" availability to ${isAvailable ? 'Available' : 'Sold Out'}.`, 'success');
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
    document.getElementById('item-available').checked = item.isAvailable;

    document.getElementById('item-modal').style.display = 'flex';
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  },

  saveMenuItem(e) {
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
      Utils.showToast('Please enter valid name and price', 'error');
      return;
    }

    if (id) {
      // Edit existing
      const idx = this.menuItems.findIndex(i => String(i._id) === String(id));
      if (idx > -1) {
        this.menuItems[idx] = { ...this.menuItems[idx], name, category, price, preparationTime, description, image, isAvailable };
        Utils.showToast('Item updated successfully', 'success');
      }
    } else {
      // Add new
      const newItem = {
        _id: 'custom-' + Date.now(),
        name,
        category,
        price,
        preparationTime,
        description,
        image,
        isAvailable,
        createdAt: new Date().toISOString()
      };
      this.menuItems.unshift(newItem);
      Utils.showToast('New menu item added!', 'success');
    }

    this.closeModal('item-modal');
    this.renderMenuManagement();
  },

  confirmDelete(itemId) {
    const item = this.menuItems.find(i => String(i._id) === String(itemId));
    if (!item) return;

    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      this.menuItems = this.menuItems.filter(i => String(i._id) !== String(itemId));
      Utils.showToast(`Deleted "${item.name}" from menu.`, 'info');
      this.renderMenuManagement();
    }
  },

  /* ─── Order Management ───────────────────────────────────────────── */
  renderOrdersManagement() {
    this.loadOrders();
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;

    tbody.innerHTML = this.orders.map(order => `
      <tr data-order-id="${order._id}">
        <td><strong style="color:var(--color-primary);">#${Utils.escapeHTML(order.orderNumber)}</strong></td>
        <td>
          <div style="font-weight:700;">${Utils.escapeHTML(order.customerName || 'Student')}</div>
          <div style="font-size:0.8rem; color:var(--color-text-muted);">${Utils.escapeHTML(order.customerEmail || '')}</div>
        </td>
        <td>
          <div style="font-size:0.88rem;">
            ${order.items.map(i => `${i.quantity}x ${Utils.escapeHTML(i.name)}`).join(', ')}
          </div>
        </td>
        <td><strong>${Utils.formatCurrency(order.totalAmount)}</strong></td>
        <td>
          <span class="badge ${order.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}">
            ${order.paymentStatus || 'Pending'}
          </span>
        </td>
        <td>
          <select class="form-control" style="padding:0.35rem 0.6rem; font-size:0.85rem;" onchange="Admin.updateOrderStatus('${order._id}', this.value)">
            <option value="Placed" ${order.status === 'Placed' ? 'selected' : ''}>Placed</option>
            <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
            <option value="Ready" ${order.status === 'Ready' ? 'selected' : ''}>Ready</option>
            <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </td>
        <td>${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
      </tr>
    `).join('');
  },

  updateOrderStatus(orderId, newStatus) {
    const order = this.orders.find(o => o._id === orderId);
    if (order) {
      order.status = newStatus;
      if (newStatus === 'Completed') {
        order.paymentStatus = 'Paid';
      }
      // Update in storage if local
      const stored = Utils.getStorage(CONFIG.STORAGE_KEYS.ORDER_HISTORY, []);
      const storedMatch = stored.find(o => o._id === orderId);
      if (storedMatch) {
        storedMatch.status = newStatus;
        Utils.setStorage(CONFIG.STORAGE_KEYS.ORDER_HISTORY, stored);
      }
      Utils.showToast(`Order #${order.orderNumber} status updated to ${newStatus}.`, 'success');
      this.renderOrdersManagement();
    }
  },

  /* ─── Analytics Tab ──────────────────────────────────────────────── */
  renderAnalytics() {
    this.loadOrders();
    const revenue = this.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalCount = this.orders.length;

    const revEl = document.getElementById('analytics-revenue');
    const ordEl = document.getElementById('analytics-orders');
    const aovEl = document.getElementById('analytics-aov');

    if (revEl) revEl.textContent = Utils.formatCurrency(revenue);
    if (ordEl) ordEl.textContent = totalCount;
    if (aovEl) aovEl.textContent = Utils.formatCurrency(totalCount > 0 ? revenue / totalCount : 0);

    // Render Status Distribution SVG Pie / Bar
    const statusCounts = {
      Placed: this.orders.filter(o => o.status === 'Placed').length,
      Preparing: this.orders.filter(o => o.status === 'Preparing').length,
      Ready: this.orders.filter(o => o.status === 'Ready').length,
      Completed: this.orders.filter(o => o.status === 'Completed').length
    };

    const statusContainer = document.getElementById('status-distribution-bars');
    if (statusContainer) {
      statusContainer.innerHTML = Object.entries(statusCounts).map(([status, count]) => {
        const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
        return `
          <div style="margin-bottom:1rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:0.35rem;">
              <span><strong>${status}</strong> (${count})</span>
              <span>${pct}%</span>
            </div>
            <div style="height:10px; background:var(--color-surface-alt); border-radius:var(--radius-full); overflow:hidden;">
              <div style="height:100%; width:${pct}%; background:var(--color-primary); border-radius:var(--radius-full);"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    this.renderSalesChart();
  },

  getStatusBadge(status) {
    switch (status) {
      case 'Placed': return '<span class="badge badge-info">Placed</span>';
      case 'Preparing': return '<span class="badge badge-warning">Preparing</span>';
      case 'Ready': return '<span class="badge badge-success">Ready</span>';
      case 'Completed': return '<span class="badge badge-success">Completed</span>';
      default: return `<span class="badge badge-info">${Utils.escapeHTML(status)}</span>`;
    }
  }
};
