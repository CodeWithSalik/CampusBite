'use strict';

require('dotenv').config();
const { connectDB, closeDB, COLLECTIONS } = require('../server/config/database');

const SEED_MENU_ITEMS = [
  {
    name: 'Paneer Makhani Burger',
    description: 'Crispy seasoned spiced cottage cheese patty topped with rich butter makhani sauce and fresh iceberg lettuce.',
    price: 129,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 12
  },
  {
    name: 'Classic Veggie Delight Burger',
    description: 'Golden potato and herb patty with mint mayo, tomato slices, pickled gherkins on a toasted sesame bun.',
    price: 99,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 10
  },
  {
    name: 'Farmhouse Special Pizza (7")',
    description: 'Hand-stretched crust loaded with mozzarella, grilled paneer cubes, crisp capsicum, red onion, and sweet corn.',
    price: 189,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 15
  },
  {
    name: 'Fiery Jalapeno & Corn Pizza',
    description: 'Zesty tomato concasse, melted cheddar-mozzarella blend, spicy jalapenos, and oregano seasoning.',
    price: 169,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 14
  },
  {
    name: 'Crispy Peri-Peri Fries',
    description: 'Hot salted French fries tossed generously in African bird’s eye peri-peri spice dust with garlic dip.',
    price: 79,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 8
  },
  {
    name: 'Mumbai Samosa Pav Duo',
    description: 'Two golden spiced potato samosas tucked inside buttered pav with spicy garlic chutney and fried green chillies.',
    price: 60,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 5
  },
  {
    name: 'Chole Bhature Platter',
    description: 'Piping hot fluffy bhature served with slow-cooked Amritsari spicy chickpea curry, pickled onions and green mint dip.',
    price: 140,
    category: 'Indian Food',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 15
  },
  {
    name: 'Dal Makhani & Jeera Rice Bowl',
    description: 'Rich overnight black lentil curry with fresh cream and butter, paired with fragrant basmati cumin rice.',
    price: 150,
    category: 'Indian Food',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 10
  },
  {
    name: 'Thick Cold Coffee with Ice Cream',
    description: 'Blended arabica coffee brew with cold cream milk, topped with a scoop of rich vanilla ice cream and chocolate drizzle.',
    price: 85,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 6
  },
  {
    name: 'Masala Chai & Ginger Infusion',
    description: 'Freshly brewed Assam tea with crushed ginger, cardamom, cinnamon and milk.',
    price: 30,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 5
  },
  {
    name: 'Warm Chocolate Lava Cake',
    description: 'Decadent cocoa sponge cake with molten molten Belgian chocolate center, dusted with icing sugar.',
    price: 99,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 8
  },
  {
    name: 'Gulab Jamun (2 Pcs)',
    description: 'Traditional milk solids dumplings fried to perfection and soaked in warm rose-cardamom sugar syrup.',
    price: 50,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    preparationTime: 4
  }
];

async function seedMenu() {
  console.log('─── CampusBite Menu Seeder ───');

  if (!process.env.MONGODB_URI) {
    console.error('[Error] MONGODB_URI is not defined in environment variables or .env file.');
    console.error('Please configure your MongoDB Atlas connection string before running seed-menu.');
    process.exit(1);
  }

  try {
    const db = await connectDB();
    const collection = db.collection(COLLECTIONS.MENU_ITEMS);

    let inserted = 0;
    let skipped = 0;

    for (const item of SEED_MENU_ITEMS) {
      const existing = await collection.findOne({ name: item.name });
      if (!existing) {
        await collection.insertOne({
          ...item,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        inserted++;
      } else {
        skipped++;
      }
    }

    console.log(`[Seed] Menu seeding complete: ${inserted} items inserted, ${skipped} existing items preserved.`);
  } catch (err) {
    console.error('[Seed] Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

if (require.main === module) {
  seedMenu();
}

module.exports = seedMenu;
