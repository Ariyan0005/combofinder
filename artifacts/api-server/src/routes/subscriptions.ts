import { Router } from "express";
import { db, subscriptionsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : null;
    const plan = req.query.plan ? String(req.query.plan) : null;
    let rows = await db.select().from(subscriptionsTable).orderBy(desc(subscriptionsTable.createdAt));
    if (plan) rows = rows.filter(r => r.plan === plan);
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch subscriptions" }); }
});

router.get("/revenue", async (_req, res) => {
  try {
    const rows = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.status, "Paid"));
    const total = rows.reduce((sum, r) => sum + parseFloat(r.price ?? "0"), 0);
    const byPlan = rows.reduce((acc: Record<string, number>, r) => {
      acc[r.plan] = (acc[r.plan] ?? 0) + parseFloat(r.price ?? "0");
      return acc;
    }, {});
    res.json({ total: total.toFixed(2), byPlan });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const [row] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const [row] = await db.insert(subscriptionsTable).values(req.body).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create subscription" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const [row] = await db.update(subscriptionsTable).set(req.body).where(eq(subscriptionsTable.id, Number(req.params.id))).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(subscriptionsTable).where(eq(subscriptionsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete" }); }
});

export default router;
