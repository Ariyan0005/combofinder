import { Router } from "express";
import { db, customersTable, salesTable } from "@workspace/db";
import { eq, ilike, or, and, sql } from "drizzle-orm";

const router = Router();

function getUid(req: any, res: any): number | null {
  const uid: number | undefined = req.userId;
  if (!uid) { res.status(403).json({ error: "User session invalid" }); return null; }
  return uid;
}

router.get("/", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const q = req.query.q ? String(req.query.q) : null;
    const userFilter = eq(customersTable.userId, userId);

    const rows = q
      ? await db.select().from(customersTable)
          .where(and(userFilter, or(ilike(customersTable.name, `%${q}%`), ilike(customersTable.phone, `%${q}%`))))
          .orderBy(customersTable.createdAt)
      : await db.select().from(customersTable).where(userFilter).orderBy(customersTable.createdAt);

    // Attach credit due from sales for each customer
    // Excludes fully-Returned sales; subtracts any partial refunds for Partially Returned
    if (rows.length > 0) {
      const creditRows = await db.execute(sql`
        SELECT s.customer_id::int,
               GREATEST(0, SUM(
                 CASE
                   WHEN s.status = 'Returned' THEN 0
                   ELSE GREATEST(0,
                     s.total::numeric
                     - COALESCE(s.advance_paid::numeric, 0)
                     - COALESCE(r.total_refund, 0)
                   )
                 END
               )) AS credit_due
        FROM sales s
        LEFT JOIN (
          SELECT sale_id, SUM(refund_amount::numeric) AS total_refund
          FROM sale_returns
          GROUP BY sale_id
        ) r ON r.sale_id = s.id
        WHERE s.payment_method = 'Credit'
          AND s.customer_id IS NOT NULL
          AND s.user_id = ${userId}
        GROUP BY s.customer_id
      `);
      const dueMap = new Map<number, number>(
        (creditRows.rows as any[]).map(r => [Number(r.customer_id), Number(r.credit_due)])
      );
      return res.json(rows.map(c => ({ ...c, creditDue: dueMap.get(c.id) ?? 0 })));
    }

    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch customers" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const [row] = await db.select().from(customersTable)
      .where(and(eq(customersTable.id, Number(req.params.id)), eq(customersTable.userId, userId)));
    if (!row) return res.status(404).json({ error: "Not found" });

    const [dueRow] = await db.execute(sql`
      SELECT GREATEST(0, SUM(
        CASE
          WHEN s.status = 'Returned' THEN 0
          ELSE GREATEST(0,
            s.total::numeric
            - COALESCE(s.advance_paid::numeric, 0)
            - COALESCE(r.total_refund, 0)
          )
        END
      )) AS credit_due
      FROM sales s
      LEFT JOIN (
        SELECT sale_id, SUM(refund_amount::numeric) AS total_refund
        FROM sale_returns
        GROUP BY sale_id
      ) r ON r.sale_id = s.id
      WHERE s.payment_method = 'Credit' AND s.customer_id = ${row.id} AND s.user_id = ${userId}
    `).then(r => r.rows as any[]);
    const creditDue = Number(dueRow?.credit_due ?? 0);

    res.json({ ...row, creditDue });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const [row] = await db.insert(customersTable).values({ ...req.body, userId }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create customer" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const [row] = await db.update(customersTable).set(req.body)
      .where(and(eq(customersTable.id, Number(req.params.id)), eq(customersTable.userId, userId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update customer" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    await db.delete(customersTable)
      .where(and(eq(customersTable.id, Number(req.params.id)), eq(customersTable.userId, userId)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete customer" }); }
});

export default router;
