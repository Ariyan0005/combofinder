import { Router } from "express";
import { db, salesTable, saleItemsTable, inventoryTable, expensesTable, repairsTable } from "@workspace/db";
import { and, eq, gte, lte, sql, inArray } from "drizzle-orm";
import { getBranchCondition } from "../lib/branch-helper";

const router = Router();

/**
 * GET /api/sales-summary
 * Returns dashboard + sales report data for the authenticated user.
 * query params: range=today|week|month|custom, from=YYYY-MM-DD, to=YYYY-MM-DD
 *
 * Repair profit rules:
 *  - Only "Ready" and "Delivered" repairs count towards revenue & profit.
 *  - Parts cost = inventory.purchasePrice × qty (not the selling partsCost on the repair).
 *  - Profit = laborCost + partsSelling - partsActualCost = totalCost - partsActualCost.
 *  - Cancelled repairs are excluded from revenue and profit.
 */
router.get("/sales-summary", async (req: any, res): Promise<void> => {
  try {
    const userId: number = req.userId;
    const includeRepairs = req.session?.userBusinessType !== "general_store";
    const range  = (req.query.range as string) || "month";
    // User's IANA timezone sent from frontend (e.g. "Asia/Dhaka").
    // Falls back to UTC so the helper stays safe on old clients.
    const tz = (req.query.tz as string) || "UTC";
    const now    = new Date();
    const today  = toDateStrTZ(now, tz);

    // ── Date range ────────────────────────────────────────────────────────────
    let fromDate: string;
    let toDate: string = today;

    if (range === "today") {
      fromDate = today;
    } else if (range === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      fromDate = toDateStrTZ(d, tz);
    } else if (range === "custom") {
      fromDate = (req.query.from as string) || today;
      toDate   = (req.query.to   as string) || today;
    } else {
      // month — first day of current month in user's timezone
      const parts = today.split("-"); // ["YYYY","MM","DD"]
      fromDate = `${parts[0]}-${parts[1]}-01`;
    }

    // ── Yesterday & today bounds (for hero % change) ──────────────────────────
    const yd   = new Date(now); yd.setDate(yd.getDate() - 1);
    const yDay = toDateStrTZ(yd, tz);

    // ── POS Sales ────────────────────────────────────────────────────────────
    const branchCondSales = getBranchCondition(req, salesTable.branchId);
    const salesConditions: any[] = [
      eq(salesTable.userId, userId),
      gte(salesTable.date, fromDate),
      lte(salesTable.date, toDate),
      sql`${salesTable.status} != 'Returned'`,
    ];
    if (branchCondSales) salesConditions.push(branchCondSales);

    const sales = await db.select().from(salesTable)
      .where(and(...salesConditions));

    const allSalesToday = sales.filter(s => s.date === today);
    const posToday      = sumField(allSalesToday, "total");
    const posRange      = sumField(sales, "total");

    // Yesterday POS
    const salesYdConds: any[] = [
      eq(salesTable.userId, userId),
      eq(salesTable.date, yDay),
      sql`${salesTable.status} != 'Returned'`,
    ];
    if (branchCondSales) salesYdConds.push(branchCondSales);

    const salesYd = await db.select({ total: salesTable.total })
      .from(salesTable)
      .where(and(...salesYdConds));
    const posYesterday = sumArr(salesYd.map(s => Number(s.total)));

    // ── POS Cost of Goods Sold (COGS) ─────────────────────────────────────────
    let posCost = 0;
    const saleIds = sales.map(s => s.id);
    if (saleIds.length > 0) {
      const saleItems = await db
        .select({
          quantity:         saleItemsTable.quantity,
          returnedQuantity: saleItemsTable.returnedQuantity,
          purchasePrice:    inventoryTable.purchasePrice,
        })
        .from(saleItemsTable)
        .leftJoin(inventoryTable, eq(saleItemsTable.inventoryId, inventoryTable.id))
        .where(inArray(saleItemsTable.saleId, saleIds));

      posCost = saleItems.reduce((sum, item) => {
        const soldQty = item.quantity - (item.returnedQuantity ?? 0);
        return sum + Math.max(0, soldQty) * Number(item.purchasePrice ?? 0);
      }, 0);
    }

    // ── Repairs — only Ready & Delivered count towards revenue and profit ─────
    // Cancelled repairs are excluded; Repairing/Waiting repairs are excluded too.
    const branchCondRepairs = getBranchCondition(req, repairsTable.branchId);
    const repairConditions: any[] = [eq(repairsTable.userId, userId)];
    if (branchCondRepairs) repairConditions.push(branchCondRepairs);

    const allRepairs = includeRepairs
      ? await db.select().from(repairsTable).where(and(...repairConditions))
      : [];

    const repairDateStr = (r: any): string => {
      const d = r.deliveredAt ?? r.updatedAt ?? r.createdAt;
      return d ? toDateStrTZ(new Date(d), tz) : "";
    };

    // Collected = totalCost for isPaid repairs, advancePaid for partial
    const repairCollected = (r: any): number => {
      if (r.isPaid) return Number(r.totalCost ?? 0);
      return Math.max(0, Number(r.advancePaid ?? 0));
    };

    // Only count Ready + Delivered repairs in revenue/profit
    const completedRepairs = allRepairs.filter(r =>
      r.status === "Ready" || r.status === "Delivered"
    );

    const repairsInRange = completedRepairs.filter(r => {
      const d = repairDateStr(r);
      return d >= fromDate && d <= toDate;
    });
    const repairToday = completedRepairs.filter(r => repairDateStr(r) === today);
    const repairYd    = completedRepairs.filter(r => repairDateStr(r) === yDay);

    const repairRevRange = repairsInRange.reduce((s, r) => s + repairCollected(r), 0);
    const repairRevToday = repairToday.reduce((s, r) => s + repairCollected(r), 0);
    const repairRevYd    = repairYd.reduce((s, r) => s + repairCollected(r), 0);

    // ── Repair Parts Actual Cost (purchase price from inventory) ─────────────
    // Profit formula: totalCost - actualPartsCost (purchase price × qty)
    // This gives: laborCost + partsSelling - partsActualCost = true profit
    let repairActualPartsCost = 0;

    // Collect all unique inventoryIds from partsUsed of in-range repairs
    const allInvIds = new Set<number>();
    for (const r of repairsInRange) {
      try {
        const parts = r.partsUsed ? JSON.parse(r.partsUsed) : [];
        for (const p of parts) {
          if (p.inventoryId) allInvIds.add(Number(p.inventoryId));
        }
      } catch { /* skip malformed JSON */ }
    }

    // Batch-fetch purchase prices
    const purchasePriceMap: Record<number, number> = {};
    if (allInvIds.size > 0) {
      const invItems = await db
        .select({ id: inventoryTable.id, purchasePrice: inventoryTable.purchasePrice })
        .from(inventoryTable)
        .where(and(
          eq(inventoryTable.userId, userId),
          inArray(inventoryTable.id, [...allInvIds]),
        ));
      for (const item of invItems) {
        purchasePriceMap[item.id] = Number(item.purchasePrice ?? 0);
      }
    }

    // Sum actual parts cost
    for (const r of repairsInRange) {
      try {
        const parts = r.partsUsed ? JSON.parse(r.partsUsed) : [];
        for (const p of parts) {
          if (p.inventoryId && p.qty) {
            repairActualPartsCost += (purchasePriceMap[Number(p.inventoryId)] ?? 0) * Number(p.qty);
          }
        }
      } catch { /* skip */ }
    }

    // ── Expenses ──────────────────────────────────────────────────────────────
    const branchCondExpenses = getBranchCondition(req, expensesTable.branchId);
    const expensesConditions: any[] = [
      eq(expensesTable.userId, userId),
      gte(expensesTable.date, fromDate),
      lte(expensesTable.date, toDate),
    ];
    if (branchCondExpenses) expensesConditions.push(branchCondExpenses);

    const expenses = await db.select().from(expensesTable)
      .where(and(...expensesConditions));
    const totalExpenses = sumField(expenses, "amount");

    // Expense by category
    const expByCategory: Record<string, number> = {};
    for (const e of expenses) {
      expByCategory[e.category] = (expByCategory[e.category] ?? 0) + Number(e.amount);
    }

    // ── Outstanding (unpaid repairs — all time, Ready + Delivered only) ───────
    const unpaidConditions: any[] = [
      eq(repairsTable.userId, userId),
      eq(repairsTable.isPaid, false),
      sql`${repairsTable.status} IN ('Ready', 'Delivered')`,
    ];
    if (branchCondRepairs) unpaidConditions.push(branchCondRepairs);

    const unpaidRepairs = await db.select({ totalCost: repairsTable.totalCost, advancePaid: repairsTable.advancePaid })
      .from(repairsTable)
      .where(and(...unpaidConditions));
    const outstanding = unpaidRepairs.reduce((s, r) => {
      const due = Number(r.totalCost ?? 0) - Number(r.advancePaid ?? 0);
      return s + Math.max(0, due);
    }, 0);

    // ── 7-day daily chart ─────────────────────────────────────────────────────
    const chart: { date: string; day: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d   = new Date(now);
      d.setDate(d.getDate() - i);
      const ds  = toDateStrTZ(d, tz);
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short", timeZone: tz });
      const daySales   = sales.filter(s => s.date === ds);
      const dayRepairs = completedRepairs.filter(r => repairDateStr(r) === ds);
      chart.push({
        date:    ds,
        day:     dayLabel,
        revenue: sumField(daySales, "total") + dayRepairs.reduce((s, r) => s + repairCollected(r), 0),
      });
    }

    // ── Totals ────────────────────────────────────────────────────────────────
    const todayRevenue     = posToday + repairRevToday;
    const yesterdayRevenue = posYesterday + repairRevYd;
    const totalRevenue     = posRange + repairRevRange;
    // Profit = POS Revenue - POS COGS + Repair Revenue - Repair Actual Parts Cost - Expenses
    const netProfit        = posRange - posCost + repairRevRange - repairActualPartsCost - totalExpenses;

    const isStaff = String(req.session?.userRole ?? "").toLowerCase() === "staff";
    res.json({
      todayRevenue,
      yesterdayRevenue,
      posRevenue:      posRange,
      ...(isStaff ? {} : { posCost }),
      repairRevenue:   repairRevRange,
      ...(isStaff ? {} : { repairPartsCost: repairActualPartsCost }),
      totalRevenue,
      ...(isStaff ? {} : { totalExpenses, netProfit, expenseByCategory: expByCategory }),
      outstanding,
      weeklyChart: chart,
    });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch sales summary" });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Format a Date as YYYY-MM-DD in the given IANA timezone.
 * Falls back to UTC if the timezone string is invalid.
 */
function toDateStrTZ(d: Date, tz: string): string {
  try {
    // en-CA locale always produces YYYY-MM-DD format
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year:     "numeric",
      month:    "2-digit",
      day:      "2-digit",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
function sumField(arr: any[], field: string): number {
  return arr.reduce((s, r) => s + Number(r[field] ?? 0), 0);
}
function sumArr(arr: number[]): number {
  return arr.reduce((s, n) => s + n, 0);
}

export default router;
