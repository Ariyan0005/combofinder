import { Router } from "express";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { db, branchesTable, staffTable, inventoryTable } from "@workspace/db";

const router = Router();
const publicBranch = (row: any, staffCount = 0, inventoryCount = 0) => ({
  ...row,
  status: row.isActive ? "Active" : "Inactive",
  staff: staffCount,
  inventory: inventoryCount,
});

router.get("/", async (req, res) => {
  try {
    const userId = Number((req as any).userId);
    let rows = await db
      .select()
      .from(branchesTable)
      .where(eq(branchesTable.userId, userId))
      .orderBy(asc(branchesTable.createdAt));

    const hasMain = rows.some(r => r.code === "MAIN");
    if (!hasMain) {
      try {
        const [defaultRow] = await db
          .insert(branchesTable)
          .values({
            userId,
            name: "Default Branch",
            code: "MAIN",
            city: "Main City",
            address: "Main Store",
            isActive: true,
          })
          .returning();
        if (defaultRow) {
          rows = [defaultRow, ...rows];
        }
      } catch (e) {
        // Fallback if already inserted concurrently
      }
    }

    // Always sort so that MAIN branch is first
    rows.sort((a, b) => (a.code === "MAIN" ? -1 : b.code === "MAIN" ? 1 : 0));

    // Get staff counts per branch
    const staffCounts = await db
      .select({ branchId: staffTable.branchId, count: sql<number>`cast(count(*) as int)` })
      .from(staffTable)
      .where(eq(staffTable.userId, userId))
      .groupBy(staffTable.branchId);

    const staffMap = new Map<string, number>();
    for (const s of staffCounts) {
      if (s.branchId) staffMap.set(String(s.branchId), s.count);
    }

    // Get inventory counts per branch
    const invCounts = await db
      .select({ branchId: inventoryTable.branchId, count: sql<number>`cast(count(*) as int)` })
      .from(inventoryTable)
      .where(eq(inventoryTable.userId, userId))
      .groupBy(inventoryTable.branchId);

    const invMap = new Map<string, number>();
    for (const i of invCounts) {
      if (i.branchId) invMap.set(String(i.branchId), i.count);
    }

    res.json(rows.map(row => {
      const staffC = staffMap.get(String(row.id)) || 0;
      const invC = invMap.get(String(row.id)) || 0;
      return publicBranch(row, staffC, invC);
    }));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = Number((req as any).userId), b = req.body ?? {};
    const name = String(b.name ?? "").trim(), code = String(b.code ?? "").trim().toUpperCase(), city = String(b.city ?? "").trim(), address = String(b.address ?? "").trim();
    if (!name || !code || !city || !address) return res.status(400).json({ error: "Name, code, city, and address are required" });
    const [existing] = await db.select({ id: branchesTable.id }).from(branchesTable).where(and(eq(branchesTable.userId, userId), eq(branchesTable.code, code))).limit(1);
    if (existing) return res.status(409).json({ error: "That branch code is already in use" });
    const [row] = await db.insert(branchesTable).values({ userId, name, code, city, address }).returning(); res.status(201).json(publicBranch(row));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create branch" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = Number((req as any).userId), b = req.body ?? {}, updates: Record<string, any> = { updatedAt: new Date() };
    for (const key of ["name", "city", "address"] as const) if (b[key] !== undefined) updates[key] = String(b[key]).trim();
    if (b.code !== undefined) updates.code = String(b.code).trim().toUpperCase();
    if (b.status !== undefined) updates.isActive = String(b.status).toLowerCase() === "active";
    if (b.isActive !== undefined) updates.isActive = Boolean(b.isActive);
    if (updates.code) { const [existing] = await db.select({ id: branchesTable.id }).from(branchesTable).where(and(eq(branchesTable.userId, userId), eq(branchesTable.code, updates.code), ne(branchesTable.id, Number(req.params.id)))).limit(1); if (existing) return res.status(409).json({ error: "That branch code is already in use" }); }
    const [row] = await db.update(branchesTable).set(updates).where(and(eq(branchesTable.id, Number(req.params.id)), eq(branchesTable.userId, userId))).returning();
    if (!row) return res.status(404).json({ error: "Branch not found" }); res.json(publicBranch(row));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update branch" }); }
});

export default router;
