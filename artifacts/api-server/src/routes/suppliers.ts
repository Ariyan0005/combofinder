import { Router } from "express";
import { db, suppliersTable } from "@workspace/db";
import { eq, desc, and, isNull } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const userId: number | undefined = (req as any).userId;
    const filter = userId
      ? eq(suppliersTable.userId, userId)
      : isNull(suppliersTable.userId);
    const rows = await db.select().from(suppliersTable)
      .where(filter)
      .orderBy(suppliersTable.name);
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const userId: number | undefined = (req as any).userId;
    const [row] = await db.insert(suppliersTable).values({
      ...req.body,
      userId: userId ?? null,
      updatedAt: new Date(),
    }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const userId: number | undefined = (req as any).userId;
    const filter = userId
      ? and(eq(suppliersTable.id, Number(req.params.id)), eq(suppliersTable.userId, userId))
      : eq(suppliersTable.id, Number(req.params.id));
    const [row] = await db.update(suppliersTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(filter)
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId: number | undefined = (req as any).userId;
    const filter = userId
      ? and(eq(suppliersTable.id, Number(req.params.id)), eq(suppliersTable.userId, userId))
      : eq(suppliersTable.id, Number(req.params.id));
    await db.delete(suppliersTable).where(filter);
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete" }); }
});

export default router;
