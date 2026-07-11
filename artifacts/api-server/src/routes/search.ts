import { Router, type IRouter } from "express";
import { ilike, eq, or, sql } from "drizzle-orm";
import { db, brandsTable, modelsTable, compatibilitiesTable } from "@workspace/db";
import { SearchModelsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/search", async (req, res): Promise<void> => {
  const params = SearchModelsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const q = params.data.q?.trim() ?? "";
  const brandId = params.data.brand_id;

  const brandSelect = {
    id: brandsTable.id,
    name: brandsTable.name,
    logoUrl: brandsTable.logoUrl,
    createdAt: brandsTable.createdAt,
    modelCount: sql<number>`cast(count(distinct ${modelsTable.id}) as int)`,
  };
  const modelSelect = {
    id: modelsTable.id,
    brandId: modelsTable.brandId,
    brandName: brandsTable.name,
    name: modelsTable.name,
    releaseYear: modelsTable.releaseYear,
    imageUrl: modelsTable.imageUrl,
    createdAt: modelsTable.createdAt,
    comboCount: sql<number>`cast(count(distinct ${compatibilitiesTable.id}) as int)`,
  };

  if (q) {
    const [brands, models] = await Promise.all([
      db.select(brandSelect).from(brandsTable)
        .leftJoin(modelsTable, eq(modelsTable.brandId, brandsTable.id))
        .where(ilike(brandsTable.name, `%${q}%`))
        .groupBy(brandsTable.id),
      db.select(modelSelect).from(modelsTable)
        .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
        .leftJoin(compatibilitiesTable, eq(compatibilitiesTable.modelId, modelsTable.id))
        .where(or(ilike(modelsTable.name, `%${q}%`), ilike(brandsTable.name, `%${q}%`)))
        .groupBy(modelsTable.id, brandsTable.name),
    ]);
    res.json({ brands, models }); return;
  }
  if (brandId) {
    const [brands, models] = await Promise.all([
      db.select(brandSelect).from(brandsTable)
        .leftJoin(modelsTable, eq(modelsTable.brandId, brandsTable.id))
        .where(eq(brandsTable.id, brandId)).groupBy(brandsTable.id),
      db.select(modelSelect).from(modelsTable)
        .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
        .leftJoin(compatibilitiesTable, eq(compatibilitiesTable.modelId, modelsTable.id))
        .where(eq(modelsTable.brandId, brandId)).groupBy(modelsTable.id, brandsTable.name),
    ]);
    res.json({ brands, models }); return;
  }
  const [brands, models] = await Promise.all([
    db.select(brandSelect).from(brandsTable)
      .leftJoin(modelsTable, eq(modelsTable.brandId, brandsTable.id))
      .groupBy(brandsTable.id).limit(20),
    db.select(modelSelect).from(modelsTable)
      .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
      .leftJoin(compatibilitiesTable, eq(compatibilitiesTable.modelId, modelsTable.id))
      .groupBy(modelsTable.id, brandsTable.name).limit(20),
  ]);
  res.json({ brands, models });
});

export default router;
