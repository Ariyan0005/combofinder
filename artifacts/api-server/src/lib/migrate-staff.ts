import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

export async function migrateStaff(): Promise<void> {
  // Keep each statement independently retryable. Previously one failed
  // statement was swallowed, leaving a partially migrated table that later
  // made the staff insert fail with an opaque Drizzle query error.
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
  await db.execute(sql`ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "branch_id" text`);
  await db.execute(sql`ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "branch_name" text`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "staff_owner_username_idx" ON "staff" ("user_id", "username") WHERE "username" IS NOT NULL`);
  // Clean up and normalize any legacy 'Both' or invalid roles to 'Staff'
  await db.execute(sql`UPDATE "staff" SET "role" = 'Staff' WHERE LOWER("role") = 'both'`);
  logger.info("migrateStaff: staff table ready");
}
