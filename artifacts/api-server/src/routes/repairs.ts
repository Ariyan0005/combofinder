import { Router } from "express";
import { db, repairsTable } from "@workspace/db";
import { eq, ilike, or, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : null;
    const status = req.query.status ? String(req.query.status) : null;
    let query = db.select().from(repairsTable).$dynamic();
    if (q) {
      query = query.where(or(
        ilike(repairsTable.customerName, `%${q}%`),
        ilike(repairsTable.phoneModel, `%${q}%`),
        ilike(repairsTable.phoneBrand, `%${q}%`),
        ilike(repairsTable.imei || sql`''`, `%${q}%`)
      ));
    }
    const rows = await query.orderBy(desc(repairsTable.createdAt));
    const filtered = status ? rows.filter(r => r.status === status) : rows;
    res.json(filtered);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch repairs" }); }
});

router.get("/stats", async (_req, res) => {
  try {
    const [waiting] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(repairsTable).where(eq(repairsTable.status, "Waiting"));
    const [repairing] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(repairsTable).where(eq(repairsTable.status, "Repairing"));
    const [ready] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(repairsTable).where(eq(repairsTable.status, "Ready"));
    const [total] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(repairsTable);
    res.json({ waiting: waiting?.count ?? 0, repairing: repairing?.count ?? 0, ready: ready?.count ?? 0, total: total?.count ?? 0 });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const [row] = await db.select().from(repairsTable).where(eq(repairsTable.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const [row] = await db.insert(repairsTable).values({ ...req.body, updatedAt: new Date() }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create repair" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const body = { ...req.body, updatedAt: new Date() };
    if (body.status === "Delivered" && !body.deliveredAt) body.deliveredAt = new Date();
    const [row] = await db.update(repairsTable).set(body).where(eq(repairsTable.id, Number(req.params.id))).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update repair" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(repairsTable).where(eq(repairsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete repair" }); }
});

export default router;
