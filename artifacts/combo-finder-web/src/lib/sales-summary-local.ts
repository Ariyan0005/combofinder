/**
 * Client-side sales summary calculation for Free-plan users.
 * Mirrors the logic of /api/sales-summary but reads from localStorage.
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

  // ── Repairs (delivered + paid) ──────────────────────────────────────────────
  const allRepairs = localRepairs.getAll(uid);
  const paidDelivered = allRepairs.filter((r: any) => r.isPaid && r.status === "Delivered");

  const repairDate = (r: any): string =>
    (r.deliveredAt ?? r.updatedAt ?? r.createdAt ?? "").slice(0, 10);

  const repairsInRange   = paidDelivered.filter((r: any) => inRange(repairDate(r)));
  const repairToday      = paidDelivered.filter((r: any) => repairDate(r) === today);
  const repairYd         = paidDelivered.filter((r: any) => repairDate(r) === yDay);

  const repairRevRange   = sumField(repairsInRange, "totalCost");
  const repairPartsRange = sumField(repairsInRange, "partsCost");
  const repairRevToday   = sumField(repairToday,    "totalCost");
  const repairRevYd      = sumField(repairYd,       "totalCost");

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

  // ── Outstanding ───────────────────────────────────────────────────────────────
  const outstanding = allRepairs
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
    const dayRepairs = paidDelivered.filter((r: any) => repairDate(r) === ds);
    chart.push({ date: ds, day: dl, revenue: sumField(daySales, "total") + sumField(dayRepairs, "totalCost") });
  }

  const todayRevenue     = posToday   + repairRevToday;
  const yesterdayRevenue = posYesterday + repairRevYd;
  const totalRevenue     = posRange   + repairRevRange;
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
