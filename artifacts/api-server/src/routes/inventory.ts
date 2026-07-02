import { Router } from "express";
import { db, inventoryTable } from "@workspace/db";
import { eq, ilike, or, lte, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : null;
    const rows = q
      ? await db.select().from(inventoryTable).where(or(ilike(inventoryTable.partName, `%${q}%`), ilike(inventoryTable.brand || sql`''`, `%${q}%`), ilike(inventoryTable.model || sql`''`, `%${q}%`))).orderBy(inventoryTable.partName)
      : await db.select().from(inventoryTable).orderBy(inventoryTable.partName);
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch inventory" }); }
});

router.get("/low-stock", async (_req, res) => {
  try {
    const rows = await db.select().from(inventoryTable).where(lte(inventoryTable.quantity, inventoryTable.minStock)).orderBy(inventoryTable.quantity);
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const [row] = await db.select().from(inventoryTable).where(eq(inventoryTable.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const [row] = await db.insert(inventoryTable).values({ ...req.body, updatedAt: new Date() }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create item" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const [row] = await db.update(inventoryTable).set({ ...req.body, updatedAt: new Date() }).where(eq(inventoryTable.id, Number(req.params.id))).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update item" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(inventoryTable).where(eq(inventoryTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete item" }); }
});

export default router;
