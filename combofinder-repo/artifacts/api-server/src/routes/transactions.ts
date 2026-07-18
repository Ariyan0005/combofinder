import { Router } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// All routes require requireUserAuth (mounted in index.ts) — req.userId is always set.

router.get("/", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const type = req.query.type ? String(req.query.type) : null;
    let rows = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.userId, userId))
      .orderBy(desc(transactionsTable.createdAt));
    if (type) rows = rows.filter(r => r.type === type);
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.get("/monthly", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const rows = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.userId, userId))
      .orderBy(transactionsTable.createdAt);
    // Group by month
    const monthly: Record<string, { income: number; expense: number }> = {};
    for (const row of rows) {
      const month = row.date ? row.date.substring(0, 7) : row.createdAt.toISOString().substring(0, 7);
      if (!monthly[month]) monthly[month] = { income: 0, expense: 0 };
      const amt = parseFloat(row.amount ?? "0");
      if (row.type === "Income") monthly[month].income += amt;
      else if (row.type === "Expense") monthly[month].expense += amt;
    }
    const result = Object.entries(monthly).map(([month, data]) => ({ month, ...data }));
    res.json(result);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const b = req.body;
    if (!b.type || !b.amount || !b.date) {
      return res.status(400).json({ error: "type, amount, and date are required" });
    }
    // Whitelist fields — never accept userId from request body
    const [row] = await db.insert(transactionsTable).values({
      userId,
      type: String(b.type),
      category: b.category ? String(b.category) : null,
      amount: String(Number(b.amount)),
      currency: b.currency ? String(b.currency) : "USD",
      description: b.description ? String(b.description) : null,
      relatedId: b.relatedId ? String(b.relatedId) : null,
      relatedType: b.relatedType ? String(b.relatedType) : null,
      paymentMethod: b.paymentMethod ? String(b.paymentMethod) : null,
      status: b.status ? String(b.status) : "Completed",
      date: String(b.date),
      notes: b.notes ? String(b.notes) : null,
    }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const b = req.body;
    // Whitelist updatable fields
    const updates: Record<string, any> = {};
    if (b.type !== undefined)          updates.type = String(b.type);
    if (b.category !== undefined)      updates.category = b.category ? String(b.category) : null;
    if (b.amount !== undefined)        updates.amount = String(Number(b.amount));
    if (b.currency !== undefined)      updates.currency = String(b.currency);
    if (b.description !== undefined)   updates.description = b.description ? String(b.description) : null;
    if (b.relatedId !== undefined)     updates.relatedId = b.relatedId ? String(b.relatedId) : null;
    if (b.relatedType !== undefined)   updates.relatedType = b.relatedType ? String(b.relatedType) : null;
    if (b.paymentMethod !== undefined) updates.paymentMethod = b.paymentMethod ? String(b.paymentMethod) : null;
    if (b.status !== undefined)        updates.status = String(b.status);
    if (b.date !== undefined)          updates.date = String(b.date);
    if (b.notes !== undefined)         updates.notes = b.notes ? String(b.notes) : null;

    const [row] = await db.update(transactionsTable).set(updates)
      .where(and(eq(transactionsTable.id, Number(req.params.id)), eq(transactionsTable.userId, userId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const deleted = await db.delete(transactionsTable)
      .where(and(eq(transactionsTable.id, Number(req.params.id)), eq(transactionsTable.userId, userId)))
      .returning({ id: transactionsTable.id });
    if (deleted.length === 0) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete" }); }
});

export default router;
