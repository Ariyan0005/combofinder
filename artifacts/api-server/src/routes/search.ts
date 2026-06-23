import { Router, type IRouter } from "express";
import { ilike, eq, or, sql } from "drizzle-orm";
import { db, brandsTable, modelsTable, combosTable } from "@workspace/db";
import { SearchModelsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/search", async (req, res): Promise<void> => {
  const params = SearchModelsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const q = params.data.q?.trim() ?? "";
  const brandId = params.data.brand_id;

  const brandsQuery = db
    .select({
      id: brandsTable.id,
      name: brandsTable.name,
      logoUrl: brandsTable.logoUrl,
      createdAt: brandsTable.createdAt,
      modelCount: sql<number>`cast(count(${modelsTable.id}) as int)`,
    })
    .from(brandsTable)
    .leftJoin(modelsTable, eq(modelsTable.brandId, brandsTable.id))
    .groupBy(brandsTable.id);

  const modelsQuery = db
    .select({
      id: modelsTable.id,
      brandId: modelsTable.brandId,
      brandName: brandsTable.name,
      name: modelsTable.name,
      releaseYear: modelsTable.releaseYear,
      imageUrl: modelsTable.imageUrl,
      createdAt: modelsTable.createdAt,
      comboCount: sql<number>`cast(count(${combosTable.id}) as int)`,
    })
    .from(modelsTable)
    .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
    .leftJoin(combosTable, eq(combosTable.modelId, modelsTable.id))
    .groupBy(modelsTable.id, brandsTable.name);

  let brands: typeof brandsQuery extends Promise<infer T> ? T : never;
  let models: typeof modelsQuery extends Promise<infer T> ? T : never;

  if (q) {
    [brands, models] = await Promise.all([
      brandsQuery.where(ilike(brandsTable.name, `%${q}%`)),
      modelsQuery.where(or(ilike(modelsTable.name, `%${q}%`), ilike(brandsTable.name, `%${q}%`))),
    ]);
  } else if (brandId) {
    [brands, models] = await Promise.all([
      brandsQuery.where(eq(brandsTable.id, brandId)),
      modelsQuery.where(eq(modelsTable.brandId, brandId)),
    ]);
  } else {
    [brands, models] = await Promise.all([
      brandsQuery.limit(20),
      modelsQuery.limit(20),
    ]);
  }

  res.json({ brands, models });
});

export default router;
