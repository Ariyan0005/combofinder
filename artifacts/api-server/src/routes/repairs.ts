import { Router } from "express";
import { db, repairsTable, usersTable, inventoryTable, stockMovementsTable } from "@workspace/db";
import { eq, ilike, or, desc, sql, and, gte } from "drizzle-orm";

const router = Router();

function getUid(req: any, res: any): number | null {
  const uid: number | undefined = req.userId;
  if (!uid) { res.status(403).json({ error: "User session invalid" }); return null; }
  return uid;
}

const STOCK_OUT_STATUSES = new Set(["Ready", "Delivered"]);

async function deductPartsOnCreation(tx: any, userId: number, repairId: number, status: string, partsUsed: unknown) {
  let parts: any[] = [];
  try {
    parts = partsUsed ? (typeof partsUsed === "string" ? JSON.parse(partsUsed) : partsUsed) : [];
  } catch {
    throw Object.assign(new Error("Invalid repair parts data"), { status: 400 });
  }
  if (!Array.isArray(parts)) return;

  for (const part of parts) {
    const inventoryId = Number(part.inventoryId);
    const quantity = Number(part.qty);
    if (!Number.isInteger(inventoryId) || inventoryId < 1 || !Number.isInteger(quantity) || quantity < 1) {
      throw Object.assign(new Error("Each repair part must have a valid inventory item and quantity"), { status: 400 });
    }

    const [updated] = await tx.update(inventoryTable)
      .set({
        quantity: sql`${inventoryTable.quantity} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(inventoryTable.id, inventoryId),
        eq(inventoryTable.userId, userId),
        sql`${inventoryTable.quantity} >= ${quantity}`,
      ))
      .returning();

    if (!updated) {
      throw Object.assign(new Error("Not enough stock for one or more repair parts"), { status: 400 });
    }

    await tx.insert(stockMovementsTable).values({
      inventoryId,
      type: "repair",
      quantity,
      unitPrice: part.unitPrice != null ? String(part.unitPrice) : "0",
      totalPrice: String(Number(part.unitPrice || 0) * quantity),
      userId,
      reference: `Repair #${repairId} - status ${status.toLowerCase()}`,
    });
  }
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
        ilike(repairsTable.customerPhone || sql`''`, `%${q}%`),
        ilike(repairsTable.phoneModel, `%${q}%`),
        ilike(repairsTable.phoneBrand, `%${q}%`),
        ilike(repairsTable.problem || sql`''`, `%${q}%`),
        ilike(repairsTable.notes || sql`''`, `%${q}%`),
        ilike(repairsTable.engineer || sql`''`, `%${q}%`),
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

    // Enforce Free plan limit: 30 repairs per calendar month
    const [userRow] = await db.select({ subscriptionPlan: usersTable.subscriptionPlan })
      .from(usersTable).where(eq(usersTable.id, userId));
    if (!userRow || (userRow.subscriptionPlan ?? "Free") === "Free") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const [countRow] = await db.select({ count: sql<number>`cast(count(*) as int)` })
        .from(repairsTable)
        .where(and(eq(repairsTable.userId, userId), gte(repairsTable.createdAt, startOfMonth)));
      if ((countRow?.count ?? 0) >= 30) {
        return res.status(403).json({ error: "Free plan limit reached: 30 repairs per month. Upgrade to Pro for unlimited repairs." });
      }
    }

    const row = await db.transaction(async (tx) => {
      const [created] = await tx.insert(repairsTable)
        .values({ ...req.body, userId, updatedAt: new Date() })
        .returning();
      if (STOCK_OUT_STATUSES.has(created.status)) {
        await deductPartsOnCreation(tx, userId, created.id, created.status, created.partsUsed);
      }
      return created;
    });

    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create repair" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const repairId = Number(req.params.id);
    const b = req.body;

    interface PartEntry { inventoryId: number; qty: number; unitPrice: string; name: string; }

    const newParts: PartEntry[] = (() => {
      try { return b.partsUsed ? JSON.parse(b.partsUsed) : []; } catch { return []; }
    })();

    let prevStatus = "";   // captured inside tx, used for alert after tx completes

    const result = await db.transaction(async (tx) => {
      // Fetch existing repair to detect status change and get old parts
      const [existing] = await tx.select({ partsUsed: repairsTable.partsUsed, status: repairsTable.status })
        .from(repairsTable)
        .where(and(eq(repairsTable.id, repairId), eq(repairsTable.userId, userId)));
      if (!existing) throw Object.assign(new Error("Not found"), { status: 404 });
      prevStatus = existing.status ?? "";

      const oldParts: PartEntry[] = (() => {
        try { return existing.partsUsed ? JSON.parse(existing.partsUsed) : []; } catch { return []; }
      })();

      const oldMap = new Map(oldParts.map(p => [p.inventoryId, Number(p.qty)]));
      const newMap = new Map(newParts.map(p => [p.inventoryId, Number(p.qty)]));
      const newStatus: string = b.status ?? prevStatus;

      // ── Inventory state machine ────────────────────────────────────────────────
      // Rule: inventory is deducted only when status = "Ready".
      //       "Delivered" repairs are never touched (do not affect delivered).
      //       Cancellation restores inventory if it was previously deducted (was Ready).

      const prevIsDelivered = prevStatus === "Delivered";
      const prevIsReady     = prevStatus === "Ready";
      const newIsReady      = newStatus  === "Ready";
      const newIsDelivered  = newStatus  === "Delivered";

      if (!prevIsDelivered) {
        if (!prevIsReady && newIsReady) {
          // ── Transition → Ready: deduct ALL current parts ─────────────────────
          for (const part of newParts) {
            if (!part.inventoryId || !part.qty) continue;
            await tx.update(inventoryTable)
              .set({ quantity: sql`GREATEST(0, ${inventoryTable.quantity} - ${Number(part.qty)})`, updatedAt: new Date() })
              .where(and(eq(inventoryTable.id, part.inventoryId), eq(inventoryTable.userId, userId)));
            const lineTotal = Math.round(Number(part.unitPrice) * Number(part.qty) * 100) / 100;
            await tx.insert(stockMovementsTable).values({
              inventoryId: part.inventoryId, type: "repair", quantity: Number(part.qty),
              unitPrice: String(part.unitPrice), totalPrice: String(lineTotal),
              userId,
              reference: `Repair #${repairId} - status ready`,
            });
          }
        } else if (prevIsReady && !newIsReady && !newIsDelivered) {
          // ── Transition Ready → non-Ready (Cancelled, Repairing, etc.): restore ALL old parts ──
          for (const [inventoryId, oldQty] of oldMap) {
            await tx.update(inventoryTable)
              .set({ quantity: sql`${inventoryTable.quantity} + ${oldQty}`, updatedAt: new Date() })
              .where(and(eq(inventoryTable.id, inventoryId), eq(inventoryTable.userId, userId)));
            await tx.insert(stockMovementsTable).values({
              inventoryId, type: "in", quantity: oldQty,
              unitPrice: "0", totalPrice: "0",
              userId,
              reference: `Repair #${repairId} - parts restored (${newStatus})`,
            });
          }
        } else if (prevIsReady && (newIsReady || newIsDelivered)) {
          // ── Staying Ready or transitioning Ready → Delivered: handle parts delta ──
          // Parts removed or reduced → restore inventory
          for (const [inventoryId, oldQty] of oldMap) {
            const newQty = newMap.get(inventoryId) ?? 0;
            const delta = oldQty - newQty;
            if (delta > 0) {
              await tx.update(inventoryTable)
                .set({ quantity: sql`${inventoryTable.quantity} + ${delta}`, updatedAt: new Date() })
                .where(and(eq(inventoryTable.id, inventoryId), eq(inventoryTable.userId, userId)));
              await tx.insert(stockMovementsTable).values({
                inventoryId, type: "in", quantity: delta,
                unitPrice: "0", totalPrice: "0",
                userId,
                reference: `Repair #${repairId} - parts returned to stock`,
              });
            }
          }
          // Parts added or increased → deduct inventory
          for (const part of newParts) {
            const oldQty = oldMap.get(part.inventoryId) ?? 0;
            const delta = Number(part.qty) - oldQty;
            if (delta > 0) {
              await tx.update(inventoryTable)
                .set({ quantity: sql`GREATEST(0, ${inventoryTable.quantity} - ${delta})`, updatedAt: new Date() })
                .where(and(eq(inventoryTable.id, part.inventoryId), eq(inventoryTable.userId, userId)));
              const lineTotal = Math.round(Number(part.unitPrice) * delta * 100) / 100;
              await tx.insert(stockMovementsTable).values({
                inventoryId: part.inventoryId, type: "repair", quantity: delta,
                unitPrice: String(part.unitPrice), totalPrice: String(lineTotal),
                userId,
                reference: `Repair #${repairId}`,
              });
            }
          }
        } else if (!prevIsReady && newIsDelivered) {
          // ── Transition directly to Delivered (skipped Ready): deduct all parts ──
          for (const part of newParts) {
            if (!part.inventoryId || !part.qty) continue;
            await tx.update(inventoryTable)
              .set({ quantity: sql`GREATEST(0, ${inventoryTable.quantity} - ${Number(part.qty)})`, updatedAt: new Date() })
              .where(and(eq(inventoryTable.id, part.inventoryId), eq(inventoryTable.userId, userId)));
            const lineTotal = Math.round(Number(part.unitPrice) * Number(part.qty) * 100) / 100;
            await tx.insert(stockMovementsTable).values({
              inventoryId: part.inventoryId, type: "repair", quantity: Number(part.qty),
              unitPrice: String(part.unitPrice), totalPrice: String(lineTotal),
              userId,
              reference: `Repair #${repairId} - delivered`,
            });
          }
        }
        // else: neither prev nor new is Ready/Delivered — no inventory change
      }
      // If prevIsDelivered: never touch inventory (do not affect delivered repairs)

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

      const [row] = await tx.update(repairsTable).set(updateFields)
        .where(and(eq(repairsTable.id, repairId), eq(repairsTable.userId, userId)))
        .returning();
      return row ?? null;
    });

    if (!result) return res.status(404).json({ error: "Not found" });
    res.json(result);
  } catch (err: any) {
    const status = err.status ?? 500;
    if (status < 500) return res.status(status).json({ error: err.message });
    req.log.error(err);
    res.status(500).json({ error: "Failed to update repair" });
  }
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
