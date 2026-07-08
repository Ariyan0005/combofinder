import { Router } from "express";
import { db, salesTable, saleItemsTable, saleReturnsTable, inventoryTable, stockMovementsTable, transactionsTable } from "@workspace/db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

const router = Router();

// Sales/invoice data contains customer PII and financial records — require an
// authenticated session AND a concrete userId for every method here.
// Admin sessions (no userId) cannot access user-scoped sales data.
router.use((req: any, res, next) => {
  if (!req.session?.authenticated) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // req.userId is injected by requireUserAuth in routes/index.ts before this router.
  // Guard here so any future route mis-mounting surfaces clearly.
  if (!req.userId) {
    return res.status(403).json({ error: "Forbidden: user identity required" });
  }
  next();
});

function requireInt(v: unknown, name: string, min = 1): number {
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min)
    throw new Error(`${name} must be an integer >= ${min}`);
  return n;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function csvField(v: unknown): string {
  let s = String(v ?? "");
  // Neutralize CSV formula injection (Excel/Sheets execute leading =, +, -, @)
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

// GET /api/sales?from=YYYY-MM-DD&to=YYYY-MM-DD&q=search
router.get("/", async (req, res) => {
  try {
    const userId: number = (req as any).userId; // guaranteed by middleware above
    const { from, to, q } = req.query as Record<string, string | undefined>;
    const conditions: ReturnType<typeof eq>[] = [eq(salesTable.userId, userId)];
    if (from) conditions.push(gte(salesTable.date, from) as any);
    if (to) conditions.push(lte(salesTable.date, to) as any);

    let rows = await db.select().from(salesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(salesTable.id));

    if (q) {
      const needle = q.toLowerCase();
      rows = rows.filter(r =>
        r.invoiceNumber.toLowerCase().includes(needle) ||
        (r.customerName ?? "").toLowerCase().includes(needle) ||
        (r.customerPhone ?? "").toLowerCase().includes(needle)
      );
    }
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch sales" }); }
});

// GET /api/sales/export?from=&to=  — CSV, date-wise
router.get("/export", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const { from, to } = req.query as Record<string, string | undefined>;
    const conditions: ReturnType<typeof eq>[] = [eq(salesTable.userId, userId)];
    if (from) conditions.push(gte(salesTable.date, from) as any);
    if (to) conditions.push(lte(salesTable.date, to) as any);

    const sales = await db.select().from(salesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(salesTable.date, salesTable.id);

    const header = ["Invoice", "Date", "Customer", "Phone", "Subtotal", "Discount", "Total", "Payment Method", "Status"];
    const lines = [header.map(csvField).join(",")];
    for (const s of sales) {
      lines.push([
        s.invoiceNumber, s.date, s.customerName ?? "", s.customerPhone ?? "",
        s.subtotal, s.discount, s.total, s.paymentMethod, s.status,
      ].map(csvField).join(","));
    }
    const totalSum = round2(sales.reduce((sum, s) => sum + Number(s.total), 0));
    lines.push("");
    lines.push(["", "", "", "", "", "", "Total", totalSum.toFixed(2), ""].map(csvField).join(","));

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="sales_${from ?? "all"}_${to ?? "all"}.csv"`);
    res.send(lines.join("\n"));
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to export sales" }); }
});

// GET /api/sales/:id  — invoice detail with items + returns
router.get("/:id", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const id = Number(req.params.id);
    const whereClause = and(eq(salesTable.id, id), eq(salesTable.userId, userId));
    const [sale] = await db.select().from(salesTable).where(whereClause);
    if (!sale) return res.status(404).json({ error: "Not found" });
    const items = await db.select().from(saleItemsTable).where(eq(saleItemsTable.saleId, id));
    const returns = await db.select().from(saleReturnsTable).where(eq(saleReturnsTable.saleId, id));
    res.json({ ...sale, items, returns });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

interface CartItem {
  inventoryId: number;
  quantity: number;
  unitPrice: number;
}

// POST /api/sales  — create a POS sale (checkout), atomically decrements stock
router.post("/", async (req, res) => {
  try {
    const rawItems = req.body.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0)
      throw new Error("At least one item is required");

    const items: CartItem[] = rawItems.map((it: any) => ({
      inventoryId: requireInt(it.inventoryId, "inventoryId"),
      quantity: requireInt(it.quantity, "quantity"),
      unitPrice: Number(it.unitPrice),
    }));
    if (items.some(it => !Number.isFinite(it.unitPrice) || it.unitPrice < 0))
      throw new Error("unitPrice must be a non-negative number");

    const discount = req.body.discount !== undefined ? Number(req.body.discount) : 0;
    if (!Number.isFinite(discount) || discount < 0) throw new Error("discount must be a non-negative number");
    const paymentMethod = req.body.paymentMethod ? String(req.body.paymentMethod) : "Cash";
    const customerId = req.body.customerId ? requireInt(req.body.customerId, "customerId") : null;
    const customerName = req.body.customerName ? String(req.body.customerName).slice(0, 200) : null;
    const customerPhone = req.body.customerPhone ? String(req.body.customerPhone).slice(0, 50) : null;
    const notes = req.body.notes ? String(req.body.notes).slice(0, 500) : null;
    const advancePaid = req.body.advancePaid !== undefined ? round2(Math.max(0, Number(req.body.advancePaid) || 0)) : 0;

    const result = await db.transaction(async (tx) => {
      let subtotal = 0;
      const lineItems: { inventoryId: number; partName: string; quantity: number; unitPrice: number; total: number }[] = [];

      for (const it of items) {
        const [updated] = await tx
          .update(inventoryTable)
          .set({ quantity: sql`${inventoryTable.quantity} - ${it.quantity}`, updatedAt: new Date() })
          .where(sql`${inventoryTable.id} = ${it.inventoryId} AND ${inventoryTable.quantity} >= ${it.quantity}`)
          .returning();

        if (!updated) {
          const [current] = await tx.select().from(inventoryTable).where(eq(inventoryTable.id, it.inventoryId));
          if (!current) throw Object.assign(new Error(`Inventory item #${it.inventoryId} not found`), { status: 404 });
          throw Object.assign(
            new Error(`Not enough stock for "${current.partName}" (available: ${current.quantity}, requested: ${it.quantity})`),
            { status: 400 }
          );
        }

        const lineTotal = round2(it.unitPrice * it.quantity);
        subtotal = round2(subtotal + lineTotal);
        lineItems.push({ inventoryId: it.inventoryId, partName: updated.partName, quantity: it.quantity, unitPrice: it.unitPrice, total: lineTotal });

        await tx.insert(stockMovementsTable).values({
          inventoryId: it.inventoryId, type: "sale", quantity: it.quantity,
          unitPrice: String(it.unitPrice), totalPrice: String(lineTotal),
          reference: "POS sale",
        });
      }

      const total = round2(Math.max(0, subtotal - discount));
      const date = todayStr();

      // Insert with a temporary unique placeholder, then derive the invoice
      // number from the DB-assigned serial id so concurrent checkouts can
      // never collide (invoice_number has a unique constraint as a backstop).
      const saleUserId: number = (req as any).userId;
      const effectiveAdvance = paymentMethod === "Credit" ? Math.min(advancePaid, total) : total;

      const [inserted] = await tx.insert(salesTable).values({
        userId: saleUserId,
        invoiceNumber: `PENDING-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        customerId, customerName, customerPhone,
        subtotal: String(round2(subtotal)), discount: String(round2(discount)), total: String(total),
        advancePaid: String(round2(effectiveAdvance)),
        paymentMethod, status: "Completed", notes, date,
      }).returning();

      const invoiceNumber = `INV-${String(inserted.id).padStart(6, "0")}`;
      const [sale] = await tx.update(salesTable)
        .set({ invoiceNumber })
        .where(eq(salesTable.id, inserted.id))
        .returning();

      const insertedItems = await Promise.all(lineItems.map(li =>
        tx.insert(saleItemsTable).values({
          saleId: sale.id, inventoryId: li.inventoryId, partName: li.partName,
          quantity: li.quantity, unitPrice: String(li.unitPrice), total: String(li.total),
        }).returning().then(r => r[0])
      ));

      // For Credit sales, only record the advance actually collected; the remainder is receivable
      await tx.insert(transactionsTable).values({
        type: "Income", category: "Sale", amount: String(round2(effectiveAdvance)),
        description: paymentMethod === "Credit" && effectiveAdvance < total
          ? `POS sale ${invoiceNumber} (advance ${effectiveAdvance}/${total})`
          : `POS sale ${invoiceNumber}`,
        relatedId: String(sale.id), relatedType: "sale",
        paymentMethod, status: "Completed", date,
      });

      return { ...sale, items: insertedItems };
    });

    res.status(201).json(result);
  } catch (err: any) {
    const status = err.status ?? (err.message?.includes("must be") || err.message?.includes("required") ? 400 : 500);
    if (status < 500) return res.status(status).json({ error: err.message });
    req.log.error(err);
    res.status(500).json({ error: "Failed to record sale" });
  }
});

// POST /api/sales/customers/:customerId/payment
// Record a payment against a customer's outstanding POS credit-sale due.
// Applies the payment across the customer's oldest unpaid Credit sales first
// (FIFO), increasing advancePaid on each until the payment is exhausted.
// This is separate from the standalone Ledger feature — it only clears the
// "due" balance shown against POS credit sales for this customer.
router.post("/customers/:customerId/payment", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const customerId = requireInt(req.params.customerId, "customerId");
    let amount = round2(Number(req.body.amount));
    if (!Number.isFinite(amount) || amount <= 0) throw Object.assign(new Error("amount must be a positive number"), { status: 400 });
    const notes = req.body.notes ? String(req.body.notes).slice(0, 500) : null;

    const result = await db.transaction(async (tx) => {
      // Lock the candidate rows for the duration of this transaction so a
      // second concurrent payment request can't read the same stale
      // advancePaid values and clobber this update (lost-update race).
      const openSales = await tx.select().from(salesTable)
        .where(and(
          eq(salesTable.userId, userId),
          eq(salesTable.customerId, customerId),
          eq(salesTable.paymentMethod, "Credit"),
        ))
        .orderBy(salesTable.id) // oldest first (FIFO)
        .for("update");

      let remaining = amount;
      const updated: { id: number; invoiceNumber: string; applied: number }[] = [];

      for (const sale of openSales) {
        if (remaining <= 0) break;
        const total = Number(sale.total);
        const paidSoFar = Number(sale.advancePaid ?? 0);
        const due = round2(Math.max(0, total - paidSoFar));
        if (due <= 0) continue;

        const applied = round2(Math.min(due, remaining));
        const newAdvance = round2(paidSoFar + applied);
        await tx.update(salesTable)
          .set({ advancePaid: String(newAdvance) })
          .where(eq(salesTable.id, sale.id));

        remaining = round2(remaining - applied);
        updated.push({ id: sale.id, invoiceNumber: sale.invoiceNumber, applied });
      }

      const appliedTotal = round2(amount - remaining);
      if (appliedTotal <= 0) {
        throw Object.assign(new Error("This customer has no outstanding credit due"), { status: 400 });
      }

      await tx.insert(transactionsTable).values({
        type: "Income", category: "Sale",
        amount: String(appliedTotal),
        description: `Payment received against credit due (customer #${customerId})${notes ? ` — ${notes}` : ""}`,
        relatedId: String(customerId), relatedType: "customer_payment",
        paymentMethod: "Cash", status: "Completed", date: todayStr(),
      });

      const [dueRow] = await tx.execute(sql`
        SELECT GREATEST(0, SUM(total::numeric - COALESCE(advance_paid::numeric, 0))) AS credit_due
        FROM sales
        WHERE payment_method = 'Credit' AND customer_id = ${customerId} AND user_id = ${userId}
      `).then(r => r.rows as any[]);

      return {
        appliedTotal,
        unapplied: remaining,
        remainingDue: Number(dueRow?.credit_due ?? 0),
        updatedSales: updated,
      };
    });

    res.json(result);
  } catch (err: any) {
    const status = err.status ?? (err.message?.includes("must be") ? 400 : 500);
    if (status < 500) return res.status(status).json({ error: err.message });
    req.log.error(err);
    res.status(500).json({ error: "Failed to record payment" });
  }
});

