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

    logger.info("migrateBranches: branches table and branch columns ready");
  } catch (err) { logger.warn({ err }, "migrateBranches failed — skipping"); }
}
