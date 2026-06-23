import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, brandsTable, modelsTable } from "@workspace/db";
import {
  CreateBrandBody,
  UpdateBrandBody,
  GetBrandParams,
  UpdateBrandParams,
  DeleteBrandParams,
  GetBrandModelsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/brands", async (_req, res): Promise<void> => {
  const brands = await db
    .select({
      id: brandsTable.id,
      name: brandsTable.name,
      logoUrl: brandsTable.logoUrl,
      createdAt: brandsTable.createdAt,
      modelCount: sql<number>`cast(count(${modelsTable.id}) as int)`,
    })
    .from(brandsTable)
    .leftJoin(modelsTable, eq(modelsTable.brandId, brandsTable.id))
    .groupBy(brandsTable.id)
    .orderBy(brandsTable.name);
  res.json(brands);
});

router.post("/brands", async (req, res): Promise<void> => {
  const parsed = CreateBrandBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [brand] = await db.insert(brandsTable).values(parsed.data).returning();
  res.status(201).json({ ...brand, modelCount: 0 });
});

router.get("/brands/:id", async (req, res): Promise<void> => {
  const params = GetBrandParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [brand] = await db
    .select({
      id: brandsTable.id,
      name: brandsTable.name,
      logoUrl: brandsTable.logoUrl,
      createdAt: brandsTable.createdAt,
      modelCount: sql<number>`cast(count(${modelsTable.id}) as int)`,
    })
    .from(brandsTable)
    .leftJoin(modelsTable, eq(modelsTable.brandId, brandsTable.id))
    .where(eq(brandsTable.id, params.data.id))
    .groupBy(brandsTable.id);
  if (!brand) {
    res.status(404).json({ error: "Brand not found" });
    return;
  }
  res.json(brand);
});

router.put("/brands/:id", async (req, res): Promise<void> => {
  const params = UpdateBrandParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBrandBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [brand] = await db
    .update(brandsTable)
    .set(parsed.data)
    .where(eq(brandsTable.id, params.data.id))
    .returning();
  if (!brand) {
    res.status(404).json({ error: "Brand not found" });
    return;
  }
  const [result] = await db
    .select({
      id: brandsTable.id,
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
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [brand] = await db
    .delete(brandsTable)
    .where(eq(brandsTable.id, params.data.id))
    .returning();
  if (!brand) {
    res.status(404).json({ error: "Brand not found" });
    return;
  }
  res.json({ success: true });
});

router.get("/brands/:id/models", async (req, res): Promise<void> => {
  const params = GetBrandModelsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const models = await db
    .select({
      id: modelsTable.id,
      brandId: modelsTable.brandId,
      brandName: brandsTable.name,
      name: modelsTable.name,
      releaseYear: modelsTable.releaseYear,
      imageUrl: modelsTable.imageUrl,
      createdAt: modelsTable.createdAt,
      comboCount: sql<number>`0`,
    })
    .from(modelsTable)
    .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
    .where(eq(modelsTable.brandId, params.data.id))
    .orderBy(modelsTable.name);
  res.json(models);
});

export default router;
