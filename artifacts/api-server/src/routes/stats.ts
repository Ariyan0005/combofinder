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

  try {
    const q = db.select({ count: sql<number>`cast(count(*) as int)` }).from(customersTable);
    const [c] = userId ? await q.where(eq(customersTable.userId, userId)) : await q;
    totalCustomers = c?.count ?? 0;
  } catch {}

  try {
    const baseFilter = sql`status != 'Delivered'`;
    const [r] = userId
      ? await db.select({ count: sql<number>`cast(count(*) as int)` }).from(repairsTable)
          .where(and(eq(repairsTable.userId, userId), baseFilter))
      : await db.select({ count: sql<number>`cast(count(*) as int)` }).from(repairsTable).where(baseFilter);
    activeRepairs = r?.count ?? 0;
  } catch {}

  try {
    const lowFilter = and(sql`${inventoryTable.minStock} > 0`, lte(inventoryTable.quantity, inventoryTable.minStock));
    const [i] = userId
      ? await db.select({ count: sql<number>`cast(count(*) as int)` }).from(inventoryTable)
          .where(and(eq(inventoryTable.userId, userId), lowFilter))
      : await db.select({ count: sql<number>`cast(count(*) as int)` }).from(inventoryTable).where(lowFilter);
    lowStock = i?.count ?? 0;
  } catch {}

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
