import { Router } from "express";
import { db, supplierPurchasesTable, supplierPaymentsTable, suppliersTable, stockMovementsTable, inventoryTable } from "@workspace/db";
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
// If `updateStock: true` and `inventoryId` provided, atomically creates a stock movement too.
router.post("/", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const {
      supplierId, supplierName, inventoryId, productName,
      quantity, totalAmount, paidAmount, purchaseDate, notes,
      updateStock, unitPrice,
    } = req.body;

    if (!supplierId) return res.status(400).json({ error: "supplierId is required" });
    if (!totalAmount) return res.status(400).json({ error: "totalAmount is required" });

    const total = parseAmount(totalAmount);
    const paid = parseAmount(paidAmount ?? 0);
    const due = Math.max(0, total - paid);
    const qty = quantity ? Number(quantity) : 1;
    const unitPriceStr = unitPrice ? String(Number(unitPrice)) : null;

    let paymentStatus: string;
    if (due <= 0) paymentStatus = "paid";
    else if (paid <= 0) paymentStatus = "credit";
    else paymentStatus = "partial";

    const today = purchaseDate || new Date().toISOString().split("T")[0];

    // ── Atomic: create stock movement + purchase record ────────────────────────
    if (updateStock && inventoryId) {
      const result = await db.transaction(async (tx) => {
        // Increase inventory quantity
        const [updatedItem] = await tx.update(inventoryTable)
          .set({
            quantity: sql`${inventoryTable.quantity} + ${qty}`,
            updatedAt: new Date(),
            ...(supplierName ? { supplier: String(supplierName) } : {}),
          })
          .where(eq(inventoryTable.id, Number(inventoryId)))
          .returning();

        if (!updatedItem) throw Object.assign(new Error("Inventory item not found"), { status: 404 });

        // Insert stock movement record
        const [movement] = await tx.insert(stockMovementsTable).values({
          userId,
          inventoryId: Number(inventoryId),
          type: "in",
          quantity: qty,
          supplierId: Number(supplierId),
          supplierName: supplierName ? String(supplierName) : null,
          unitPrice: unitPriceStr,
          totalPrice: String(total),
          notes: notes ? String(notes).slice(0, 500) : null,
        }).returning();

        // Insert supplier purchase linked to the movement
        const [purchase] = await tx.insert(supplierPurchasesTable).values({
          userId,
          supplierId: Number(supplierId),
          supplierName: supplierName ? String(supplierName) : null,
          stockMovementId: movement.id,
          inventoryId: Number(inventoryId),
          productName: productName ? String(productName).slice(0, 300) : (updatedItem.partName ?? null),
          quantity: qty,
          totalAmount: String(total),
          paidAmount: String(paid),
          dueAmount: String(due),
          paymentStatus,
          purchaseDate: today,
          notes: notes ? String(notes).slice(0, 500) : null,
        }).returning();

        return { purchase, movement, updatedItem };
      });
      return res.status(201).json(result);
    }

    // ── Standard purchase record (no stock update) ─────────────────────────────
    const [row] = await db.insert(supplierPurchasesTable).values({
      userId,
      supplierId: Number(supplierId),
      supplierName: supplierName ? String(supplierName) : null,
      stockMovementId: null,
      inventoryId: inventoryId ? Number(inventoryId) : null,
      productName: productName ? String(productName).slice(0, 300) : null,
      quantity: qty,
      totalAmount: String(total),
      paidAmount: String(paid),
      dueAmount: String(due),
      paymentStatus,
      purchaseDate: today,
      notes: notes ? String(notes).slice(0, 500) : null,
    }).returning();

    res.status(201).json(row);
  } catch (err: any) {
    const status = err.status ?? 500;
    if (status < 500) return res.status(status).json({ error: err.message });
    req.log.error(err);
    res.status(500).json({ error: "Failed to create purchase" });
  }
});

