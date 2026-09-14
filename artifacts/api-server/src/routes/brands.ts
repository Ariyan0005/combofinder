import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, brandsTable, modelsTable, categoriesTable } from "@workspace/db";
import {
  CreateBrandBody,
  UpdateBrandBody,
  GetBrandParams,
  UpdateBrandParams,
  DeleteBrandParams,
  GetBrandModelsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/brands", async (req, res): Promise<void> => {
  const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;
  let query = db
    .select({
      id: brandsTable.id,
      categoryId: brandsTable.categoryId,
      name: brandsTable.name,
      logoUrl: brandsTable.logoUrl,
      createdAt: brandsTable.createdAt,
      modelCount: sql<number>`cast(count(${modelsTable.id}) as int)`,
    })
    .from(brandsTable)
    .leftJoin(modelsTable, eq(modelsTable.brandId, brandsTable.id))
    .groupBy(brandsTable.id)
    .orderBy(brandsTable.name)
    .$dynamic();
  if (categoryId) {
    const brands = await query.where(eq(brandsTable.categoryId, categoryId));
    res.json(brands); return;
  }
  res.json(await query);
});

router.post("/brands", async (req, res): Promise<void> => {
  const parsed = CreateBrandBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [brand] = await db.insert(brandsTable).values({
    ...parsed.data,
    categoryId: req.body.categoryId ? Number(req.body.categoryId) : null,
  }).returning();
  res.status(201).json({ ...brand, modelCount: 0 });
});

router.get("/brands/:id", async (req, res): Promise<void> => {
  const params = GetBrandParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [brand] = await db
    .select({
      id: brandsTable.id,
      categoryId: brandsTable.categoryId,
      name: brandsTable.name,
      logoUrl: brandsTable.logoUrl,
      createdAt: brandsTable.createdAt,
      modelCount: sql<number>`cast(count(${modelsTable.id}) as int)`,
    })
    .from(brandsTable)
    .leftJoin(modelsTable, eq(modelsTable.brandId, brandsTable.id))
    .where(eq(brandsTable.id, params.data.id))
    .groupBy(brandsTable.id);
  if (!brand) { res.status(404).json({ error: "Brand not found" }); return; }
  res.json(brand);
});

router.put("/brands/:id", async (req, res): Promise<void> => {
  const params = UpdateBrandParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateBrandBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates: Record<string, any> = { ...parsed.data };
  if (req.body.categoryId !== undefined) updates.categoryId = req.body.categoryId ? Number(req.body.categoryId) : null;
  const [brand] = await db.update(brandsTable).set(updates).where(eq(brandsTable.id, params.data.id)).returning();
  if (!brand) { res.status(404).json({ error: "Brand not found" }); return; }
  const [result] = await db
    .select({
      id: brandsTable.id,
      categoryId: brandsTable.categoryId,
      name: brandsTable.name,
      logoUrl: brandsTable.logoUrl,
      createdAt: brandsTable.createdAt,
      modelCount: sql<number>`cast(count(${modelsTable.id}) as int)`,
    })
    .from(brandsTable)
    .leftJoin(modelsTable, eq(modelsTable.brandId, brandsTable.id))
    .where(eq(brandsTable.id, brand.id))
    .groupBy(brandsTable.id);
  res.json(result);
});

router.delete("/brands/:id", async (req, res): Promise<void> => {
  const params = DeleteBrandParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [brand] = await db.delete(brandsTable).where(eq(brandsTable.id, params.data.id)).returning();
  if (!brand) { res.status(404).json({ error: "Brand not found" }); return; }
  res.json({ success: true });
});

router.get("/brands/:id/models", async (req, res): Promise<void> => {
  const params = GetBrandModelsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const models = await db
    .select({
      id: modelsTable.id,
      brandId: modelsTable.brandId,
      brandName: brandsTable.name,
      name: modelsTable.name,
      releaseYear: modelsTable.releaseYear,
      imageUrl: modelsTable.imageUrl,
      createdAt: modelsTable.createdAt,
    })
    .from(modelsTable)
    .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
    .where(eq(modelsTable.brandId, params.data.id))
    .orderBy(modelsTable.name);
  res.json(models);
});

export default router;
