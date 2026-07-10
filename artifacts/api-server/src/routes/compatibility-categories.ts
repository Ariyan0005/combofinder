import { Router } from "express";
import { db, compatibilityCategoriesTable, compatibilityLinksTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// GET /compatibility-categories — list all with link count
router.get("/", async (req, res) => {
  try {
    const cats = await db
      .select({
        id: compatibilityCategoriesTable.id,
        name: compatibilityCategoriesTable.name,
        createdAt: compatibilityCategoriesTable.createdAt,
        linkCount: sql<number>`cast(count(${compatibilityLinksTable.id}) as int)`,
      })
      .from(compatibilityCategoriesTable)
      .leftJoin(compatibilityLinksTable, eq(compatibilityLinksTable.categoryId, compatibilityCategoriesTable.id))
      .groupBy(compatibilityCategoriesTable.id)
      .orderBy(compatibilityCategoriesTable.name);
    res.json(cats);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch compatibility categories" });
  }
});

// POST /compatibility-categories
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name required" });
    const [cat] = await db.insert(compatibilityCategoriesTable).values({ name: name.trim() }).returning();
    res.status(201).json(cat);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create category" });
  }
  return;
});

// PUT /compatibility-categories/:id
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name required" });
    const [cat] = await db
      .update(compatibilityCategoriesTable)
      .set({ name: name.trim() })
      .where(eq(compatibilityCategoriesTable.id, Number(req.params.id)))
      .returning();
    if (!cat) return res.status(404).json({ error: "Not found" });
    res.json(cat);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update category" });
  }
  return;
});

// DELETE /compatibility-categories/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.delete(compatibilityCategoriesTable).where(eq(compatibilityCategoriesTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
