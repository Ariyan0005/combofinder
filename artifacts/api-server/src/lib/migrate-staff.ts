import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

export async function migrateStaff(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "staff" (
        "id"         serial PRIMARY KEY,
        "user_id"    integer NOT NULL,
        "name"       text    NOT NULL,
        "phone"      text,
        "staff_id"   text,
        "role"       text    NOT NULL DEFAULT 'Staff',
        "is_active"  boolean NOT NULL DEFAULT true,
        "notes"      text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    // Additive columns keep existing Owner/Staff records intact.
    await db.execute(sql`ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "username" text`);
    await db.execute(sql`ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "password_hash" text`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "staff_owner_username_idx" ON "staff" ("user_id", "username") WHERE "username" IS NOT NULL`);
    logger.info("migrateStaff: staff table ready");
  } catch (err) {
    logger.warn({ err }, "migrateStaff failed — skipping");
  }
}
