import { Router } from "express";
import { db, salesTable, expensesTable, repairsTable } from "@workspace/db";
import { and, eq, gte, lte, sql } from "drizzle-orm";

const router = Router();

/**
 * GET /api/sales-summary
 * Returns dashboard + sales report data for the authenticated user.
 * query params: range=today|week|month|custom, from=YYYY-MM-DD, to=YYYY-MM-DD
 */
router.get("/sales-summary", async (req: any, res): Promise<void> => {
  try {
    const userId: number = req.userId;
    const range  = (req.query.range as string) || "month";
    const now    = new Date();
    const today  = toDateStr(now);

    // ── Date range ────────────────────────────────────────────────────────────
    let fromDate: string;
    let toDate: string = today;

    if (range === "today") {
      fromDate = today;
    } else if (range === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      fromDate = toDateStr(d);
    } else if (range === "custom") {
      fromDate = (req.query.from as string) || today;
      toDate   = (req.query.to   as string) || today;
    } else {
      // month
      fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    }

    // ── Yesterday & today bounds (for hero % change) ──────────────────────────
    const yd   = new Date(now); yd.setDate(yd.getDate() - 1);
    const yDay = toDateStr(yd);

    // ── POS Sales ────────────────────────────────────────────────────────────
    const sales = await db.select().from(salesTable)
      .where(and(
        eq(salesTable.userId, userId),
        gte(salesTable.date, fromDate),
        lte(salesTable.date, toDate),
        sql`${salesTable.status} != 'Returned'`,
      ));

    const allSalesToday = sales.filter(s => s.date === today);
    const posToday      = sumField(allSalesToday, "total");
    const posRange      = sumField(sales, "total");

    // Yesterday POS
    const salesYd = await db.select({ total: salesTable.total })
      .from(salesTable)
      .where(and(
        eq(salesTable.userId, userId),
        eq(salesTable.date, yDay),
        sql`${salesTable.status} != 'Returned'`,
      ));
    const posYesterday = sumArr(salesYd.map(s => Number(s.total)));

    // ── Repairs (delivered + paid) ────────────────────────────────────────────
    const repairs = await db.select().from(repairsTable)
      .where(and(
        eq(repairsTable.userId, userId),
        eq(repairsTable.isPaid, true),
        eq(repairsTable.status, "Delivered"),
      ));

    const repairsInRange   = repairs.filter(r => {
      const d = toDateStr(new Date(r.deliveredAt ?? r.updatedAt ?? r.createdAt));
      return d >= fromDate && d <= toDate;
    });
    const repairToday      = repairs.filter(r => toDateStr(new Date(r.deliveredAt ?? r.updatedAt ?? r.createdAt)) === today);
    const repairYd         = repairs.filter(r => toDateStr(new Date(r.deliveredAt ?? r.updatedAt ?? r.createdAt)) === yDay);

    const repairRevRange   = sumField(repairsInRange, "totalCost");
    const repairPartsRange = sumField(repairsInRange, "partsCost");
    const repairRevToday   = sumField(repairToday,    "totalCost");
    const repairRevYd      = sumField(repairYd,       "totalCost");

    // ── Expenses ──────────────────────────────────────────────────────────────
    const expenses = await db.select().from(expensesTable)
      .where(and(
        eq(expensesTable.userId, userId),
        gte(expensesTable.date, fromDate),
        lte(expensesTable.date, toDate),
      ));
    const totalExpenses = sumField(expenses, "amount");

    // Expense by category
    const expByCategory: Record<string, number> = {};
    for (const e of expenses) {
      expByCategory[e.category] = (expByCategory[e.category] ?? 0) + Number(e.amount);
    }

    // ── Outstanding (unpaid repairs — all time) ───────────────────────────────
    const unpaidRepairs = await db.select({ totalCost: repairsTable.totalCost, advancePaid: repairsTable.advancePaid })
      .from(repairsTable)
      .where(and(eq(repairsTable.userId, userId), eq(repairsTable.isPaid, false)));
    const outstanding = unpaidRepairs.reduce((s, r) => {
      const due = Number(r.totalCost ?? 0) - Number(r.advancePaid ?? 0);
      return s + Math.max(0, due);
    }, 0);

    // ── 7-day daily chart ─────────────────────────────────────────────────────
    const chart: { date: string; day: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d   = new Date(now);
      d.setDate(d.getDate() - i);
      const ds  = toDateStr(d);
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      const daySales   = sales.filter(s => s.date === ds);
      const dayRepairs = repairs.filter(r => toDateStr(new Date(r.deliveredAt ?? r.updatedAt ?? r.createdAt)) === ds);
      chart.push({
        date:    ds,
        day:     dayLabel,
        revenue: sumField(daySales, "total") + sumField(dayRepairs, "totalCost"),
      });
    }

    // ── Totals ────────────────────────────────────────────────────────────────
    const todayRevenue     = posToday + repairRevToday;
    const yesterdayRevenue = posYesterday + repairRevYd;
    const totalRevenue     = posRange + repairRevRange;
    // Profit = Revenue - Operating Expenses - Parts invested in repairs
    const netProfit        = totalRevenue - totalExpenses - repairPartsRange;

    res.json({
      todayRevenue,
      yesterdayRevenue,
      posRevenue:      posRange,
      repairRevenue:   repairRevRange,
      repairPartsCost: repairPartsRange,
      totalRevenue,
      totalExpenses,
      netProfit,
      outstanding,
      expenseByCategory: expByCategory,
      weeklyChart: chart,
    });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch sales summary" });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function sumField(arr: any[], field: string): number {
  return arr.reduce((s, r) => s + Number(r[field] ?? 0), 0);
}
function sumArr(arr: number[]): number {
  return arr.reduce((s, n) => s + n, 0);
}

export default router;
