import { Router, type IRouter } from "express";
import { ilike, eq, or, sql, and } from "drizzle-orm";
import { db, brandsTable, modelsTable, compatibilitiesTable, categoriesTable } from "@workspace/db";
import { SearchModelsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/search", async (req, res): Promise<void> => {
  const params = SearchModelsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const q = params.data.q?.trim() ?? "";
  const brandId = params.data.brand_id;
  const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;

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

  const categoryWhere = categoryId ? eq(brandsTable.categoryId, categoryId) : undefined;

  if (q) {
    const [brands, models] = await Promise.all([
      db.select(brandSelect).from(brandsTable)
        .leftJoin(modelsTable, eq(modelsTable.brandId, brandsTable.id))
        .innerJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
        .where(and(ilike(brandsTable.name, `%${q}%`), categoryWhere))
        .groupBy(brandsTable.id),
      db.select(modelSelect).from(modelsTable)
        .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
        .leftJoin(compatibilitiesTable, eq(compatibilitiesTable.modelId, modelsTable.id))
        .innerJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
        .where(and(or(ilike(modelsTable.name, `%${q}%`), ilike(brandsTable.name, `%${q}%`)), categoryWhere))
        .groupBy(modelsTable.id, brandsTable.name),
    ]);
    res.json({ brands, models }); return;
  }
  if (brandId) {
    const [brands, models] = await Promise.all([
      db.select(brandSelect).from(brandsTable)
        .leftJoin(modelsTable, eq(modelsTable.brandId, brandsTable.id))
        .innerJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
        .where(and(eq(brandsTable.id, brandId), categoryWhere)).groupBy(brandsTable.id),
      db.select(modelSelect).from(modelsTable)
        .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
        .leftJoin(compatibilitiesTable, eq(compatibilitiesTable.modelId, modelsTable.id))
        .innerJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
        .where(and(eq(modelsTable.brandId, brandId), categoryWhere)).groupBy(modelsTable.id, brandsTable.name),
    ]);
    res.json({ brands, models }); return;
  }
  const [brands, models] = await Promise.all([
    db.select(brandSelect).from(brandsTable)
      .leftJoin(modelsTable, eq(modelsTable.brandId, brandsTable.id))
      .innerJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
      .where(categoryWhere)
      .groupBy(brandsTable.id).limit(20),
    db.select(modelSelect).from(modelsTable)
      .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
      .leftJoin(compatibilitiesTable, eq(compatibilitiesTable.modelId, modelsTable.id))
      .innerJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
      .where(categoryWhere)
      .groupBy(modelsTable.id, brandsTable.name).limit(20),
  ]);
  res.json({ brands, models });
});

export default router;
