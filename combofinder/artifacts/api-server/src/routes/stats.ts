import { Router, type IRouter } from "express";
import { sql, lte, eq, and } from "drizzle-orm";
import { db, brandsTable, modelsTable, compatibilitiesTable, customersTable, repairsTable, inventoryTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats", async (req: any, res): Promise<void> => {
  const userId: number | undefined = req.session?.authenticated && req.session?.userId ? req.session.userId : undefined;

  const [brands] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(brandsTable);
  const [models] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(modelsTable);
  const [compatibilities] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(compatibilitiesTable);

  let totalCustomers = 0, activeRepairs = 0, lowStock = 0;

  // Only show user-scoped stats when there is a real userId in session.
  // Without userId (e.g. env-based admin login on the web app) return 0
  // so the dashboard doesn't show other users' data.
  if (userId) {
    try {
      const [c] = await db.select({ count: sql<number>`cast(count(*) as int)` })
        .from(customersTable).where(eq(customersTable.userId, userId));
      totalCustomers = c?.count ?? 0;
    } catch {}

    try {
      const [r] = await db.select({ count: sql<number>`cast(count(*) as int)` })
        .from(repairsTable)
        .where(and(eq(repairsTable.userId, userId), sql`status != 'Delivered'`));
      activeRepairs = r?.count ?? 0;
    } catch {}

    try {
      const lowFilter = and(sql`${inventoryTable.minStock} > 0`, lte(inventoryTable.quantity, inventoryTable.minStock));
      const [i] = await db.select({ count: sql<number>`cast(count(*) as int)` })
        .from(inventoryTable).where(and(eq(inventoryTable.userId, userId), lowFilter));
      lowStock = i?.count ?? 0;
    } catch {}
  }

  res.json({
    totalBrands: brands?.count ?? 0,
    totalModels: models?.count ?? 0,
    totalCombos: compatibilities?.count ?? 0, // keep key name for frontend compat
    totalCompatibilities: compatibilities?.count ?? 0,
    totalCustomers,
    activeRepairs,
    lowStock,
  });
});

export default router;
