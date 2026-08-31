import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

export async function migrateBranches(): Promise<void> {
  try {
    await db.execute(sql.raw('CREATE TABLE IF NOT EXISTS "branches" ("id" serial PRIMARY KEY, "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "name" text NOT NULL, "code" text NOT NULL, "city" text NOT NULL, "address" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now())'));
    await db.execute(sql.raw("ALTER TABLE \"branches\" ADD COLUMN IF NOT EXISTS \"city\" text NOT NULL DEFAULT ''"));
    await db.execute(sql.raw("ALTER TABLE \"branches\" ADD COLUMN IF NOT EXISTS \"address\" text NOT NULL DEFAULT ''"));
    await db.execute(sql.raw('ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true'));
    await db.execute(sql.raw('ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "created_at" timestamp NOT NULL DEFAULT now()'));
    await db.execute(sql.raw('ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now()'));
    await db.execute(sql.raw('CREATE UNIQUE INDEX IF NOT EXISTS "branches_user_code_idx" ON "branches" ("user_id", lower("code"))'));
    await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS "branches_user_id_idx" ON "branches" ("user_id")'));

    // Safe column additions for multi-branch support
    await db.execute(sql.raw('ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "branch_id" integer'));
    await db.execute(sql.raw('ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "branch_name" text'));

    await db.execute(sql.raw('ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "branch_id" integer'));
    await db.execute(sql.raw('ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "branch_name" text'));

    await db.execute(sql.raw('ALTER TABLE "repairs" ADD COLUMN IF NOT EXISTS "branch_id" integer'));
    await db.execute(sql.raw('ALTER TABLE "repairs" ADD COLUMN IF NOT EXISTS "branch_name" text'));

    await db.execute(sql.raw('ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "branch_id" integer'));
    await db.execute(sql.raw('ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "branch_name" text'));

    await db.execute(sql.raw('ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "branch_id" integer'));
    await db.execute(sql.raw('ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "branch_name" text'));
    await db.execute(sql.raw('ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "branch_id" integer'));
    await db.execute(sql.raw('ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "branch_name" text'));
    await db.execute(sql.raw('ALTER TABLE "ledger_accounts" ADD COLUMN IF NOT EXISTS "branch_id" integer'));
    await db.execute(sql.raw('ALTER TABLE "ledger_accounts" ADD COLUMN IF NOT EXISTS "branch_name" text'));
    await db.execute(sql.raw('ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "branch_id" integer'));
    await db.execute(sql.raw('ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "branch_name" text'));
    await db.execute(sql.raw('ALTER TABLE "supplier_purchases" ADD COLUMN IF NOT EXISTS "branch_id" integer'));
    await db.execute(sql.raw('ALTER TABLE "supplier_purchases" ADD COLUMN IF NOT EXISTS "branch_name" text'));
    await db.execute(sql.raw('ALTER TABLE "supplier_payments" ADD COLUMN IF NOT EXISTS "branch_id" integer'));
    await db.execute(sql.raw('ALTER TABLE "supplier_payments" ADD COLUMN IF NOT EXISTS "branch_name" text'));
    await db.execute(sql.raw('ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "user_id" integer'));
    await db.execute(sql.raw('ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "branch_id" integer'));
    await db.execute(sql.raw('ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "branch_name" text'));

    await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS "customers_user_branch_idx" ON "customers" ("user_id", "branch_id")'));
    await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS "suppliers_user_branch_idx" ON "suppliers" ("user_id", "branch_id")'));
    await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS "ledger_accounts_user_branch_idx" ON "ledger_accounts" ("user_id", "branch_id")'));
    await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS "ledger_entries_user_branch_idx" ON "ledger_entries" ("user_id", "branch_id")'));
    await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS "supplier_purchases_user_branch_idx" ON "supplier_purchases" ("user_id", "branch_id")'));
    await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS "supplier_payments_user_branch_idx" ON "supplier_payments" ("user_id", "branch_id")'));
    await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS "stock_movements_user_branch_idx" ON "stock_movements" ("user_id", "branch_id")'));

    logger.info("migrateBranches: branches table and branch columns ready");
  } catch (err) { logger.warn({ err }, "migrateBranches failed — skipping"); }
}
