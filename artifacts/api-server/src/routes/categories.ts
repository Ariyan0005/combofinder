import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, categoriesTable, brandsTable } from "@workspace/db";

const router = Router();

// GET /categories — list all with brand count
router.get("/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      icon: categoriesTable.icon,
      sortOrder: categoriesTable.sortOrder,
      createdAt: categoriesTable.createdAt,
      brandCount: sql<number>`cast(count(${brandsTable.id}) as int)`,
    })
    .from(categoriesTable)
    .leftJoin(brandsTable, eq(brandsTable.categoryId, categoriesTable.id))
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.sortOrder, categoriesTable.name);
  res.json(rows);
});

// GET /categories/:id
router.get("/categories/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [row] = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      icon: categoriesTable.icon,
      sortOrder: categoriesTable.sortOrder,
      createdAt: categoriesTable.createdAt,
      brandCount: sql<number>`cast(count(${brandsTable.id}) as int)`,
    })
    .from(categoriesTable)
    .leftJoin(brandsTable, eq(brandsTable.categoryId, categoriesTable.id))
    .where(eq(categoriesTable.id, id))
    .groupBy(categoriesTable.id);
  if (!row) { res.status(404).json({ error: "Category not found" }); return; }
  res.json(row);
});

// POST /categories
router.post("/categories", async (req, res): Promise<void> => {
  const { name, slug, icon, sortOrder } = req.body;
  if (!name?.trim() || !slug?.trim()) {
    res.status(400).json({ error: "name and slug are required" }); return;
  }
  const [row] = await db.insert(categoriesTable).values({
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    icon: icon?.trim() || null,
    sortOrder: sortOrder != null ? Number(sortOrder) : 0,
  }).returning();
  res.status(201).json({ ...row, brandCount: 0 });
});

// PUT /categories/:id
router.put("/categories/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { name, slug, icon, sortOrder } = req.body;
  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name.trim();
  if (slug !== undefined) updates.slug = slug.trim().toLowerCase();
  if (icon !== undefined) updates.icon = icon?.trim() || null;
  if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);
  const [row] = await db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// DELETE /categories/:id
router.delete("/categories/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [row] = await db.delete(categoriesTable).where(eq(categoriesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

export default router;
