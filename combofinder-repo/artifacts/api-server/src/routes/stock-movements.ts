import { Router } from "express";
import { db, stockMovementsTable, inventoryTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

function requireInt(v: unknown, name: string, min = 1): number {
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min)
    throw new Error(`${name} must be an integer >= ${min}`);
  return n;
}

// GET /api/stock-movements?inventoryId=X&limit=50
// Only returns movements for inventory items owned by the current user.
router.get("/", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const invId = req.query.inventoryId ? requireInt(req.query.inventoryId, "inventoryId") : null;
    const limit = req.query.limit ? Math.min(Math.max(requireInt(req.query.limit, "limit", 1), 1), 200) : 50;

    if (invId) {
      // Verify this inventory item belongs to the current user
      const [inv] = await db.select({ id: inventoryTable.id })
        .from(inventoryTable)
        .where(and(eq(inventoryTable.id, invId), eq(inventoryTable.userId, userId)));
      if (!inv) return res.status(404).json({ error: "Inventory item not found" });

      const rows = await db.select().from(stockMovementsTable)
        .where(eq(stockMovementsTable.inventoryId, invId))
        .orderBy(desc(stockMovementsTable.createdAt))
        .limit(limit);
      return res.json(rows);
    }

    // No inventoryId: return movements for all of this user's inventory items
    // Join with inventory table to enforce ownership
    const rows = await db.select({
      id: stockMovementsTable.id,
      userId: stockMovementsTable.userId,
      inventoryId: stockMovementsTable.inventoryId,
      type: stockMovementsTable.type,
      quantity: stockMovementsTable.quantity,
      supplierId: stockMovementsTable.supplierId,
      supplierName: stockMovementsTable.supplierName,
      unitPrice: stockMovementsTable.unitPrice,
      totalPrice: stockMovementsTable.totalPrice,
      notes: stockMovementsTable.notes,
      reference: stockMovementsTable.reference,
      createdAt: stockMovementsTable.createdAt,
    })
      .from(stockMovementsTable)
      .innerJoin(inventoryTable, and(
        eq(stockMovementsTable.inventoryId, inventoryTable.id),
        eq(inventoryTable.userId, userId),
      ))
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
    const userId: number = (req as any).userId;

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
      // AND the inventory item belongs to the current user (ownership check)
      const [updated] = await tx
        .update(inventoryTable)
        .set({
          quantity: sql`GREATEST(0, ${inventoryTable.quantity} + ${delta})`,
          updatedAt: new Date(),
          ...(type === "in" && supplierName ? { supplier: supplierName } : {}),
        })
        .where(
          type === "in"
            ? and(eq(inventoryTable.id, inventoryId), eq(inventoryTable.userId, userId))
            : and(eq(inventoryTable.id, inventoryId), eq(inventoryTable.userId, userId), sql`${inventoryTable.quantity} >= ${quantity}`)
        )
        .returning();

      if (!updated) {
        const [current] = await tx.select({ q: inventoryTable.quantity, uid: inventoryTable.userId })
          .from(inventoryTable).where(eq(inventoryTable.id, inventoryId));
        if (!current) throw Object.assign(new Error("Inventory item not found"), { status: 404 });
        if (current.uid !== userId) throw Object.assign(new Error("Inventory item not found"), { status: 404 });
        throw Object.assign(
          new Error(`Not enough stock (available: ${current.q}, requested: ${quantity})`),
          { status: 400 }
        );
      }

      // Insert movement ledger record — include userId for future scoping
      const [movement] = await tx.insert(stockMovementsTable).values({
        userId,
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
