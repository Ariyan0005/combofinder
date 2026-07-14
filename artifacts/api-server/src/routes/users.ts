import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, or, sql, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : null;
    const accountType = req.query.accountType ? String(req.query.accountType) : null;
    const plan = req.query.plan ? String(req.query.plan) : null;
    let rows = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    if (q) rows = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) || r.email.toLowerCase().includes(q.toLowerCase()));
    if (accountType) rows = rows.filter(r => r.accountType === accountType);
    if (plan) rows = rows.filter(r => r.subscriptionPlan === plan);
    // strip password hash
    return res.json(rows.map(({ passwordHash: _, ...u }) => u));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch users" }); }
});

router.get("/stats", async (_req, res) => {
  try {
    const [total] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(usersTable);
    const [active] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(usersTable).where(eq(usersTable.isActive, true));
    const [pending] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(usersTable).where(eq(usersTable.isApproved, false));
    const byPlan = await db.select({ plan: usersTable.subscriptionPlan, count: sql<number>`cast(count(*) as int)` }).from(usersTable).groupBy(usersTable.subscriptionPlan);
    res.json({ total: total?.count ?? 0, active: active?.count ?? 0, pending: pending?.count ?? 0, byPlan });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const [row] = await db.select().from(usersTable).where(eq(usersTable.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ error: "Not found" });
    const { passwordHash: _, ...safe } = row;
    res.json(safe);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const [row] = await db.insert(usersTable).values({ ...req.body, updatedAt: new Date() }).returning();
    const { passwordHash: _, ...safe } = row;
    res.status(201).json(safe);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create user" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const [row] = await db.update(usersTable).set({ ...req.body, updatedAt: new Date() }).where(eq(usersTable.id, Number(req.params.id))).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    const { passwordHash: _, ...safe } = row;
    res.json(safe);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update user" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(usersTable).where(eq(usersTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete user" }); }
});

export default router;
