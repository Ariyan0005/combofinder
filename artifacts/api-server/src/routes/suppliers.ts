import { Router } from "express";
import { db, suppliersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

function getUid(req: any, res: any): number | null {
  const uid: number | undefined = req.userId;
  if (!uid) { res.status(403).json({ error: "User session invalid" }); return null; }
  return uid;
}

router.get("/", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const rows = await db.select().from(suppliersTable)
      .where(eq(suppliersTable.userId, userId))
      .orderBy(suppliersTable.name);
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const [row] = await db.insert(suppliersTable).values({
      ...req.body,
      userId,
      updatedAt: new Date(),
    }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const [row] = await db.update(suppliersTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(suppliersTable.id, Number(req.params.id)), eq(suppliersTable.userId, userId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    await db.delete(suppliersTable)
      .where(and(eq(suppliersTable.id, Number(req.params.id)), eq(suppliersTable.userId, userId)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete" }); }
});

export default router;
