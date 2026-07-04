import { Router } from "express";
import { db, inventoryTable } from "@workspace/db";
import { eq, ilike, or, lte, sql } from "drizzle-orm";

const router = Router();

// GET /api/inventory?q=search
router.get("/", async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : null;
    const rows = q
      ? await db.select().from(inventoryTable).where(
          or(
            ilike(inventoryTable.partName, `%${q}%`),
            ilike(inventoryTable.barcode || sql`''`, `%${q}%`),
            ilike(inventoryTable.sku || sql`''`, `%${q}%`),
            ilike(inventoryTable.brand || sql`''`, `%${q}%`),
            ilike(inventoryTable.model || sql`''`, `%${q}%`),
          )
        ).orderBy(inventoryTable.partName)
      : await db.select().from(inventoryTable).orderBy(inventoryTable.partName);
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch inventory" }); }
});

// GET /api/inventory/low-stock
router.get("/low-stock", async (req, res) => {
  try {
    const rows = await db.select().from(inventoryTable)
      .where(lte(inventoryTable.quantity, inventoryTable.minStock))
      .orderBy(inventoryTable.quantity);
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

// GET /api/inventory/barcode/:code  — lookup by barcode OR sku (for QR scan)
router.get("/barcode/:code", async (req, res) => {
  try {
    const code = req.params.code.trim();
    const [row] = await db.select().from(inventoryTable)
      .where(or(eq(inventoryTable.barcode, code), eq(inventoryTable.sku, code)));
    if (!row) return res.status(404).json({ error: "No item found for this barcode" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

// GET /api/inventory/:id
router.get("/:id", async (req, res) => {
  try {
    const [row] = await db.select().from(inventoryTable).where(eq(inventoryTable.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

function toInt(v: any, field: string): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n))
    throw new Error(`${field} must be a non-negative integer`);
  return n;
}

function bodyToRow(b: Record<string, any>) {
  const partName = (b.partName ?? b.name ?? "").toString().trim();
  if (!partName) throw new Error("Item name is required");
  return {
    partName,
    partType: b.partType ?? "Other",
    brand: b.brand ? String(b.brand) : null,
    model: b.model ? String(b.model) : null,
    quality: b.quality ? String(b.quality) : null,
    quantity: b.quantity !== undefined ? toInt(b.quantity, "quantity") : undefined,
    minStock: b.minStock !== undefined ? toInt(b.minStock, "minStock") : undefined,
    purchasePrice: b.purchasePrice !== undefined && b.purchasePrice !== "" ? String(b.purchasePrice) : null,
    sellingPrice: b.sellingPrice !== undefined && b.sellingPrice !== "" ? String(b.sellingPrice) : null,
    // NEW fields
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

// POST /api/inventory
router.post("/", async (req, res) => {
  let values: ReturnType<typeof bodyToRow>;
  try { values = bodyToRow(req.body); }
  catch (err: any) { return res.status(400).json({ error: err.message }); }
  try {
    const [row] = await db.insert(inventoryTable).values(values as any).returning();
    res.status(201).json(row);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Failed to create item" }); }
});

// PUT /api/inventory/:id
router.put("/:id", async (req, res) => {
  let values: ReturnType<typeof bodyToRow>;
  try { values = bodyToRow(req.body); }
  catch (err: any) { return res.status(400).json({ error: err.message }); }
  try {
    const [row] = await db.update(inventoryTable).set(values as any)
      .where(eq(inventoryTable.id, Number(req.params.id))).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: any) { req.log.error(err); res.status(500).json({ error: "Failed to update item" }); }
});

// DELETE /api/inventory/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.delete(inventoryTable).where(eq(inventoryTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete item" }); }
});

export default router;
