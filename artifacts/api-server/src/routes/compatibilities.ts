import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, brandsTable, modelsTable, compatibilitiesTable, categoriesTable } from "@workspace/db";

const router: IRouter = Router();

// GET /compatibilities?model_id=&category_id=
router.get("/compatibilities", async (req, res): Promise<void> => {
  const modelId = req.query.model_id ? Number(req.query.model_id) : undefined;
  const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;

  const baseQuery = db
    .select({
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
    })
    .from(compatibilitiesTable)
    .innerJoin(modelsTable, eq(modelsTable.id, compatibilitiesTable.modelId))
    .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
    .innerJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId));

  if (modelId) {
    const rows = await baseQuery.where(eq(compatibilitiesTable.modelId, modelId)).orderBy(compatibilitiesTable.name);
    res.json(rows); return;
  }
  if (categoryId) {
    const rows = await baseQuery.where(eq(brandsTable.categoryId, categoryId)).orderBy(brandsTable.name, modelsTable.name, compatibilitiesTable.name);
    res.json(rows); return;
  }
  const rows = await baseQuery.orderBy(brandsTable.name, modelsTable.name, compatibilitiesTable.name);
  res.json(rows);
});

// POST /compatibilities
router.post("/compatibilities", async (req, res): Promise<void> => {
  const { modelId, name, comboType, qualityGrade, notes } = req.body;
  if (!modelId || !name?.trim() || !comboType) {
    res.status(400).json({ error: "modelId, name and comboType are required" }); return;
  }
  const [compat] = await db.insert(compatibilitiesTable).values({
    modelId: Number(modelId), name: name.trim(), comboType, qualityGrade: qualityGrade || null, notes: notes || null,
  }).returning();
  const [model] = await db
    .select({ name: modelsTable.name, brandName: brandsTable.name })
    .from(modelsTable).innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
    .where(eq(modelsTable.id, compat.modelId));
  res.status(201).json({ ...compat, modelName: model?.name ?? "", brandName: model?.brandName ?? "" });
});

// GET /compatibilities/:id
router.get("/compatibilities/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [row] = await db
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
    .where(eq(compatibilitiesTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// PUT /compatibilities/:id
router.put("/compatibilities/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { modelId, name, comboType, qualityGrade, notes } = req.body;
  const [compat] = await db.update(compatibilitiesTable)
    .set({
      ...(modelId && { modelId: Number(modelId) }),
      ...(name && { name: name.trim() }),
      ...(comboType && { comboType }),
      qualityGrade: qualityGrade || null,
      notes: notes || null,
    })
    .where(eq(compatibilitiesTable.id, id))
    .returning();
  if (!compat) { res.status(404).json({ error: "Not found" }); return; }
  const [model] = await db
    .select({ name: modelsTable.name, brandName: brandsTable.name })
    .from(modelsTable).innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
    .where(eq(modelsTable.id, compat.modelId));
  res.json({ ...compat, modelName: model?.name ?? "", brandName: model?.brandName ?? "" });
});

// DELETE /compatibilities/:id
router.delete("/compatibilities/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [row] = await db.delete(compatibilitiesTable).where(eq(compatibilitiesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

export default router;
