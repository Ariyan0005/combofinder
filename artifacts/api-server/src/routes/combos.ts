import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, brandsTable, modelsTable, combosTable } from "@workspace/db";
import {
  CreateComboBody,
  UpdateComboBody,
  GetComboParams,
  UpdateComboParams,
  DeleteComboParams,
  GetCombosQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/combos", async (req, res): Promise<void> => {
  const params = GetCombosQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const baseQuery = db
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
    .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId));

  if (params.data.model_id) {
    const combos = await baseQuery.where(eq(combosTable.modelId, params.data.model_id!)).orderBy(combosTable.name);
    res.json(combos);
    return;
  }

  const combos = await baseQuery.orderBy(brandsTable.name, modelsTable.name, combosTable.name);
  res.json(combos);
});

router.post("/combos", async (req, res): Promise<void> => {
  const parsed = CreateComboBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [combo] = await db.insert(combosTable).values(parsed.data).returning();
  const [model] = await db
    .select({ name: modelsTable.name, brandName: brandsTable.name })
    .from(modelsTable)
    .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
    .where(eq(modelsTable.id, combo.modelId));
  res.status(201).json({ ...combo, modelName: model?.name ?? "", brandName: model?.brandName ?? "" });
});

router.get("/combos/:id", async (req, res): Promise<void> => {
  const params = GetComboParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [combo] = await db
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
    .where(eq(combosTable.id, params.data.id));
  if (!combo) {
    res.status(404).json({ error: "Combo not found" });
    return;
  }
  res.json(combo);
});

router.put("/combos/:id", async (req, res): Promise<void> => {
  const params = UpdateComboParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateComboBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [combo] = await db
    .update(combosTable)
    .set(parsed.data)
    .where(eq(combosTable.id, params.data.id))
    .returning();
  if (!combo) {
    res.status(404).json({ error: "Combo not found" });
    return;
  }
  const [model] = await db
    .select({ name: modelsTable.name, brandName: brandsTable.name })
    .from(modelsTable)
    .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
    .where(eq(modelsTable.id, combo.modelId));
  res.json({ ...combo, modelName: model?.name ?? "", brandName: model?.brandName ?? "" });
});

router.delete("/combos/:id", async (req, res): Promise<void> => {
  const params = DeleteComboParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [combo] = await db
    .delete(combosTable)
    .where(eq(combosTable.id, params.data.id))
    .returning();
  if (!combo) {
    res.status(404).json({ error: "Combo not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
