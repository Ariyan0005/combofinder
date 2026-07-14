import { Router } from "express";
import { db, repairsTable } from "@workspace/db";
import { eq, ilike, or, desc, sql, and } from "drizzle-orm";

const router = Router();

function getUid(req: any, res: any): number | null {
  const uid: number | undefined = req.userId;
  if (!uid) { res.status(403).json({ error: "User session invalid" }); return null; }
  return uid;
}

router.get("/", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const q = req.query.q ? String(req.query.q) : null;
    const status = req.query.status ? String(req.query.status) : null;
    const customerId = req.query.customerId ? Number(req.query.customerId) : null;
    const userFilter = eq(repairsTable.userId, userId);
    const customerFilter = customerId ? eq(repairsTable.customerId, customerId) : undefined;

    let query = db.select().from(repairsTable).$dynamic();
    if (q) {
      const searchFilter = or(
        ilike(repairsTable.customerName, `%${q}%`),
        ilike(repairsTable.phoneModel, `%${q}%`),
        ilike(repairsTable.phoneBrand, `%${q}%`),
        ilike(repairsTable.imei || sql`''`, `%${q}%`)
      );
      const combined = [userFilter, customerFilter, searchFilter].filter(Boolean) as any[];
      query = query.where(and(...combined));
    } else {
      const combined = [userFilter, customerFilter].filter(Boolean) as any[];
      query = query.where(combined.length > 1 ? and(...combined) : combined[0]);
    }
    const rows = await query.orderBy(desc(repairsTable.createdAt));
    const filtered = status ? rows.filter(r => r.status === status) : rows;
    res.json(filtered);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch repairs" }); }
});

router.get("/stats", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const userFilter = eq(repairsTable.userId, userId);

    const buildCount = (extra: any) => db.select({ count: sql<number>`cast(count(*) as int)` })
      .from(repairsTable)
      .where(and(userFilter, extra));

    const [repairing] = await buildCount(eq(repairsTable.status, "Repairing"));
    const [ready] = await buildCount(eq(repairsTable.status, "Ready"));
    const [cancelled] = await buildCount(eq(repairsTable.status, "Cancelled"));
    const [total] = await db.select({ count: sql<number>`cast(count(*) as int)` })
      .from(repairsTable).where(userFilter);

    res.json({ repairing: repairing?.count ?? 0, ready: ready?.count ?? 0, cancelled: cancelled?.count ?? 0, total: total?.count ?? 0 });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const [row] = await db.select().from(repairsTable)
      .where(and(eq(repairsTable.id, Number(req.params.id)), eq(repairsTable.userId, userId)));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const [row] = await db.insert(repairsTable).values({ ...req.body, userId, updatedAt: new Date() }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create repair" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const b = req.body;

    // Whitelist only schema columns to avoid Drizzle type errors from unknown/string-date fields
    const updateFields: Record<string, unknown> = {
      customerName:  b.customerName,
      customerPhone: b.customerPhone ?? "",
      phoneBrand:    b.phoneBrand,
      phoneModel:    b.phoneModel,
      imei:          b.imei ?? null,
      problem:       b.problem,
      status:        b.status,
      engineer:      b.engineer ?? null,
      partsUsed:     b.partsUsed ?? null,
      laborCost:     b.laborCost ?? null,
      partsCost:     b.partsCost ?? null,
      totalCost:     b.totalCost ?? null,
      advancePaid:   b.advancePaid ?? null,
      isPaid:        b.isPaid ?? false,
      notes:         b.notes ?? null,
      warrantyDays:  b.warrantyDays ?? 0,
      updatedAt:     new Date(),
    };

    // Set deliveredAt only when transitioning to Delivered
    if (b.status === "Delivered") {
      updateFields.deliveredAt = b.deliveredAt ? new Date(b.deliveredAt) : new Date();
    } else if (b.deliveredAt) {
      updateFields.deliveredAt = new Date(b.deliveredAt);
    }

    const [row] = await db.update(repairsTable).set(updateFields)
      .where(and(eq(repairsTable.id, Number(req.params.id)), eq(repairsTable.userId, userId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update repair" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    await db.delete(repairsTable)
      .where(and(eq(repairsTable.id, Number(req.params.id)), eq(repairsTable.userId, userId)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete repair" }); }
});

export default router;
