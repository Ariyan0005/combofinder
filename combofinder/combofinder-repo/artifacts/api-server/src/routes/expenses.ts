import { Router } from "express";
import { db, expensesTable } from "@workspace/db";
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
    const rows = await db.select().from(expensesTable)
      .where(eq(expensesTable.userId, userId))
      .orderBy(desc(expensesTable.createdAt));
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch expenses" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const [row] = await db.select().from(expensesTable)
      .where(and(eq(expensesTable.id, Number(req.params.id)), eq(expensesTable.userId, userId)));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const b = req.body;
    if (!b.category || !b.amount || !b.date) {
      return res.status(400).json({ error: "category, amount, and date are required" });
    }
    const [row] = await db.insert(expensesTable).values({
      userId,
      category: String(b.category),
      amount: String(Number(b.amount)),
      description: b.description ? String(b.description) : null,
      date: String(b.date),
      notes: b.notes ? String(b.notes) : null,
    }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create expense" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const b = req.body;
    // Whitelist updatable fields — never allow userId reassignment
    const updates: Record<string, any> = {};
    if (b.category !== undefined)    updates.category = String(b.category);
    if (b.amount !== undefined)      updates.amount = String(Number(b.amount));
    if (b.description !== undefined) updates.description = b.description ? String(b.description) : null;
    if (b.date !== undefined)        updates.date = String(b.date);
    if (b.notes !== undefined)       updates.notes = b.notes ? String(b.notes) : null;

    const [row] = await db.update(expensesTable).set(updates)
      .where(and(eq(expensesTable.id, Number(req.params.id)), eq(expensesTable.userId, userId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    await db.delete(expensesTable)
      .where(and(eq(expensesTable.id, Number(req.params.id)), eq(expensesTable.userId, userId)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete" }); }
});

export default router;
