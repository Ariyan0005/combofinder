/**
 * Client-side sales summary calculation for Free-plan users.
 * Mirrors the logic of /api/sales-summary but reads from localStorage.
 *
 * Repair profit rules (mirror server):
 *  - Only "Ready" and "Delivered" repairs count towards revenue & profit.
 *  - Parts cost = inventory.purchasePrice × qty (not the selling partsCost).
 *  - Cancelled / in-progress repairs are excluded.
 */
import { localSales, localExpenses, localRepairs, localInventory } from "./local-store";

export interface SalesSummary {
  todayRevenue:     number;
  yesterdayRevenue: number;
  posRevenue:       number;
  posCost:          number;
  repairRevenue:    number;
  repairPartsCost:  number;
  totalRevenue:     number;
  totalExpenses:    number;
  netProfit:        number;
  outstanding:      number;
  expenseByCategory: Record<string, number>;
  weeklyChart: { date: string; day: string; revenue: number }[];
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function sumField(arr: any[], field: string): number {
  return arr.reduce((s: number, r: any) => s + Number(r[field] ?? 0), 0);
}

export function computeSalesSummary(
  uid: number,
  range: "today" | "week" | "month" | "custom" = "month",
  customFrom?: string,
  customTo?: string,
): SalesSummary {
  const now    = new Date();
  const today  = toDateStr(now);
  const yd     = new Date(now); yd.setDate(yd.getDate() - 1);
  const yDay   = toDateStr(yd);

  let fromDate: string;
  let toDate = today;

  if (range === "today") {
    fromDate = today;
  } else if (range === "week") {
    const d = new Date(now); d.setDate(d.getDate() - 6);
    fromDate = toDateStr(d);
  } else if (range === "custom" && customFrom) {
    fromDate = customFrom;
    toDate   = customTo ?? today;
  } else {
    // month
    fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  }

  const inRange = (dateStr: string | undefined) => {
    if (!dateStr) return false;
    const d = dateStr.slice(0, 10);
    return d >= fromDate && d <= toDate;
  };

  // ── POS Sales ───────────────────────────────────────────────────────────────
  const allSales = localSales.getAll(uid).filter((s: any) => s.status !== "Returned");
  const salesInRange   = allSales.filter((s: any) => inRange(s.date));
  const posToday       = sumField(allSales.filter((s: any) => s.date === today),  "total");
  const posYesterday   = sumField(allSales.filter((s: any) => s.date === yDay),   "total");
  const posRange       = sumField(salesInRange, "total");

  // ── POS Cost of Goods Sold (COGS) — local inventory join ───────────────────
  // Build a lookup map: inventoryId → purchasePrice (current price in localStorage)
  const invMap: Record<number, number> = {};
  for (const inv of localInventory.getAll(uid)) {
    invMap[inv.id] = Number(inv.purchasePrice ?? 0);
  }
  // For each sale in range, sum up (soldQty × purchasePrice) per line item
  let posCost = 0;
  for (const sale of salesInRange) {
    for (const item of (sale.items ?? [])) {
      const soldQty = Number(item.quantity ?? 0) - Number(item.returnedQuantity ?? 0);
      const costPer = Number(item.costPrice ?? invMap[item.inventoryId] ?? 0);
      posCost += Math.max(0, soldQty) * costPer;
    }
  }

  // ── Repairs — only Ready & Delivered count ──────────────────────────────────
  const allRepairs = localRepairs.getAll(uid);

  const repairDate = (r: any): string =>
    (r.deliveredAt ?? r.updatedAt ?? r.createdAt ?? "").slice(0, 10);

  // Collected = totalCost for isPaid repairs, advancePaid for partial repairs
  const repairCollected = (r: any): number => {
    if (r.isPaid) return Number(r.totalCost ?? 0);
    return Math.max(0, Number(r.advancePaid ?? 0));
  };

  // Exclude Cancelled, Repairing, Waiting — only Ready + Delivered count
  const completedRepairs = allRepairs.filter((r: any) =>
    r.status === "Ready" || r.status === "Delivered"
  );

  const repairsInRange   = completedRepairs.filter((r: any) => inRange(repairDate(r)));
  const repairToday      = completedRepairs.filter((r: any) => repairDate(r) === today);
  const repairYd         = completedRepairs.filter((r: any) => repairDate(r) === yDay);

  const repairRevRange   = repairsInRange.reduce((s: number, r: any) => s + repairCollected(r), 0);
  const repairRevToday   = repairToday.reduce((s: number, r: any) => s + repairCollected(r), 0);
  const repairRevYd      = repairYd.reduce((s: number, r: any) => s + repairCollected(r), 0);

  // ── Repair Actual Parts Cost (purchase price × qty) ─────────────────────────
  // Use inventory.purchasePrice to get true cost, not the selling partsCost.
  // Profit = repairRevenue - actualPartsCost (= labor + partsSelling - partsBuyPrice).
  let repairPartsRange = 0;
  for (const r of repairsInRange) {
    try {
      const parts = r.partsUsed ? JSON.parse(r.partsUsed) : [];
      for (const p of parts) {
        if (p.inventoryId && p.qty) {
          const purchasePrice = invMap[p.inventoryId] ?? 0;
          repairPartsRange += purchasePrice * Number(p.qty);
        }
      }
    } catch { /* skip malformed */ }
  }

  // ── Expenses ─────────────────────────────────────────────────────────────────
  const expenses = localExpenses.getAll(uid).filter((e: any) => {
    const d = (e.date ?? e.createdAt ?? "").slice(0, 10);
    return d >= fromDate && d <= toDate;
  });
  const totalExpenses = sumField(expenses, "amount");

  const expByCategory: Record<string, number> = {};
  for (const e of expenses) {
    const cat = e.category ?? "Other";
    expByCategory[cat] = (expByCategory[cat] ?? 0) + Number(e.amount ?? 0);
  }

  // ── Outstanding — only Ready + Delivered unpaid repairs ───────────────────
  const outstanding = completedRepairs
    .filter((r: any) => !r.isPaid)
    .reduce((s: number, r: any) => {
      const due = Number(r.totalCost ?? 0) - Number(r.advancePaid ?? 0);
      return s + Math.max(0, due);
    }, 0);

  // ── 7-day chart ───────────────────────────────────────────────────────────────
  const chart: { date: string; day: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d  = new Date(now); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const dl = d.toLocaleDateString("en-US", { weekday: "short" });
    const daySales   = allSales.filter((s: any)   => s.date === ds);
    const dayRepairs = completedRepairs.filter((r: any) => repairDate(r) === ds);
    chart.push({ date: ds, day: dl, revenue: sumField(daySales, "total") + dayRepairs.reduce((s: number, r: any) => s + repairCollected(r), 0) });
  }

  const todayRevenue     = posToday   + repairRevToday;
  const yesterdayRevenue = posYesterday + repairRevYd;
  const totalRevenue     = posRange   + repairRevRange;
  // Profit = POS Revenue - POS COGS + Repair Revenue - Repair Actual Parts Cost - Expenses
  const netProfit        = posRange - posCost + repairRevRange - repairPartsRange - totalExpenses;

  return {
    todayRevenue,
    yesterdayRevenue,
    posRevenue:      posRange,
    posCost,
    repairRevenue:   repairRevRange,
    repairPartsCost: repairPartsRange,
    totalRevenue,
    totalExpenses,
    netProfit,
    outstanding,
    expenseByCategory: expByCategory,
    weeklyChart: chart,
  };
}
