import { Router } from "express";
import { db, inventoryCategoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function getUid(req: any, res: any): number | null {
  const uid: number | undefined = req.userId;
  if (!uid) { res.status(403).json({ error: "User session invalid" }); return null; }
  return uid;
}

// GET /api/inventory-categories — return user's categories
router.get("/", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const rows = await db.select().from(inventoryCategoriesTable)
      .where(eq(inventoryCategoriesTable.userId, userId))
      .orderBy(inventoryCategoriesTable.name);
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

// POST /api/inventory-categories
router.post("/", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const { name, description, icon, color, parentId } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });

    const [row] = await db.insert(inventoryCategoriesTable).values({
      userId,
      parentId: parentId ? Number(parentId) : null,
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      icon: icon ? String(icon) : null,
      color: color ? String(color) : null,
    }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create" }); }
});

// PUT /api/inventory-categories/:id
router.put("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const { name, description, icon, color, parentId } = req.body;

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (description !== undefined) updateData.description = description ? String(description).trim() : null;
    if (icon !== undefined) updateData.icon = icon ? String(icon) : null;
    if (color !== undefined) updateData.color = color ? String(color) : null;
    if (parentId !== undefined) updateData.parentId = parentId ? Number(parentId) : null;

    const [row] = await db.update(inventoryCategoriesTable).set(updateData)
      .where(and(eq(inventoryCategoriesTable.id, Number(req.params.id)), eq(inventoryCategoriesTable.userId, userId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update" }); }
});

// DELETE /api/inventory-categories/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    await db.delete(inventoryCategoriesTable)
      .where(and(eq(inventoryCategoriesTable.id, Number(req.params.id)), eq(inventoryCategoriesTable.userId, userId)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete" }); }
});

export default router;
