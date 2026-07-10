import { Router } from "express";
import { db, compatibilityLinksTable, compatibilityCategoriesTable, modelsTable, brandsTable } from "@workspace/db";
import { eq, and, or, ilike } from "drizzle-orm";
import { alias as pgAlias } from "drizzle-orm/pg-core";

const router = Router();

const compatibleModel = pgAlias(modelsTable, "compatible_model");
const compatibleBrand = pgAlias(brandsTable, "compatible_brand");

const withJoins = () =>
  db
    .select({
      id: compatibilityLinksTable.id,
      categoryId: compatibilityLinksTable.categoryId,
      categoryName: compatibilityCategoriesTable.name,
      modelId: compatibilityLinksTable.modelId,
      modelName: modelsTable.name,
      brandId: brandsTable.id,
      brandName: brandsTable.name,
      compatibleModelId: compatibilityLinksTable.compatibleModelId,
      compatibleModelName: compatibleModel.name,
      compatibleBrandId: compatibleBrand.id,
      compatibleBrandName: compatibleBrand.name,
      createdAt: compatibilityLinksTable.createdAt,
    })
    .from(compatibilityLinksTable)
    .innerJoin(compatibilityCategoriesTable, eq(compatibilityCategoriesTable.id, compatibilityLinksTable.categoryId))
    .innerJoin(modelsTable, eq(modelsTable.id, compatibilityLinksTable.modelId))
    .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
    .innerJoin(compatibleModel, eq(compatibleModel.id, compatibilityLinksTable.compatibleModelId))
    .innerJoin(compatibleBrand, eq(compatibleBrand.id, compatibleModel.brandId));

// GET /compatibility?categoryId=&modelId= — categoryId is required for the user-facing
// flow (Part Type must be picked first); modelId narrows to one base model's links.
router.get("/", async (req, res) => {
  try {
    const { categoryId, modelId } = req.query;
    if (!categoryId) return res.status(400).json({ error: "categoryId is required" });

    const conditions = [eq(compatibilityLinksTable.categoryId, Number(categoryId))];
    if (modelId) conditions.push(eq(compatibilityLinksTable.modelId, Number(modelId)));

    const rows = await withJoins()
      .where(and(...conditions))
      .orderBy(modelsTable.name);
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch compatibility links" });
  }
  return;
});

// GET /compatibility/search?categoryId=&q= — search brand/model names within one category only.
router.get("/search", async (req, res) => {
  try {
    const { categoryId, q } = req.query;
    if (!categoryId) return res.status(400).json({ error: "categoryId is required" });
    const term = String(q || "").trim();
    if (term.length < 2) return res.json([]);

    const rows = await withJoins()
      .where(
        and(
          eq(compatibilityLinksTable.categoryId, Number(categoryId)),
          or(
            ilike(modelsTable.name, `%${term}%`),
            ilike(brandsTable.name, `%${term}%`),
            ilike(compatibleModel.name, `%${term}%`),
            ilike(compatibleBrand.name, `%${term}%`)
          )
        )
      )
      .limit(30);
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Search failed" });
  }
  return;
});

// POST /compatibility — link modelId <-> compatibleModelId within a category.
router.post("/", async (req, res) => {
  try {
    const { categoryId, modelId, compatibleModelId } = req.body;
    if (!categoryId || !modelId || !compatibleModelId)
      return res.status(400).json({ error: "categoryId, modelId and compatibleModelId are required" });
    if (Number(modelId) === Number(compatibleModelId))
      return res.status(400).json({ error: "A model cannot be compatible with itself" });

    const [link] = await db
      .insert(compatibilityLinksTable)
      .values({
        categoryId: Number(categoryId),
        modelId: Number(modelId),
        compatibleModelId: Number(compatibleModelId),
      })
      .onConflictDoNothing()
      .returning();
    if (!link) return res.status(409).json({ error: "This compatibility link already exists" });
    res.status(201).json(link);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create compatibility link" });
  }
  return;
});

// DELETE /compatibility/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.delete(compatibilityLinksTable).where(eq(compatibilityLinksTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete compatibility link" });
  }
});

export default router;
