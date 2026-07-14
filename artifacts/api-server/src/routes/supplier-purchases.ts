import { Router } from "express";
import { db, supplierPurchasesTable, supplierPaymentsTable, suppliersTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

function getUid(req: any, res: any): number | null {
  const uid: number | undefined = req.userId;
  if (!uid) { res.status(403).json({ error: "User session invalid" }); return null; }
  return uid;
}

function parseAmount(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// GET /api/supplier-purchases?supplierId=X  — list purchases for a supplier
router.get("/", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const supplierId = req.query.supplierId ? Number(req.query.supplierId) : null;

    const rows = supplierId
      ? await db.select().from(supplierPurchasesTable)
          .where(and(eq(supplierPurchasesTable.userId, userId), eq(supplierPurchasesTable.supplierId, supplierId)))
          .orderBy(desc(supplierPurchasesTable.createdAt))
      : await db.select().from(supplierPurchasesTable)
          .where(eq(supplierPurchasesTable.userId, userId))
          .orderBy(desc(supplierPurchasesTable.createdAt))
          .limit(100);

    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

// GET /api/supplier-purchases/balance?supplierId=X  — total due/paid for a supplier
router.get("/balance", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const supplierId = req.query.supplierId ? Number(req.query.supplierId) : null;

    const whereClause = supplierId
      ? and(eq(supplierPurchasesTable.userId, userId), eq(supplierPurchasesTable.supplierId, supplierId))
      : eq(supplierPurchasesTable.userId, userId);

    const [totals] = await db.select({
      totalPurchased: sql<string>`COALESCE(SUM(CAST(${supplierPurchasesTable.totalAmount} AS NUMERIC)), 0)`,
      totalPaid: sql<string>`COALESCE(SUM(CAST(${supplierPurchasesTable.paidAmount} AS NUMERIC)), 0)`,
      totalDue: sql<string>`COALESCE(SUM(CAST(${supplierPurchasesTable.dueAmount} AS NUMERIC)), 0)`,
      purchaseCount: sql<number>`COUNT(*)`,
    }).from(supplierPurchasesTable).where(whereClause);

    res.json({
      totalPurchased: Number(totals.totalPurchased),
      totalPaid: Number(totals.totalPaid),
      totalDue: Number(totals.totalDue),
      purchaseCount: Number(totals.purchaseCount),
    });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

// GET /api/supplier-purchases/balances  — all suppliers with their balances
router.get("/balances", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;

    const rows = await db.select({
      supplierId: supplierPurchasesTable.supplierId,
      supplierName: supplierPurchasesTable.supplierName,
      totalPurchased: sql<string>`COALESCE(SUM(CAST(${supplierPurchasesTable.totalAmount} AS NUMERIC)), 0)`,
      totalPaid: sql<string>`COALESCE(SUM(CAST(${supplierPurchasesTable.paidAmount} AS NUMERIC)), 0)`,
      totalDue: sql<string>`COALESCE(SUM(CAST(${supplierPurchasesTable.dueAmount} AS NUMERIC)), 0)`,
      purchaseCount: sql<number>`COUNT(*)`,
    })
      .from(supplierPurchasesTable)
      .where(eq(supplierPurchasesTable.userId, userId))
      .groupBy(supplierPurchasesTable.supplierId, supplierPurchasesTable.supplierName);

    res.json(rows.map(r => ({
      supplierId: r.supplierId,
      supplierName: r.supplierName,
      totalPurchased: Number(r.totalPurchased),
      totalPaid: Number(r.totalPaid),
      totalDue: Number(r.totalDue),
      purchaseCount: Number(r.purchaseCount),
    })));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

// POST /api/supplier-purchases  — record a new purchase
router.post("/", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const {
      supplierId, supplierName, stockMovementId, inventoryId, productName,
      quantity, totalAmount, paidAmount, purchaseDate, notes,
    } = req.body;

    if (!supplierId) return res.status(400).json({ error: "supplierId is required" });
    if (!totalAmount) return res.status(400).json({ error: "totalAmount is required" });

    const total = parseAmount(totalAmount);
    const paid = parseAmount(paidAmount ?? 0);
    const due = Math.max(0, total - paid);

    let paymentStatus: string;
    if (due <= 0) paymentStatus = "paid";
    else if (paid <= 0) paymentStatus = "credit";
    else paymentStatus = "partial";

    const today = purchaseDate || new Date().toISOString().split("T")[0];

    const [row] = await db.insert(supplierPurchasesTable).values({
      userId,
      supplierId: Number(supplierId),
      supplierName: supplierName ? String(supplierName) : null,
      stockMovementId: stockMovementId ? Number(stockMovementId) : null,
      inventoryId: inventoryId ? Number(inventoryId) : null,
      productName: productName ? String(productName).slice(0, 300) : null,
      quantity: quantity ? Number(quantity) : 1,
      totalAmount: String(total),
      paidAmount: String(paid),
      dueAmount: String(due),
      paymentStatus,
      purchaseDate: today,
      notes: notes ? String(notes).slice(0, 500) : null,
    }).returning();

    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create purchase" }); }
});

// POST /api/supplier-purchases/:id/pay  — make a payment against a purchase
router.post("/:id/pay", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const purchaseId = Number(req.params.id);
    const { amount, paymentMethod, date, notes } = req.body;

    if (!amount || parseAmount(amount) <= 0) return res.status(400).json({ error: "Valid amount is required" });

    const [purchase] = await db.select().from(supplierPurchasesTable)
      .where(and(eq(supplierPurchasesTable.id, purchaseId), eq(supplierPurchasesTable.userId, userId)));

    if (!purchase) return res.status(404).json({ error: "Purchase not found" });

    const payAmt = Math.min(parseAmount(amount), parseFloat(purchase.dueAmount));
    if (payAmt <= 0) return res.status(400).json({ error: "No outstanding balance for this purchase" });

    const newPaid = parseFloat(purchase.paidAmount) + payAmt;
    const newDue = Math.max(0, parseFloat(purchase.totalAmount) - newPaid);
    const newStatus = newDue <= 0 ? "paid" : "partial";

    const result = await db.transaction(async (tx) => {
      // Update the purchase record
      const [updated] = await tx.update(supplierPurchasesTable)
        .set({ paidAmount: String(newPaid), dueAmount: String(newDue), paymentStatus: newStatus, updatedAt: new Date() })
        .where(and(eq(supplierPurchasesTable.id, purchaseId), eq(supplierPurchasesTable.userId, userId)))
        .returning();

      // Record the payment
      const [payment] = await tx.insert(supplierPaymentsTable).values({
        userId,
        supplierId: purchase.supplierId,
        supplierName: purchase.supplierName,
        purchaseId,
        amount: String(payAmt),
        paymentMethod: paymentMethod ? String(paymentMethod) : "cash",
        date: date || new Date().toISOString().split("T")[0],
        notes: notes ? String(notes).slice(0, 500) : null,
      }).returning();

      return { purchase: updated, payment };
    });

    res.json(result);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to record payment" }); }
});

// POST /api/supplier-purchases/general-pay  — pay against all dues of a supplier (lump sum)
router.post("/general-pay", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const { supplierId, supplierName, amount, paymentMethod, date, notes } = req.body;

    if (!supplierId) return res.status(400).json({ error: "supplierId is required" });
    const payAmt = parseAmount(amount);
    if (payAmt <= 0) return res.status(400).json({ error: "Valid amount is required" });

    const result = await db.transaction(async (tx) => {
      // Get all unpaid/partial purchases ordered oldest first
      const unpaidPurchases = await tx.select().from(supplierPurchasesTable)
        .where(and(
          eq(supplierPurchasesTable.userId, userId),
          eq(supplierPurchasesTable.supplierId, Number(supplierId)),
          sql`${supplierPurchasesTable.paymentStatus} != 'paid'`
        ))
        .orderBy(supplierPurchasesTable.createdAt);

      let remaining = payAmt;

      // Apply payment to oldest dues first (FIFO)
      for (const p of unpaidPurchases) {
        if (remaining <= 0) break;
        const pDue = parseFloat(p.dueAmount);
        if (pDue <= 0) continue;

        const applyAmt = Math.min(remaining, pDue);
        const newPaid = parseFloat(p.paidAmount) + applyAmt;
        const newDue = Math.max(0, parseFloat(p.totalAmount) - newPaid);
        const newStatus = newDue <= 0 ? "paid" : "partial";

        await tx.update(supplierPurchasesTable)
          .set({ paidAmount: String(newPaid), dueAmount: String(newDue), paymentStatus: newStatus, updatedAt: new Date() })
          .where(eq(supplierPurchasesTable.id, p.id));

        remaining -= applyAmt;
      }

      // Record the overall payment entry
      const [payment] = await tx.insert(supplierPaymentsTable).values({
        userId,
        supplierId: Number(supplierId),
        supplierName: supplierName ? String(supplierName) : null,
        purchaseId: null,
        amount: String(payAmt),
        paymentMethod: paymentMethod ? String(paymentMethod) : "cash",
        date: date || new Date().toISOString().split("T")[0],
        notes: notes ? String(notes).slice(0, 500) : null,
      }).returning();

      return { payment, appliedAmount: payAmt };
    });

    res.json(result);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to record payment" }); }
});

// GET /api/supplier-purchases/payments?supplierId=X  — payment history for a supplier
router.get("/payments", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const supplierId = req.query.supplierId ? Number(req.query.supplierId) : null;

    const rows = supplierId
      ? await db.select().from(supplierPaymentsTable)
          .where(and(eq(supplierPaymentsTable.userId, userId), eq(supplierPaymentsTable.supplierId, supplierId)))
          .orderBy(desc(supplierPaymentsTable.createdAt))
      : await db.select().from(supplierPaymentsTable)
          .where(eq(supplierPaymentsTable.userId, userId))
          .orderBy(desc(supplierPaymentsTable.createdAt))
          .limit(100);

    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

export default router;