// POST /api/supplier-purchases/invoice — batch purchase invoice (multiple items, one transaction)
// Creates N stock movements + N purchase records atomically, all sharing one invoiceNumber.
router.post("/invoice", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const { supplierId, supplierName, invoiceNumber, purchaseDate, paidAmount, notes, items } = req.body;

    if (!supplierId) return res.status(400).json({ error: "supplierId is required" });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "At least one item is required" });

    const paid = parseAmount(paidAmount ?? 0);
    const today = purchaseDate || new Date().toISOString().split("T")[0];

    // Build line items with totals
    const lineItems = items.map((item: any) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
      return { ...item, qty, unitPrice, lineTotal: qty * unitPrice };
    });

    const invoiceTotal = lineItems.reduce((s: number, i: any) => s + i.lineTotal, 0);

    // Auto-generate invoice number if not provided
    const invNum: string = (invoiceNumber as string)?.trim() ||
      `PO-${today.replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const result = await db.transaction(async (tx) => {
      const createdPurchases: any[] = [];

      for (const line of lineItems) {
        // Proportional payment per line item
        const linePaid = invoiceTotal > 0
          ? Math.round((line.lineTotal / invoiceTotal) * paid * 100) / 100
          : 0;
        const lineDue = Math.max(0, Math.round((line.lineTotal - linePaid) * 100) / 100);
        const lineStatus = lineDue <= 0 ? "paid" : linePaid <= 0 ? "credit" : "partial";

        let movementId: number | null = null;

        // Update stock if inventory item provided
        if (line.inventoryId) {
          const [updatedItem] = await tx.update(inventoryTable)
            .set({
              quantity: sql`${inventoryTable.quantity} + ${line.qty}`,
              updatedAt: new Date(),
              ...(supplierName ? { supplier: String(supplierName) } : {}),
            })
            .where(eq(inventoryTable.id, Number(line.inventoryId)))
            .returning();

          if (updatedItem) {
            const [movement] = await tx.insert(stockMovementsTable).values({
              userId,
              inventoryId: Number(line.inventoryId),
              type: "in",
              quantity: line.qty,
              supplierId: Number(supplierId),
              supplierName: supplierName ? String(supplierName) : null,
              unitPrice: line.unitPrice > 0 ? String(line.unitPrice) : null,
              totalPrice: String(line.lineTotal),
              notes: notes ? String(notes).slice(0, 500) : null,
            }).returning();
            movementId = movement.id;
          }
        }

        // Create purchase record
        const [purchase] = await tx.insert(supplierPurchasesTable).values({
          userId,
          supplierId: Number(supplierId),
          supplierName: supplierName ? String(supplierName) : null,
          stockMovementId: movementId,
          inventoryId: line.inventoryId ? Number(line.inventoryId) : null,
          productName: line.productName ? String(line.productName).slice(0, 300) : null,
          quantity: line.qty,
          totalAmount: String(line.lineTotal),
          paidAmount: String(linePaid),
          dueAmount: String(lineDue),
          paymentStatus: lineStatus,
          purchaseDate: today,
          invoiceNumber: invNum,
          notes: notes ? String(notes).slice(0, 500) : null,
        }).returning();

        createdPurchases.push(purchase);
      }

      // Record lump-sum payment entry if any paid
      let payment = null;
      if (paid > 0) {
        const [p] = await tx.insert(supplierPaymentsTable).values({
          userId,
          supplierId: Number(supplierId),
          supplierName: supplierName ? String(supplierName) : null,
          purchaseId: null,
          amount: String(paid),
          paymentMethod: "cash",
          date: today,
          notes: `Invoice ${invNum}`,
        }).returning();
        payment = p;
      }

      return { invoiceNumber: invNum, total: invoiceTotal, paid, items: createdPurchases, payment };
    });

    res.status(201).json(result);
  } catch (err: any) {
    const status = err.status ?? 500;
    if (status < 500) return res.status(status).json({ error: err.message });
    req.log.error(err);
    res.status(500).json({ error: "Failed to create purchase invoice" });
  }
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
