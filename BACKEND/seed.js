/**
 * seed.js — Bootstrap script for the student-based system.
 *
 * Run: node seed.js
 *
 * Creates:
 *  - First ADMIN user (if none exists)
 *  - Initialises the student user-number counter (if not already set)
 *
 * Safe to run multiple times (idempotent).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('./models/AdminUser');
const Counter = require('./models/Counter');
const { ensureCounter } = require('./services/userNumber.service');

const SEED_ADMIN = {
  name: 'Super Admin',
  email: 'admin@iitg.ac.in',
  password: 'Admin@1234',  // Change immediately after first login!
  role: 'ADMIN',
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ── Admin User ───────────────────────────────────────────────────────────
  const existing = await AdminUser.findOne({ email: SEED_ADMIN.email });
  if (existing) {
    console.log(`ℹ️  Admin user already exists: ${SEED_ADMIN.email}`);
  } else {
    const passwordHash = await AdminUser.hashPassword(SEED_ADMIN.password);
    await AdminUser.create({
      name: SEED_ADMIN.name,
      email: SEED_ADMIN.email,
      passwordHash,
      role: SEED_ADMIN.role,
    });
    console.log('✅ Created ADMIN user:');
    console.log(`   Email:    ${SEED_ADMIN.email}`);
    console.log(`   Password: ${SEED_ADMIN.password}`);
    console.log('   ⚠️  Change this password immediately after first login!');
  }

  // ── Student Counter ──────────────────────────────────────────────────────
  await ensureCounter();
  const counter = await Counter.findById('studentUserNumber');
  console.log(`✅ Student counter ready (current seq: ${counter?.seq ?? 100000})`);

  await mongoose.disconnect();
  console.log('✅ Seed complete');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
