import { Router } from "express";
import { db, inventoryTable, usersTable } from "@workspace/db";
import { eq, ilike, or, lte, sql, and } from "drizzle-orm";

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
    const userFilter = eq(inventoryTable.userId, userId);
    let rows;
    if (q) {
      const searchFilter = or(
        ilike(inventoryTable.partName, `%${q}%`),
        ilike(inventoryTable.barcode || sql`''`, `%${q}%`),
        ilike(inventoryTable.sku || sql`''`, `%${q}%`),
        ilike(inventoryTable.brand || sql`''`, `%${q}%`),
        ilike(inventoryTable.model || sql`''`, `%${q}%`),
      );
      rows = await db.select().from(inventoryTable)
        .where(and(userFilter, searchFilter))
        .orderBy(inventoryTable.partName);
    } else {
      rows = await db.select().from(inventoryTable).where(userFilter).orderBy(inventoryTable.partName);
    }
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch inventory" }); }
});

router.get("/low-stock", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const rows = await db.select().from(inventoryTable)
      .where(and(eq(inventoryTable.userId, userId), lte(inventoryTable.quantity, inventoryTable.minStock)))
      .orderBy(inventoryTable.quantity);
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.get("/barcode/:code", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const code = req.params.code.trim();
    const barcodeFilter = or(eq(inventoryTable.barcode, code), eq(inventoryTable.sku, code));
    const [row] = await db.select().from(inventoryTable)
      .where(and(eq(inventoryTable.userId, userId), barcodeFilter));
    if (!row) return res.status(404).json({ error: "No item found for this barcode" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const [row] = await db.select().from(inventoryTable)
      .where(and(eq(inventoryTable.id, Number(req.params.id)), eq(inventoryTable.userId, userId)));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

function toInt(v: any, field: string): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) throw new Error(`${field} must be a non-negative integer`);
  return n;
}

function bodyToRow(b: Record<string, any>, userId: number) {
  const partName = (b.partName ?? b.name ?? "").toString().trim();
  if (!partName) throw new Error("Item name is required");
  return {
    userId,
    partName,
    partType: b.partType ?? "Other",
    brand: b.brand ? String(b.brand) : null,
    model: b.model ? String(b.model) : null,
    quality: b.quality ? String(b.quality) : null,
    quantity: b.quantity !== undefined ? toInt(b.quantity, "quantity") : undefined,
    minStock: b.minStock !== undefined ? toInt(b.minStock, "minStock") : undefined,
    purchasePrice: b.purchasePrice !== undefined && b.purchasePrice !== "" ? String(b.purchasePrice) : null,
    sellingPrice: b.sellingPrice !== undefined && b.sellingPrice !== "" ? String(b.sellingPrice) : null,
    supplierId: b.supplierId ? Number(b.supplierId) : null,
    categoryId: b.categoryId ? Number(b.categoryId) : null,
    barcode: b.barcode ? String(b.barcode).trim() : null,
    sku: b.sku ? String(b.sku).trim() : null,
    supplier: b.supplier ? String(b.supplier) : null,
    shelfLocation: b.shelfLocation ? String(b.shelfLocation) : null,
    notes: b.notes ? String(b.notes) : null,
    updatedAt: new Date(),
  };
}

router.post("/", async (req, res) => {
  const userId = getUid(req, res); if (!userId) return;
  let values: ReturnType<typeof bodyToRow>;
  try { values = bodyToRow(req.body, userId); }
  catch (err: any) { return res.status(400).json({ error: err.message }); }
  try {
    // Enforce Free plan limit: 50 inventory items total
    const [userRow] = await db.select({ subscriptionPlan: usersTable.subscriptionPlan })
      .from(usersTable).where(eq(usersTable.id, userId));
    if (!userRow || (userRow.subscriptionPlan ?? "Free") === "Free") {
      const [countRow] = await db.select({ count: sql<number>`cast(count(*) as int)` })
        .from(inventoryTable).where(eq(inventoryTable.userId, userId));
      if ((countRow?.count ?? 0) >= 50) {
        return res.status(403).json({ error: "Free plan limit reached: 50 inventory items. Upgrade to Pro for unlimited inventory." });
      }
    }

    const [row] = await db.insert(inventoryTable).values(values as any).returning();
    res.status(201).json(row);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Failed to create item" }); }
});

router.put("/:id", async (req, res) => {
  const userId = getUid(req, res); if (!userId) return;
  let values: ReturnType<typeof bodyToRow>;
  try { values = bodyToRow(req.body, userId); }
  catch (err: any) { return res.status(400).json({ error: err.message }); }
  try {
    const [row] = await db.update(inventoryTable).set(values as any)
      .where(and(eq(inventoryTable.id, Number(req.params.id)), eq(inventoryTable.userId, userId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Failed to update item" }); }
});

router.delete("/:id", async (req, res) => {
  const userId = getUid(req, res); if (!userId) return;
  try {
    await db.delete(inventoryTable)
      .where(and(eq(inventoryTable.id, Number(req.params.id)), eq(inventoryTable.userId, userId)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete item" }); }
});

export default router;
