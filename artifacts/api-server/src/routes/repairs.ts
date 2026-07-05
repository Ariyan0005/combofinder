import { Router } from "express";
import { db, repairsTable } from "@workspace/db";
import { eq, ilike, or, desc, sql, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const userId: number | undefined = (req as any).userId;
    const q = req.query.q ? String(req.query.q) : null;
    const status = req.query.status ? String(req.query.status) : null;
    const userFilter = userId ? eq(repairsTable.userId, userId) : undefined;

    let query = db.select().from(repairsTable).$dynamic();
    if (q) {
      const searchFilter = or(
        ilike(repairsTable.customerName, `%${q}%`),
        ilike(repairsTable.phoneModel, `%${q}%`),
        ilike(repairsTable.phoneBrand, `%${q}%`),
        ilike(repairsTable.imei || sql`''`, `%${q}%`)
      );
      query = query.where(userFilter ? and(userFilter, searchFilter) : searchFilter);
    } else if (userFilter) {
      query = query.where(userFilter);
    }
    const rows = await query.orderBy(desc(repairsTable.createdAt));
    const filtered = status ? rows.filter(r => r.status === status) : rows;
    res.json(filtered);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch repairs" }); }
});

router.get("/stats", async (req, res) => {
  try {
    const userId: number | undefined = (req as any).userId;
    const userFilter = userId ? eq(repairsTable.userId, userId) : undefined;

    const buildCount = (extra: any) => db.select({ count: sql<number>`cast(count(*) as int)` })
      .from(repairsTable)
      .where(userFilter ? and(userFilter, extra) : extra);

    const [waiting] = await buildCount(eq(repairsTable.status, "Waiting"));
    const [repairing] = await buildCount(eq(repairsTable.status, "Repairing"));
    const [ready] = await buildCount(eq(repairsTable.status, "Ready"));
    const [total] = await db.select({ count: sql<number>`cast(count(*) as int)` })
      .from(repairsTable).where(userFilter);

    res.json({ waiting: waiting?.count ?? 0, repairing: repairing?.count ?? 0, ready: ready?.count ?? 0, total: total?.count ?? 0 });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const userId: number | undefined = (req as any).userId;
    const [row] = await db.select().from(repairsTable)
      .where(userId
        ? and(eq(repairsTable.id, Number(req.params.id)), eq(repairsTable.userId, userId))
        : eq(repairsTable.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const userId: number | undefined = (req as any).userId;
    const [row] = await db.insert(repairsTable).values({ ...req.body, userId: userId ?? null, updatedAt: new Date() }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create repair" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const userId: number | undefined = (req as any).userId;
    const body = { ...req.body, updatedAt: new Date() };
    if (body.status === "Delivered" && !body.deliveredAt) body.deliveredAt = new Date();
    const whereClause = userId
      ? and(eq(repairsTable.id, Number(req.params.id)), eq(repairsTable.userId, userId))
      : eq(repairsTable.id, Number(req.params.id));
    const [row] = await db.update(repairsTable).set(body).where(whereClause).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update repair" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId: number | undefined = (req as any).userId;
    const whereClause = userId
      ? and(eq(repairsTable.id, Number(req.params.id)), eq(repairsTable.userId, userId))
      : eq(repairsTable.id, Number(req.params.id));
    await db.delete(repairsTable).where(whereClause);
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete repair" }); }
});

export default router;
