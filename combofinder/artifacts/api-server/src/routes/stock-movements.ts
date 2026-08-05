import { Router } from "express";
import { db, stockMovementsTable, inventoryTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

function requireInt(v: unknown, name: string, min = 1): number {
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min)
    throw new Error(`${name} must be an integer >= ${min}`);
  return n;
}

// GET /api/stock-movements?inventoryId=X&limit=50
router.get("/", async (req, res) => {
  try {
    const invId = req.query.inventoryId ? requireInt(req.query.inventoryId, "inventoryId") : null;
    const limit = req.query.limit ? Math.min(Math.max(requireInt(req.query.limit, "limit", 1), 1), 200) : 50;

    const rows = invId
      ? await db.select().from(stockMovementsTable)
          .where(eq(stockMovementsTable.inventoryId, invId))
          .orderBy(desc(stockMovementsTable.createdAt))
          .limit(limit)
      : await db.select().from(stockMovementsTable)
          .orderBy(desc(stockMovementsTable.createdAt))
          .limit(limit);

    res.json(rows);
  } catch (err: any) {
    if (err.message?.includes("must be")) return res.status(400).json({ error: err.message });
    req.log.error(err); res.status(500).json({ error: "Failed" });
  }
});

// POST /api/stock-movements — atomically update inventory qty + insert movement record
router.post("/", async (req, res) => {
  try {
    // ── Validate inputs ────────────────────────────────────────────────────────
    const inventoryId = requireInt(req.body.inventoryId, "inventoryId");
    const { type, notes, reference } = req.body;

    if (!["in", "sale", "out", "adjustment"].includes(type))
      return res.status(400).json({ error: "type must be: in | sale | out | adjustment" });

    const quantity = requireInt(req.body.quantity, "quantity");
    const supplierId = req.body.supplierId ? requireInt(req.body.supplierId, "supplierId") : null;
    const supplierName = req.body.supplierName ? String(req.body.supplierName).slice(0, 200) : null;
    const unitPrice  = req.body.unitPrice  ? String(Number(req.body.unitPrice))  : null;
    const totalPrice = req.body.totalPrice ? String(Number(req.body.totalPrice)) : null;

    // ── Atomic transaction ─────────────────────────────────────────────────────
    const delta = type === "in" ? quantity : -quantity;

    const result = await db.transaction(async (tx) => {
      // Update inventory quantity — only succeed if result stays >= 0
      const [updated] = await tx
        .update(inventoryTable)
        .set({
          quantity: sql`GREATEST(0, ${inventoryTable.quantity} + ${delta})`,
          updatedAt: new Date(),
          ...(type === "in" && supplierName ? { supplier: supplierName } : {}),
          // Also persist the unit price as the item's purchase price on stock-in
          ...(type === "in" && unitPrice ? { purchasePrice: unitPrice } : {}),
        })
        .where(
          // For outgoing movements enforce quantity >= amount being removed
          type === "in"
            ? eq(inventoryTable.id, inventoryId)
            : sql`${inventoryTable.id} = ${inventoryId} AND ${inventoryTable.quantity} >= ${quantity}`
        )
        .returning();

      if (!updated) {
        // Rolled back automatically by transaction — tell caller why
        const [current] = await tx.select({ q: inventoryTable.quantity })
          .from(inventoryTable).where(eq(inventoryTable.id, inventoryId));
        if (!current) throw Object.assign(new Error("Inventory item not found"), { status: 404 });
        throw Object.assign(
          new Error(`Not enough stock (available: ${current.q}, requested: ${quantity})`),
          { status: 400 }
        );
      }

      // Insert movement ledger record
      const [movement] = await tx.insert(stockMovementsTable).values({
        inventoryId, type, quantity, supplierId, supplierName,
        unitPrice, totalPrice,
        notes: notes ? String(notes).slice(0, 500) : null,
        reference: reference ? String(reference).slice(0, 200) : null,
      }).returning();

      return { movement, updatedItem: updated };
    });

    res.status(201).json(result);
  } catch (err: any) {
    const status = err.status ?? 500;
    if (status < 500) return res.status(status).json({ error: err.message });
    req.log.error(err);
    res.status(500).json({ error: "Failed to record movement" });
  }
});

export default router;
