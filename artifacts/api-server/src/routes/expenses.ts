import { Router } from "express";
import { db, expensesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const userId: number | undefined = (req as any).userId;
    const userFilter = userId ? eq(expensesTable.userId, userId) : undefined;
    const rows = await db.select().from(expensesTable).where(userFilter).orderBy(desc(expensesTable.createdAt));
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch expenses" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const userId: number | undefined = (req as any).userId;
    const [row] = await db.select().from(expensesTable)
      .where(userId
        ? and(eq(expensesTable.id, Number(req.params.id)), eq(expensesTable.userId, userId))
        : eq(expensesTable.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const userId: number | undefined = (req as any).userId;
    const [row] = await db.insert(expensesTable).values({ ...req.body, userId: userId ?? null }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create expense" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const userId: number | undefined = (req as any).userId;
    const whereClause = userId
      ? and(eq(expensesTable.id, Number(req.params.id)), eq(expensesTable.userId, userId))
      : eq(expensesTable.id, Number(req.params.id));
    const [row] = await db.update(expensesTable).set(req.body).where(whereClause).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId: number | undefined = (req as any).userId;
    const whereClause = userId
      ? and(eq(expensesTable.id, Number(req.params.id)), eq(expensesTable.userId, userId))
      : eq(expensesTable.id, Number(req.params.id));
    await db.delete(expensesTable).where(whereClause);
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete" }); }
});

export default router;
