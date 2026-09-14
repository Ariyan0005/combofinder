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

// Whitelist allowed fields to prevent mass-assignment attacks.
function pickSubscriptionFields(body: any): Record<string, any> {
  const allowed: Record<string, any> = {};
  if (body.userId        !== undefined) allowed.userId        = Number(body.userId);
  if (body.plan          !== undefined) allowed.plan          = String(body.plan);
  if (body.price         !== undefined) allowed.price         = String(body.price);
  if (body.currency      !== undefined) allowed.currency      = String(body.currency);
  if (body.status        !== undefined) allowed.status        = String(body.status);
  if (body.billingCycle  !== undefined) allowed.billingCycle  = String(body.billingCycle);
  if (body.startDate     !== undefined) allowed.startDate     = body.startDate ? String(body.startDate) : null;
  if (body.endDate       !== undefined) allowed.endDate       = body.endDate   ? String(body.endDate)   : null;
  if (body.transactionId !== undefined) allowed.transactionId = body.transactionId ? String(body.transactionId) : null;
  if (body.paymentMethod !== undefined) allowed.paymentMethod = body.paymentMethod ? String(body.paymentMethod) : null;
  if (body.notes         !== undefined) allowed.notes         = body.notes ? String(body.notes) : null;
  return allowed;
}

router.post("/", async (req, res) => {
  try {
    const values = pickSubscriptionFields(req.body);
    if (!values.plan || !values.price) {
      res.status(400).json({ error: "plan and price are required" }); return;
    }
    const [row] = await db.insert(subscriptionsTable).values(values as any).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create subscription" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const updates = pickSubscriptionFields(req.body);
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No valid fields to update" }); return;
    }
    const [row] = await db.update(subscriptionsTable).set(updates).where(eq(subscriptionsTable.id, Number(req.params.id))).returning();
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
