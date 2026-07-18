import { Router, type IRouter } from "express";
import { ilike, eq, or, sql, and } from "drizzle-orm";
import {
  db, brandsTable, modelsTable, compatibilitiesTable, categoriesTable,
  icModelsTable, batteryModelsTable,
} from "@workspace/db";
import { SearchModelsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/search", async (req, res): Promise<void> => {
  const params = SearchModelsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const q = params.data.q?.trim() ?? "";
  const brandId = params.data.brand_id;
  const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;

  // Look up category slug so we can branch for IC / Battery
  let categorySlug: string | undefined;
  if (categoryId) {
    const [cat] = await db.select({ slug: categoriesTable.slug }).from(categoriesTable).where(eq(categoriesTable.id, categoryId));
    categorySlug = cat?.slug;
  }

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

  const comboSelect = {
    id: compatibilitiesTable.id,
    modelId: compatibilitiesTable.modelId,
    modelName: modelsTable.name,
    brandName: brandsTable.name,
    categoryId: brandsTable.categoryId,
    categoryName: categoriesTable.name,
    name: compatibilitiesTable.name,
    comboType: compatibilitiesTable.comboType,
    qualityGrade: compatibilitiesTable.qualityGrade,
    notes: compatibilitiesTable.notes,
    createdAt: compatibilitiesTable.createdAt,
  };

  if (q) {
    const [brands, models, combos] = await Promise.all([
      db.select(brandSelect).from(brandsTable)
        .leftJoin(modelsTable, eq(modelsTable.brandId, brandsTable.id))
        .leftJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
        .where(and(ilike(brandsTable.name, `%${q}%`), categoryWhere))
        .groupBy(brandsTable.id),
      db.select(modelSelect).from(modelsTable)
        .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
        .leftJoin(compatibilitiesTable, eq(compatibilitiesTable.modelId, modelsTable.id))
        .leftJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
        .where(and(or(ilike(modelsTable.name, `%${q}%`), ilike(brandsTable.name, `%${q}%`)), categoryWhere))
        .groupBy(modelsTable.id, brandsTable.name),
      // Compatibility entries matching by name (e.g. display part name)
      db.select(comboSelect).from(compatibilitiesTable)
        .innerJoin(modelsTable, eq(modelsTable.id, compatibilitiesTable.modelId))
        .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
        .leftJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
        .where(and(ilike(compatibilitiesTable.name, `%${q}%`), categoryWhere))
        .orderBy(compatibilitiesTable.name)
        .limit(20),
    ]);

    // IC number search — only when IC category is active
    if (categorySlug === "ic") {
      const icModels = await db
        .select({
          id: icModelsTable.id,
          icNumber: icModelsTable.icNumber,
          description: icModelsTable.description,
          package: icModelsTable.package,
          brandId: icModelsTable.brandId,
          brandName: brandsTable.name,
        })
        .from(icModelsTable)
        .innerJoin(brandsTable, eq(brandsTable.id, icModelsTable.brandId))
        .where(
          or(
            ilike(icModelsTable.icNumber, `%${q}%`),
            ilike(icModelsTable.description, `%${q}%`),
          )
        )
        .orderBy(icModelsTable.icNumber)
        .limit(30);
      res.json({ brands, models, combos, icModels }); return;
    }

    // Battery model search — only when Battery category is active
    if (categorySlug === "battery") {
      const batteryModels = await db
        .select({
          id: batteryModelsTable.id,
          modelNumber: batteryModelsTable.modelNumber,
          capacity: batteryModelsTable.capacity,
          voltage: batteryModelsTable.voltage,
          brandId: batteryModelsTable.brandId,
          brandName: brandsTable.name,
        })
        .from(batteryModelsTable)
        .innerJoin(brandsTable, eq(brandsTable.id, batteryModelsTable.brandId))
        .where(
          or(
            ilike(batteryModelsTable.modelNumber, `%${q}%`),
            ilike(batteryModelsTable.capacity, `%${q}%`),
          )
        )
        .orderBy(batteryModelsTable.modelNumber)
        .limit(30);
      res.json({ brands, models, combos, batteryModels }); return;
    }

    res.json({ brands, models, combos }); return;
  }

  if (brandId) {
    const [brands, models] = await Promise.all([
      db.select(brandSelect).from(brandsTable)
        .leftJoin(modelsTable, eq(modelsTable.brandId, brandsTable.id))
        .leftJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
        .where(and(eq(brandsTable.id, brandId), categoryWhere)).groupBy(brandsTable.id),
      db.select(modelSelect).from(modelsTable)
        .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
        .leftJoin(compatibilitiesTable, eq(compatibilitiesTable.modelId, modelsTable.id))
        .leftJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
        .where(and(eq(modelsTable.brandId, brandId), categoryWhere)).groupBy(modelsTable.id, brandsTable.name),
    ]);
    res.json({ brands, models }); return;
  }

  const [brands, models] = await Promise.all([
    db.select(brandSelect).from(brandsTable)
      .leftJoin(modelsTable, eq(modelsTable.brandId, brandsTable.id))
      .leftJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
      .where(categoryWhere)
      .groupBy(brandsTable.id).limit(20),
    db.select(modelSelect).from(modelsTable)
      .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
      .leftJoin(compatibilitiesTable, eq(compatibilitiesTable.modelId, modelsTable.id))
      .leftJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
      .where(categoryWhere)
      .groupBy(modelsTable.id, brandsTable.name).limit(20),
  ]);
  res.json({ brands, models });
});

export default router;
