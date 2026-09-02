import { Router } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const type = req.query.type ? String(req.query.type) : null;
    let rows = await db.select().from(transactionsTable).orderBy(desc(transactionsTable.createdAt));
    if (type) rows = rows.filter(r => r.type === type);
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.get("/monthly", async (_req, res) => {
  try {
    // Generate monthly income/expense summary from transactions
    const rows = await db.select().from(transactionsTable).orderBy(transactionsTable.createdAt);
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
    const [row] = await db.insert(transactionsTable).values(req.body).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const [row] = await db.update(transactionsTable).set(req.body).where(eq(transactionsTable.id, Number(req.params.id))).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(transactionsTable).where(eq(transactionsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete" }); }
});

export default router;
