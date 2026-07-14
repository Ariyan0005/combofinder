#!/usr/bin/env node
/**
 * ComboFinder - Idempotent DB Migration Script
 * Runs directly via Node.js + pg, no drizzle-kit interactive prompts.
 * All statements use IF NOT EXISTS / IF EXISTS so reruns are safe.
 */

"use strict";
const { Client } = require("pg");

const DB_URL =
  process.env.SUPABASE_DATABASE_URL ||
  process.env.DATABASE_URL;

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

  // ── Categories (for compatibility sections: Display, Battery, IC) ──────
  `CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  // ── Brands ────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  `ALTER TABLE brands ALTER COLUMN category_id DROP NOT NULL`,

  // ── Models ────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS models (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    release_year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  // ── Compatibilities ───────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS compatibilities (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    combo_type TEXT NOT NULL,
    quality_grade TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,
  // If previous agent added category_id as NOT NULL, make it nullable
  `DO $ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'compatibilities' AND column_name = 'category_id'
    ) THEN
      ALTER TABLE compatibilities ALTER COLUMN category_id DROP NOT NULL;
    END IF;
  END $`,

  // ── Password Reset Tokens ─────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token)`,
];

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log("Connected to database ✓");

    for (const sql of MIGRATIONS) {
      const preview = sql.trim().split("\n")[0].slice(0, 80);
      try {
        await client.query(sql);
        console.log("  OK:", preview);
      } catch (err) {
        // Non-fatal: log but keep going (e.g. column already exists with different type)
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
