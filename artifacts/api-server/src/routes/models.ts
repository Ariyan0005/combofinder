import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, brandsTable, modelsTable, compatibilitiesTable } from "@workspace/db";
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
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const buildQuery = (whereClause?: any) =>
    db
      .select({
        id: modelsTable.id,
        brandId: modelsTable.brandId,
        brandName: brandsTable.name,
        name: modelsTable.name,
        releaseYear: modelsTable.releaseYear,
        imageUrl: modelsTable.imageUrl,
        createdAt: modelsTable.createdAt,
        comboCount: sql<number>`cast(count(${compatibilitiesTable.id}) as int)`,
      })
      .from(modelsTable)
      .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
      .leftJoin(compatibilitiesTable, eq(compatibilitiesTable.modelId, modelsTable.id))
      .groupBy(modelsTable.id, brandsTable.name)
      .orderBy(brandsTable.name, modelsTable.name);

  if (params.data.brand_id) {
    const models = await buildQuery().where(eq(modelsTable.brandId, params.data.brand_id!));
    res.json(models); return;
  }
  res.json(await buildQuery());
});

router.post("/models", async (req, res): Promise<void> => {
  const parsed = CreateModelBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [model] = await db.insert(modelsTable).values(parsed.data).returning();
  const [brand] = await db.select().from(brandsTable).where(eq(brandsTable.id, model.brandId));
  res.status(201).json({ ...model, brandName: brand?.name ?? "", comboCount: 0 });
});

router.get("/models/:id", async (req, res): Promise<void> => {
  const params = GetModelParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

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

  if (!model) { res.status(404).json({ error: "Model not found" }); return; }

  const combos = await db
    .select({
      id: compatibilitiesTable.id,
      modelId: compatibilitiesTable.modelId,
      modelName: modelsTable.name,
      brandName: brandsTable.name,
      name: compatibilitiesTable.name,
      comboType: compatibilitiesTable.comboType,
      qualityGrade: compatibilitiesTable.qualityGrade,
      notes: compatibilitiesTable.notes,
      createdAt: compatibilitiesTable.createdAt,
    })
    .from(compatibilitiesTable)
    .innerJoin(modelsTable, eq(modelsTable.id, compatibilitiesTable.modelId))
    .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
    .where(eq(compatibilitiesTable.modelId, params.data.id))
    .orderBy(compatibilitiesTable.name);

  res.json({ ...model, combos });
});

router.put("/models/:id", async (req, res): Promise<void> => {
  const params = UpdateModelParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateModelBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [model] = await db.update(modelsTable).set(parsed.data).where(eq(modelsTable.id, params.data.id)).returning();
  if (!model) { res.status(404).json({ error: "Model not found" }); return; }
  const [brand] = await db.select().from(brandsTable).where(eq(brandsTable.id, model.brandId));
  res.json({ ...model, brandName: brand?.name ?? "", comboCount: 0 });
});

router.delete("/models/:id", async (req, res): Promise<void> => {
  const params = DeleteModelParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [model] = await db.delete(modelsTable).where(eq(modelsTable.id, params.data.id)).returning();
  if (!model) { res.status(404).json({ error: "Model not found" }); return; }
  res.json({ success: true });
});

// /models/:id/compatibilities (also keep /models/:id/combos alias)
router.get("/models/:id/compatibilities", async (req, res): Promise<void> => {
  const params = GetModelCombosParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const rows = await db
    .select({
      id: compatibilitiesTable.id,
      modelId: compatibilitiesTable.modelId,
      modelName: modelsTable.name,
      brandName: brandsTable.name,
      name: compatibilitiesTable.name,
      comboType: compatibilitiesTable.comboType,
      qualityGrade: compatibilitiesTable.qualityGrade,
      notes: compatibilitiesTable.notes,
      createdAt: compatibilitiesTable.createdAt,
    })
    .from(compatibilitiesTable)
    .innerJoin(modelsTable, eq(modelsTable.id, compatibilitiesTable.modelId))
    .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
    .where(eq(compatibilitiesTable.modelId, params.data.id))
    .orderBy(compatibilitiesTable.name);
  res.json(rows);
});
// Backward-compat alias
router.get("/models/:id/combos", async (req, res): Promise<void> => {
  req.url = req.url.replace("/combos", "/compatibilities");
  (router as any).handle(req, res, () => {});
});

export default router;
