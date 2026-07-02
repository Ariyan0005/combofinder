import { Router, type IRouter } from "express";
import { sql, lte } from "drizzle-orm";
import { db, brandsTable, modelsTable, combosTable, customersTable, repairsTable, inventoryTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [brands] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(brandsTable);
  const [models] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(modelsTable);
  const [combos] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(combosTable);
  let totalCustomers = 0, activeRepairs = 0, lowStock = 0;
  try {
    const [c] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(customersTable);
    totalCustomers = c?.count ?? 0;
  } catch {}
  try {
    const [r] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(repairsTable).where(sql`status != 'Delivered'`);
    activeRepairs = r?.count ?? 0;
  } catch {}
  try {
    const [i] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(inventoryTable).where(lte(inventoryTable.quantity, inventoryTable.minStock));
    lowStock = i?.count ?? 0;
  } catch {}

  res.json({
    totalBrands: brands?.count ?? 0,
    totalModels: models?.count ?? 0,
    totalCombos: combos?.count ?? 0,
    totalCustomers,
    activeRepairs,
    lowStock,
  });
});

export default router;