// POST /api/sales/:id/return  — process a return/refund for one or more line items
router.post("/:id/return", async (req, res) => {
  try {
    const saleId = Number(req.params.id);
    const rawItems = req.body.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0)
      throw new Error("At least one item to return is required");
    const reason = req.body.reason ? String(req.body.reason).slice(0, 500) : null;

    const result = await db.transaction(async (tx) => {
      const [sale] = await tx.select().from(salesTable).where(eq(salesTable.id, saleId));
      if (!sale) throw Object.assign(new Error("Sale not found"), { status: 404 });

      let refundTotal = 0;
      const date = todayStr();

      for (const it of rawItems) {
        const saleItemId = requireInt(it.saleItemId, "saleItemId");
        const quantity = requireInt(it.quantity, "quantity");

        const [saleItem] = await tx.select().from(saleItemsTable).where(eq(saleItemsTable.id, saleItemId));
        if (!saleItem || saleItem.saleId !== saleId) throw Object.assign(new Error("Sale item not found"), { status: 404 });

        // Atomic, guarded update: only succeeds if the item still has enough
        // un-returned quantity at commit time, preventing double-refunds from
        // concurrent return requests on the same line item.
        const [updatedItem] = await tx.update(saleItemsTable)
          .set({ returnedQuantity: sql`${saleItemsTable.returnedQuantity} + ${quantity}` })
          .where(sql`${saleItemsTable.id} = ${saleItemId} AND ${saleItemsTable.returnedQuantity} + ${quantity} <= ${saleItemsTable.quantity}`)
          .returning();

        if (!updatedItem) {
          const remaining = saleItem.quantity - saleItem.returnedQuantity;
          throw Object.assign(new Error(`Cannot return ${quantity} of "${saleItem.partName}" (only ${remaining} eligible)`), { status: 400 });
        }

        const refundAmount = round2(Number(saleItem.unitPrice) * quantity);
        refundTotal += refundAmount;

        if (saleItem.inventoryId) {
          await tx.update(inventoryTable)
            .set({ quantity: sql`${inventoryTable.quantity} + ${quantity}`, updatedAt: new Date() })
            .where(eq(inventoryTable.id, saleItem.inventoryId));

          await tx.insert(stockMovementsTable).values({
            inventoryId: saleItem.inventoryId, type: "in", quantity,
            unitPrice: saleItem.unitPrice, totalPrice: String(refundAmount),
            reference: `Return - ${sale.invoiceNumber}`, notes: reason,
          });
        }

        await tx.insert(saleReturnsTable).values({
          saleId, saleItemId, quantity, refundAmount: String(refundAmount), reason, date,
        });
      }
      refundTotal = round2(refundTotal);

      const allItems = await tx.select().from(saleItemsTable).where(eq(saleItemsTable.saleId, saleId));
      const fullyReturned = allItems.every(li => li.returnedQuantity >= li.quantity);
      const anyReturned = allItems.some(li => li.returnedQuantity > 0);
      const newStatus = fullyReturned ? "Returned" : anyReturned ? "Partially Returned" : "Completed";

      const [updatedSale] = await tx.update(salesTable)
        .set({ status: newStatus })
        .where(eq(salesTable.id, saleId)).returning();

      await tx.insert(transactionsTable).values({
        type: "Refund", category: "Sale", amount: String(refundTotal),
        description: `Return for ${sale.invoiceNumber}`, relatedId: String(saleId), relatedType: "sale",
        paymentMethod: sale.paymentMethod, status: "Refunded", date, notes: reason,
      });

      const items = await tx.select().from(saleItemsTable).where(eq(saleItemsTable.saleId, saleId));
      return { ...updatedSale, items, refundTotal };
    });

    res.json(result);
  } catch (err: any) {
    const status = err.status ?? (err.message?.includes("must be") || err.message?.includes("required") || err.message?.includes("Cannot return") ? 400 : 500);
    if (status < 500) return res.status(status).json({ error: err.message });
    req.log.error(err);
    res.status(500).json({ error: "Failed to process return" });
  }
});

export default router;
