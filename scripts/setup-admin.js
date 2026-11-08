'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, closeDB, COLLECTIONS } = require('../server/config/database');
const { validateEmail, normalizeEmail } = require('../server/utils/dbValidators');

const SALT_ROUNDS = 10;

/**
 * Secure one-time administrator account creation script.
 * Reads credentials securely from environment variables.
 * Never prints passwords in logs.
 */
async function setupAdmin() {
  console.log('─── CampusBite Secure Admin Account Setup ───');

  const adminName = process.env.ADMIN_NAME || 'Campus Administrator';
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('[Error] Missing required environment variables:');
    if (!adminEmail) console.error('  - ADMIN_EMAIL is required');
    if (!adminPassword) console.error('  - ADMIN_PASSWORD is required');
    console.error('\nUsage: Pass ADMIN_EMAIL and ADMIN_PASSWORD via .env or CLI environment, e.g.:');
    console.error('  $env:ADMIN_EMAIL="admin@campusbite.edu"; $env:ADMIN_PASSWORD="SecurePassword123!"; node scripts/setup-admin.js');
    process.exit(1);
  }

  if (!validateEmail(adminEmail)) {
    console.error('[Error] ADMIN_EMAIL must be a valid email format.');
    process.exit(1);
  }

  if (adminPassword.length < 8) {
    console.error('[Error] ADMIN_PASSWORD must be at least 8 characters long for security.');
    process.exit(1);
  }

  const normalizedEmail = normalizeEmail(adminEmail);

  try {
    const db = await connectDB();
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // Prevent duplicate admin creation
    const existing = await usersCollection.findOne({ email: normalizedEmail });
    if (existing) {
      console.log(`[Admin Setup] An account with email "${normalizedEmail}" already exists.`);
      if (existing.role === 'admin') {
        console.log('  Notice: This user is already an Administrator. No changes made.');
      } else {
        console.log('  Notice: Existing account has role: ' + existing.role + '. Not modifying automatically.');
      }
      return;
    }

    // Hash password securely
    const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

    const doc = {
      name: adminName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(doc);
    console.log(`[Admin Setup] Administrator account created successfully!`);
    console.log(`  - Admin Name: ${doc.name}`);
    console.log(`  - Admin Email: ${doc.email}`);
    console.log(`  - User ID: ${result.insertedId}`);
    console.log(`  - Password status: Hashed with bcrypt (not logged).`);
  } catch (err) {
    console.error('[Admin Setup] Failed to create administrator:', err.message);
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

if (require.main === module) {
  setupAdmin();
}

module.exports = setupAdmin;
