/**
 * CampusBite — Menu & Catalogue Controller
 */
const Menu = {
  items: [],
  selectedCategory: 'all',
  searchQuery: '',

  // Fallback items representing authentic Indian Campus canteen options
  sampleItems: [
    {
      _id: 'sample-1',
      name: 'Paneer Makhani Burger',
      description: 'Crispy seasoned spiced cottage cheese patty topped with rich butter makhani sauce and fresh iceberg lettuce.',
      price: 129,
      category: 'Burgers',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 12
    },
    {
      _id: 'sample-2',
      name: 'Classic Veggie Delight Burger',
      description: 'Golden potato and herb patty with mint mayo, tomato slices, pickled gherkins on a toasted sesame bun.',
      price: 99,
      category: 'Burgers',
      image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 10
    },
    {
      _id: 'sample-3',
      name: 'Farmhouse Special Pizza (7")',
      description: 'Hand-stretched crust loaded with mozzarella, grilled paneer cubes, crisp capsicum, red onion, and sweet corn.',
      price: 189,
      category: 'Pizza',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 15
    },
    {
      _id: 'sample-4',
      name: 'Fiery Jalapeno & Corn Pizza',
      description: 'Zesty tomato concasse, melted cheddar-mozzarella blend, spicy jalapenos, and oregano seasoning.',
      price: 169,
      category: 'Pizza',
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 14
    },
    {
      _id: 'sample-5',
      name: 'Crispy Peri-Peri Fries',
      description: 'Hot salted French fries tossed generously in African bird’s eye peri-peri spice dust with garlic dip.',
      price: 79,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 8
    },
    {
      _id: 'sample-6',
      name: 'Mumbai Samosa Pav Duo',
      description: 'Two golden spiced potato samosas tucked inside buttered pav with spicy garlic chutney and fried green chillies.',
      price: 60,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 5
    },
    {
      _id: 'sample-7',
      name: 'Chole Bhature Platter',
      description: 'Piping hot fluffy bhature served with slow-cooked Amritsari spicy chickpea curry, pickled onions and green mint dip.',
      price: 140,
      category: 'Indian Food',
      image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 15
    },
    {
      _id: 'sample-8',
      name: 'Dal Makhani & Jeera Rice Bowl',
      description: 'Rich overnight black lentil curry with fresh cream and butter, paired with fragrant basmati cumin rice.',
      price: 150,
      category: 'Indian Food',
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 10
    },
    {
      _id: 'sample-9',
      name: 'Thick Cold Coffee with Ice Cream',
      description: 'Blended arabica coffee brew with cold cream milk, topped with a scoop of rich vanilla ice cream and chocolate drizzle.',
      price: 85,
      category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 6
    },
    {
      _id: 'sample-10',
      name: 'Masala Chai & Ginger Infusion',
      description: 'Freshly brewed Assam tea with crushed ginger, cardamom, cinnamon and milk.',
      price: 30,
      category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 5
    },
    {
      _id: 'sample-11',
      name: 'Warm Chocolate Lava Cake',
      description: 'Decadent cocoa sponge cake with molten molten Belgian chocolate center, dusted with icing sugar.',
      price: 99,
      category: 'Desserts',
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 8
    },
    {
      _id: 'sample-12',
      name: 'Gulab Jamun (2 Pcs)',
      description: 'Traditional milk solids dumplings fried to perfection and soaked in warm rose-cardamom sugar syrup.',
      price: 50,
      category: 'Desserts',
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      preparationTime: 4
    }
  ],

  async init() {
    await this.fetchMenu();
    this.renderCategoryBar();
    this.renderGrid();
    this.setupEventListeners();
  },

  async fetchMenu() {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/menu`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items) && data.items.length > 0) {
          this.items = data.items;
          return;
        }
      }
    } catch (e) {
      console.info('API menu endpoint unreachable or empty; loading fallback sample catalog.', e);
    }
    // Fallback if DB is empty or disconnected
    this.items = this.sampleItems;
  },

  renderCategoryBar() {
    const container = document.getElementById('category-bar');
    if (!container) return;

    container.innerHTML = CONFIG.CATEGORIES.map(cat => `
      <button class="category-pill ${this.selectedCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">
        <span>${cat.icon}</span>
        <span>${Utils.escapeHTML(cat.name)}</span>
      </button>
    `).join('');

    container.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCategory = btn.getAttribute('data-category');
        this.renderCategoryBar();
        this.renderGrid();
      });
    });
  },

  renderGrid() {
    const grid = document.getElementById('food-grid');
    if (!grid) return;

    let filtered = this.items;

    // Filter by Category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === this.selectedCategory);
    }

    // Filter by Search Query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <h3>No matching items found</h3>
          <p>Try searching with another keyword or pick a different category.</p>
          <button class="btn btn-outline" onclick="Menu.resetFilters()">View All Items</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(item => `
      <div class="food-card" data-id="${item._id}">
        <div class="food-card-img-wrapper">
          <img src="${Utils.escapeHTML(item.image)}" 
               alt="${Utils.escapeHTML(item.name)}" 
               class="food-card-img" 
               onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'food-card-img-fallback\\'><span>🍲</span><small>CampusBite</small></div>';">
          <span class="food-card-badge">
            <span class="badge ${item.isAvailable ? 'badge-success' : 'badge-danger'}">
              ${item.isAvailable ? '● Available' : '○ Sold Out'}
            </span>
          </span>
          <span class="food-card-preptime">
            ⏱️ ${item.preparationTime || 10} mins
          </span>
        </div>
        <div class="food-card-body">
          <div class="food-card-category">${Utils.escapeHTML(item.category)}</div>
          <h3 class="food-card-title">${Utils.escapeHTML(item.name)}</h3>
          <p class="food-card-desc">${Utils.escapeHTML(item.description)}</p>
          <div class="food-card-footer">
            <div class="food-card-price">
              ${Utils.formatCurrency(item.price)}
            </div>
            <button class="btn btn-primary btn-sm add-cart-btn" 
                    data-id="${item._id}" 
                    ${!item.isAvailable ? 'disabled' : ''}>
              ${item.isAvailable ? '+ Add to Cart' : 'Unavailable'}
            </button>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.add-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const item = this.items.find(i => String(i._id) === String(id));
        if (item) {
          Cart.addItem(item, 1);
        }
      });
    });
  },

  setupEventListeners() {
    const searchInput = document.getElementById('food-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderGrid();
      });
    }

    const searchBtn = document.getElementById('food-search-btn');
    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', () => {
        this.searchQuery = searchInput.value;
        this.renderGrid();
      });
    }
  },

  resetFilters() {
    this.selectedCategory = 'all';
    this.searchQuery = '';
    const searchInput = document.getElementById('food-search-input');
    if (searchInput) searchInput.value = '';
    this.renderCategoryBar();
    this.renderGrid();
  }
};
