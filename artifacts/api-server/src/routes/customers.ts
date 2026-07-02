import { Router } from "express";
import { db, customersTable } from "@workspace/db";
import { eq, ilike, or, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : null;
    const rows = q
      ? await db.select().from(customersTable).where(or(ilike(customersTable.name, `%${q}%`), ilike(customersTable.phone, `%${q}%`))).orderBy(customersTable.createdAt)
      : await db.select().from(customersTable).orderBy(customersTable.createdAt);
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch customers" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const [row] = await db.select().from(customersTable).where(eq(customersTable.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const [row] = await db.insert(customersTable).values(req.body).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create customer" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const [row] = await db.update(customersTable).set(req.body).where(eq(customersTable.id, Number(req.params.id))).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update customer" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(customersTable).where(eq(customersTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete customer" }); }
});

export default router;
