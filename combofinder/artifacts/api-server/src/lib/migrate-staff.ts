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
    logger.info("migrateStaff: staff table ready");
  } catch (err) {
    logger.warn({ err }, "migrateStaff failed — skipping");
  }
}
