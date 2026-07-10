import { Router } from "express";
import { db, partCategoriesTable, partsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// GET /part-categories — list all with part count
router.get("/", async (req, res) => {
  try {
    const cats = await db
      .select({
        id: partCategoriesTable.id,
        name: partCategoriesTable.name,
        createdAt: partCategoriesTable.createdAt,
        partCount: sql<number>`cast(count(${partsTable.id}) as int)`,
      })
      .from(partCategoriesTable)
      .leftJoin(partsTable, eq(partsTable.categoryId, partCategoriesTable.id))
      .groupBy(partCategoriesTable.id)
      .orderBy(partCategoriesTable.name);
    res.json(cats);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch part categories" });
  }
});

// POST /part-categories
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name required" });
    const [cat] = await db.insert(partCategoriesTable).values({ name: name.trim() }).returning();
    res.status(201).json(cat);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// PUT /part-categories/:id
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name required" });
    const [cat] = await db
      .update(partCategoriesTable)
      .set({ name: name.trim() })
      .where(eq(partCategoriesTable.id, Number(req.params.id)))
      .returning();
    if (!cat) return res.status(404).json({ error: "Not found" });
    res.json(cat);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// DELETE /part-categories/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.delete(partCategoriesTable).where(eq(partCategoriesTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
