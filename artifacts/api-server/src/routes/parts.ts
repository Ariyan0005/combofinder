import { Router } from "express";
import { db, partsTable, partCategoriesTable, modelsTable, brandsTable } from "@workspace/db";
import { eq, and, ilike, or } from "drizzle-orm";

const router = Router();

const withJoins = () =>
  db
    .select({
      id: partsTable.id,
      categoryId: partsTable.categoryId,
      categoryName: partCategoriesTable.name,
      modelId: partsTable.modelId,
      modelName: modelsTable.name,
      brandId: brandsTable.id,
      brandName: brandsTable.name,
      partName: partsTable.partName,
      description: partsTable.description,
      createdAt: partsTable.createdAt,
    })
    .from(partsTable)
    .innerJoin(partCategoriesTable, eq(partCategoriesTable.id, partsTable.categoryId))
    .innerJoin(modelsTable, eq(modelsTable.id, partsTable.modelId))
    .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId));

// GET /parts
router.get("/", async (req, res) => {
  try {
    const { categoryId } = req.query;
    let query = withJoins();
    const parts = categoryId
      ? await query.where(eq(partsTable.categoryId, Number(categoryId))).orderBy(partsTable.createdAt)
      : await query.orderBy(partsTable.createdAt);
    res.json(parts);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch parts" });
  }
});

// GET /parts/search
router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "");
    if (q.length < 2) return res.json([]);
    const results = await withJoins()
      .where(
        or(
          ilike(partsTable.partName, `%${q}%`),
          ilike(modelsTable.name, `%${q}%`),
          ilike(brandsTable.name, `%${q}%`),
          ilike(partCategoriesTable.name, `%${q}%`)
        )
      )
      .limit(30);
    res.json(results);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

// POST /parts
router.post("/", async (req, res) => {
  try {
    const { categoryId, modelId, partName, description } = req.body;
    if (!categoryId || !modelId || !partName?.trim())
      return res.status(400).json({ error: "categoryId, modelId and partName required" });
    const [part] = await db
      .insert(partsTable)
      .values({ categoryId: Number(categoryId), modelId: Number(modelId), partName: partName.trim(), description: description?.trim() || null })
      .returning();
    res.status(201).json(part);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create part" });
  }
});

// PUT /parts/:id
router.put("/:id", async (req, res) => {
  try {
    const { categoryId, modelId, partName, description } = req.body;
    const [part] = await db
      .update(partsTable)
      .set({
        ...(categoryId && { categoryId: Number(categoryId) }),
        ...(modelId && { modelId: Number(modelId) }),
        ...(partName && { partName: partName.trim() }),
        description: description?.trim() || null,
      })
      .where(eq(partsTable.id, Number(req.params.id)))
      .returning();
    if (!part) return res.status(404).json({ error: "Not found" });
    res.json(part);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update part" });
  }
});

// DELETE /parts/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.delete(partsTable).where(eq(partsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete part" });
  }
});

export default router;
