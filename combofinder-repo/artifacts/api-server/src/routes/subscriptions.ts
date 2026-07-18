import { Router } from "express";
import { db, subscriptionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

// NOTE: this router is mounted with requireAdminAuth in routes/index.ts.
// Only authenticated admin sessions can reach these endpoints.

const router = Router();

router.get("/", async (req, res) => {
  try {
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
    const b = req.body;
    if (!b.plan || !b.price) return res.status(400).json({ error: "plan and price are required" });
    // Whitelist fields — admin-controlled insert
    const [row] = await db.insert(subscriptionsTable).values({
      userId: b.userId ? Number(b.userId) : null,
      plan: String(b.plan),
      price: String(Number(b.price)),
      currency: b.currency ? String(b.currency) : "USD",
      status: b.status ? String(b.status) : "Paid",
      billingCycle: b.billingCycle ? String(b.billingCycle) : "Monthly",
      startDate: b.startDate ? String(b.startDate) : null,
      endDate: b.endDate ? String(b.endDate) : null,
      transactionId: b.transactionId ? String(b.transactionId) : null,
      paymentMethod: b.paymentMethod ? String(b.paymentMethod) : null,
      notes: b.notes ? String(b.notes) : null,
    }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create subscription" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const b = req.body;
    // Whitelist updatable fields
    const updates: Record<string, any> = {};
    if (b.userId !== undefined)        updates.userId = b.userId ? Number(b.userId) : null;
    if (b.plan !== undefined)          updates.plan = String(b.plan);
    if (b.price !== undefined)         updates.price = String(Number(b.price));
    if (b.currency !== undefined)      updates.currency = String(b.currency);
    if (b.status !== undefined)        updates.status = String(b.status);
    if (b.billingCycle !== undefined)  updates.billingCycle = String(b.billingCycle);
    if (b.startDate !== undefined)     updates.startDate = b.startDate ? String(b.startDate) : null;
    if (b.endDate !== undefined)       updates.endDate = b.endDate ? String(b.endDate) : null;
    if (b.transactionId !== undefined) updates.transactionId = b.transactionId ? String(b.transactionId) : null;
    if (b.paymentMethod !== undefined) updates.paymentMethod = b.paymentMethod ? String(b.paymentMethod) : null;
    if (b.notes !== undefined)         updates.notes = b.notes ? String(b.notes) : null;

    const [row] = await db.update(subscriptionsTable).set(updates)
      .where(eq(subscriptionsTable.id, Number(req.params.id))).returning();
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
