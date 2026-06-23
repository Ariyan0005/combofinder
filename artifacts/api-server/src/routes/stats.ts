import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, brandsTable, modelsTable, combosTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [brands] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(brandsTable);
  const [models] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(modelsTable);
  const [combos] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(combosTable);
  res.json({
    totalBrands: brands?.count ?? 0,
    totalModels: models?.count ?? 0,
    totalCombos: combos?.count ?? 0,
  });
});

export default router;
