import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, brandsTable, modelsTable, combosTable } from "@workspace/db";
import {
  CreateModelBody,
  UpdateModelBody,
  GetModelParams,
  UpdateModelParams,
  DeleteModelParams,
  GetModelsQueryParams,
  GetModelCombosParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/models", async (req, res): Promise<void> => {
  const params = GetModelsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const query = db
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
    .groupBy(modelsTable.id, brandsTable.name)
    .orderBy(brandsTable.name, modelsTable.name);

  if (params.data.brand_id) {
    const models = await db
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
      .where(eq(modelsTable.brandId, params.data.brand_id!))
      .groupBy(modelsTable.id, brandsTable.name)
      .orderBy(brandsTable.name, modelsTable.name);
    res.json(models);
    return;
  }

  const models = await query;
  res.json(models);
});

router.post("/models", async (req, res): Promise<void> => {
  const parsed = CreateModelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [model] = await db.insert(modelsTable).values(parsed.data).returning();
  const [brand] = await db.select().from(brandsTable).where(eq(brandsTable.id, model.brandId));
  res.status(201).json({ ...model, brandName: brand?.name ?? "", comboCount: 0 });
});

router.get("/models/:id", async (req, res): Promise<void> => {
  const params = GetModelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [model] = await db
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
    .where(eq(modelsTable.id, params.data.id));

  if (!model) {
    res.status(404).json({ error: "Model not found" });
    return;
  }

  const combos = await db
    .select({
      id: combosTable.id,
      modelId: combosTable.modelId,
      modelName: modelsTable.name,
      brandName: brandsTable.name,
      name: combosTable.name,
      comboType: combosTable.comboType,
      qualityGrade: combosTable.qualityGrade,
      notes: combosTable.notes,
      priceRange: combosTable.priceRange,
      inStock: combosTable.inStock,
      createdAt: combosTable.createdAt,
    })
    .from(combosTable)
    .innerJoin(modelsTable, eq(modelsTable.id, combosTable.modelId))
    .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
    .where(eq(combosTable.modelId, params.data.id))
    .orderBy(combosTable.name);

  res.json({ ...model, combos });
});

router.put("/models/:id", async (req, res): Promise<void> => {
  const params = UpdateModelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateModelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [model] = await db
    .update(modelsTable)
    .set(parsed.data)
    .where(eq(modelsTable.id, params.data.id))
    .returning();
  if (!model) {
    res.status(404).json({ error: "Model not found" });
    return;
  }
  const [brand] = await db.select().from(brandsTable).where(eq(brandsTable.id, model.brandId));
  res.json({ ...model, brandName: brand?.name ?? "", comboCount: 0 });
});

router.delete("/models/:id", async (req, res): Promise<void> => {
  const params = DeleteModelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [model] = await db
    .delete(modelsTable)
    .where(eq(modelsTable.id, params.data.id))
    .returning();
  if (!model) {
    res.status(404).json({ error: "Model not found" });
    return;
  }
  res.json({ success: true });
});

router.get("/models/:id/combos", async (req, res): Promise<void> => {
  const params = GetModelCombosParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const combos = await db
    .select({
      id: combosTable.id,
      modelId: combosTable.modelId,
      modelName: modelsTable.name,
      brandName: brandsTable.name,
      name: combosTable.name,
      comboType: combosTable.comboType,
      qualityGrade: combosTable.qualityGrade,
      notes: combosTable.notes,
      priceRange: combosTable.priceRange,
      inStock: combosTable.inStock,
      createdAt: combosTable.createdAt,
    })
    .from(combosTable)
    .innerJoin(modelsTable, eq(modelsTable.id, combosTable.modelId))
    .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
    .where(eq(combosTable.modelId, params.data.id))
    .orderBy(combosTable.name);
  res.json(combos);
});

export default router;
