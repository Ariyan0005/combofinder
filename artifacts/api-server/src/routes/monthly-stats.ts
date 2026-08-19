import { Router } from "express";
import { db, repairsTable, expensesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// Monthly income from repairs + expenses for chart (isolated to authenticated user)
router.get("/monthly-stats", async (req: any, res) => {
  try {
    const userId: number | undefined = req.session?.authenticated && req.session?.userId ? req.session.userId : (req.userId ?? undefined);
    if (!userId) {
      res.json([]);
      return;
    }

    const repairs = await db.select().from(repairsTable)
      .where(eq(repairsTable.userId, userId))
      .orderBy(repairsTable.createdAt);

    const expenses = await db.select().from(expensesTable)
      .where(eq(expensesTable.userId, userId))
      .orderBy(expensesTable.createdAt);

    const monthly: Record<string, { month: string; income: number; expense: number; label: string }> = {};

    const getKey = (dateStr: string | Date) => {
      const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };

    const getLabel = (key: string) => {
      const [year, month] = key.split("-");
      const d = new Date(Number(year), Number(month) - 1);
      return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    };

    for (const r of repairs) {
      const key = getKey(r.createdAt);
      if (!monthly[key]) monthly[key] = { month: key, income: 0, expense: 0, label: getLabel(key) };
      monthly[key].income += parseFloat(r.totalCost ?? "0");
    }

    for (const e of expenses) {
      const key = getKey(e.date ?? e.createdAt.toISOString());
      if (!monthly[key]) monthly[key] = { month: key, income: 0, expense: 0, label: getLabel(key) };
      monthly[key].expense += parseFloat(e.amount ?? "0");
    }

    const sorted = Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
    res.json(sorted);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch monthly stats" }); }
});

export default router;
