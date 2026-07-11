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

  // ── Step 1: Categories + Brands category_id + Rename combos → compatibilities ──

  // 1a. Create categories table
  `CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  // 1b. Seed the "Display" category
  `INSERT INTO categories (name, slug, sort_order)
   VALUES ('Display', 'display', 0)
   ON CONFLICT (slug) DO NOTHING`,

  // 1c. Add category_id FK to brands
  `ALTER TABLE brands ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL`,

  // 1d. Backfill all existing brand rows to Display category
  `UPDATE brands
   SET category_id = (SELECT id FROM categories WHERE slug = 'display')
   WHERE category_id IS NULL`,

  // 1e. Rename combos table → compatibilities (idempotent)
  `DO $ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'combos'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'compatibilities'
    ) THEN
      ALTER TABLE combos RENAME TO compatibilities;
    END IF;
  END $`,

  // 1f. Drop price_range column (data not needed)
  `ALTER TABLE compatibilities DROP COLUMN IF EXISTS price_range`,

  // 1g. Drop in_stock column (data not needed)
  `ALTER TABLE compatibilities DROP COLUMN IF EXISTS in_stock`,
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
