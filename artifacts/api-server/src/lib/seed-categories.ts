import { db, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const DEFAULT_CATEGORIES = [
  { name: "IC Compatibility", slug: "ic",      icon: "cpu",          sortOrder: 1 },
  { name: "Battery",          slug: "battery",  icon: "battery",      sortOrder: 2 },
  { name: "ISP & Pinout",     slug: "isp",      icon: "circuit-board", sortOrder: 3 },
];

export async function seedCategories(): Promise<void> {
  try {
    for (const cat of DEFAULT_CATEGORIES) {
      const existing = await db
        .select({ id: categoriesTable.id })
        .from(categoriesTable)
        .where(eq(categoriesTable.slug, cat.slug))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(categoriesTable).values(cat);
        logger.info({ slug: cat.slug }, "Seeded default category");
      }
    }
  } catch (err) {
    // Non-fatal: log and continue. Category can still be created manually.
    logger.warn({ err }, "seedCategories failed — skipping");
  }
}
