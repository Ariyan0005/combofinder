import { Router } from "express";
import { db, stockMovementsTable, inventoryTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

// GET /api/stock-movements?inventoryId=X&limit=50
router.get("/", async (req, res) => {
  try {
    const invId = req.query.inventoryId ? Number(req.query.inventoryId) : null;
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    let q = db.select().from(stockMovementsTable).orderBy(desc(stockMovementsTable.createdAt)).limit(limit);
    if (invId) q = db.select().from(stockMovementsTable)
      .where(eq(stockMovementsTable.inventoryId, invId))
      .orderBy(desc(stockMovementsTable.createdAt))
      .limit(limit) as any;
    const rows = await q;
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

// POST /api/stock-movements  — record movement and update inventory quantity
router.post("/", async (req, res) => {
  const { inventoryId, type, quantity, supplierId, supplierName, unitPrice, totalPrice, notes, reference } = req.body;

  if (!inventoryId || !type || !quantity) {
    return res.status(400).json({ error: "inventoryId, type and quantity are required" });
  }
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: "quantity must be a positive number" });
  }
  if (!["in", "sale", "out", "adjustment"].includes(type)) {
    return res.status(400).json({ error: "type must be in | sale | out | adjustment" });
  }

  try {
    // Update inventory quantity atomically
    const delta = type === "in" ? qty : -qty;
    const [updated] = await db
      .update(inventoryTable)
      .set({
        quantity: sql`${inventoryTable.quantity} + ${delta}`,
        updatedAt: new Date(),
        // Update supplier text when stocking in
        ...(type === "in" && supplierName ? { supplier: supplierName } : {}),
      })
      .where(eq(inventoryTable.id, Number(inventoryId)))
      .returning();

    if (!updated) return res.status(404).json({ error: "Inventory item not found" });
    if (updated.quantity < 0) {
      // Rollback if stock would go negative
      await db.update(inventoryTable)
        .set({ quantity: sql`${inventoryTable.quantity} - ${delta}`, updatedAt: new Date() })
        .where(eq(inventoryTable.id, Number(inventoryId)));
      return res.status(400).json({ error: "Not enough stock" });
    }

    // Record movement
    const [movement] = await db.insert(stockMovementsTable).values({
      inventoryId: Number(inventoryId),
      type,
      quantity: qty,
      supplierId: supplierId ? Number(supplierId) : null,
      supplierName: supplierName ?? null,
      unitPrice: unitPrice ? String(unitPrice) : null,
      totalPrice: totalPrice ? String(totalPrice) : null,
      notes: notes ?? null,
      reference: reference ?? null,
    }).returning();

    res.status(201).json({ movement, updatedItem: updated });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: err.message ?? "Failed to record movement" });
  }
});

export default router;
