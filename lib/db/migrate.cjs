#!/usr/bin/env node
/**
 * ComboFinder - Idempotent DB Migration Script
 * Runs directly via Node.js + pg, no drizzle-kit interactive prompts.
 * All statements use IF NOT EXISTS so reruns are always safe.
 */

"use strict";
// Force IPv4 — some VPS servers can't reach Supabase over IPv6
require("dns").setDefaultResultOrder("ipv4first");
const { Client } = require("pg");

const DB_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!DB_URL) {
  console.error("ERROR: SUPABASE_DATABASE_URL or DATABASE_URL must be set");
  process.exit(1);
}

const MIGRATIONS = [
  // ── Users ─────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    shop_name TEXT,
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD'`,
  `ALTER TABLE users ALTER COLUMN currency SET DEFAULT 'USD'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS shop_name TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'Free Technician'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'Free'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`,
  // is_approved: add with DEFAULT TRUE so existing users keep login access,
  // then flip the column default to FALSE for all new (unverified) registrations
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE users ALTER COLUMN is_approved SET DEFAULT FALSE`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email) WHERE email IS NOT NULL`,

  // ── Repairs ───────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS repairs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    customer_name TEXT,
    customer_phone TEXT,
    device_model TEXT,
    problem TEXT,
    status TEXT DEFAULT 'pending',
    price TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `ALTER TABLE repairs ADD COLUMN IF NOT EXISTS user_id INTEGER`,
  `ALTER TABLE repairs ADD COLUMN IF NOT EXISTS customer_id INTEGER`,

  // ── Inventory ─────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    name TEXT NOT NULL,
    sku TEXT,
    barcode TEXT,
    category_id INTEGER,
    supplier_id INTEGER,
    quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    purchase_price TEXT,
    selling_price TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `ALTER TABLE inventory ADD COLUMN IF NOT EXISTS user_id INTEGER`,

  // ── Customers ─────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id INTEGER`,

  // ── Expenses ──────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    title TEXT NOT NULL,
    amount TEXT NOT NULL,
    category TEXT,
    date TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id INTEGER`,

  // ── Sales ─────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    invoice_number TEXT NOT NULL UNIQUE,
    customer_id INTEGER,
    customer_name TEXT,
    customer_phone TEXT,
    subtotal TEXT NOT NULL,
    discount TEXT NOT NULL DEFAULT '0',
    total TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    status TEXT NOT NULL DEFAULT 'Completed',
    notes TEXT,
    date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `ALTER TABLE sales ADD COLUMN IF NOT EXISTS user_id INTEGER`,
  `ALTER TABLE sales ADD COLUMN IF NOT EXISTS advance_paid TEXT DEFAULT '0'`,

  `CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL,
    inventory_id INTEGER,
    part_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price TEXT NOT NULL,
    total TEXT NOT NULL,
    returned_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS sale_returns (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL,
    sale_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    refund_amount TEXT NOT NULL,
    reason TEXT,
    date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  // ── Ledger Accounts ───────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS ledger_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  // ── Ledger Entries ────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS ledger_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount TEXT NOT NULL,
    item_name TEXT,
    description TEXT,
    reference TEXT,
    date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS item_name TEXT`,

  // ── Suppliers ─────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,

  // ── Inventory Categories ───────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS inventory_categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    name TEXT NOT NULL,
    parent_id INTEGER REFERENCES inventory_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `ALTER TABLE inventory_categories ADD COLUMN IF NOT EXISTS user_id INTEGER`,
  `ALTER TABLE inventory_categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES inventory_categories(id) ON DELETE CASCADE`,

  // ── Part Categories ────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS part_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  // ── Parts (new schema: category_id + model_id FKs) ────────────────────
  `ALTER TABLE parts ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES part_categories(id) ON DELETE CASCADE`,
  `ALTER TABLE parts ADD COLUMN IF NOT EXISTS model_id INTEGER REFERENCES models(id) ON DELETE CASCADE`,

  // ── Step 1: Categories + Brands + Models + Compatibilities ──────────────

  // 1a. Create categories table
  `CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  // 1b. Seed the "Display" category
  `INSERT INTO categories (name, slug, sort_order)
   VALUES ('Display', 'display', 0)
   ON CONFLICT (slug) DO NOTHING`,

  // 1c. Create brands table if it doesn't exist
  `CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  // 1d. Add category_id FK to brands
  `ALTER TABLE brands ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL`,

  // 1e. Ensure category_id is nullable (previous agent may have set NOT NULL)
  `ALTER TABLE brands ALTER COLUMN category_id DROP NOT NULL`,

  // 1f. Create models table if it doesn't exist
  `CREATE TABLE IF NOT EXISTS models (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    release_year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  // 1g. Create compatibilities table if it doesn't exist
  `CREATE TABLE IF NOT EXISTS compatibilities (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    combo_type TEXT NOT NULL,
    quality_grade TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  // 1h. Copy data from combos → compatibilities if combos exists and compatibilities is empty.
  //     Only copies guaranteed columns (model_id, name, combo_type) — avoids errors if
  //     combos table is missing quality_grade / notes columns.
  `DO $
  DECLARE
    combos_exists BOOLEAN;
    compat_empty  BOOLEAN;
    rows_copied   INTEGER;
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'combos'
    ) INTO combos_exists;

    SELECT (COUNT(*) = 0) FROM compatibilities INTO compat_empty;

    IF combos_exists AND compat_empty THEN
      INSERT INTO compatibilities (model_id, name, combo_type, created_at)
      SELECT
        model_id,
        name,
        COALESCE(combo_type, 'Compatible'),
        COALESCE(created_at, NOW())
      FROM combos
      WHERE model_id IS NOT NULL AND name IS NOT NULL;

      GET DIAGNOSTICS rows_copied = ROW_COUNT;
      RAISE NOTICE 'Copied % rows from combos to compatibilities', rows_copied;
    END IF;
  END $$`,

  // 1i. Drop legacy columns if they exist
  `ALTER TABLE compatibilities DROP COLUMN IF EXISTS price_range`,
  `ALTER TABLE compatibilities DROP COLUMN IF EXISTS in_stock`,

  // 1j. If category_id exists on compatibilities (added by mistake), make it nullable
  `DO $
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'compatibilities' AND column_name = 'category_id'
    ) THEN
      ALTER TABLE compatibilities ALTER COLUMN category_id DROP NOT NULL;
    END IF;
  END $`,

  // ── Supplier Purchases ────────────────────────────────────────────────
  // Records each purchase from a supplier with payment status tracking
  `CREATE TABLE IF NOT EXISTS supplier_purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    supplier_name TEXT,
    stock_movement_id INTEGER,
    inventory_id INTEGER,
    product_name TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_amount TEXT NOT NULL,
    paid_amount TEXT NOT NULL,
    due_amount TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'credit',
    purchase_date TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  // ── Supplier Payments ─────────────────────────────────────────────────
  // Records each payment made to reduce supplier dues
  `CREATE TABLE IF NOT EXISTS supplier_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    supplier_name TEXT,
    purchase_id INTEGER,
    amount TEXT NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    date TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  // ── Password Reset / Email Verification Tokens ────────────────────────
  // Reused for both forgot-password OTPs and email verification OTPs
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
];

async function run() {
  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to database ✓");

    for (const sql of MIGRATIONS) {
      const preview = sql.trim().split("\n")[0].slice(0, 80);
      try {
        await client.query(sql);
        console.log("  OK:", preview);
      } catch (err) {
        console.warn("  WARN:", preview);
        console.warn("       ", err.message);
      }
    }

    console.log("\nDB migration complete ✓");
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
