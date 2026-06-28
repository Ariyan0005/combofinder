import { Router } from "express";
import { db, partsTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try { const parts = await db.select().from(partsTable).orderBy(partsTable.createdAt); res.json(parts); }
  catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch parts" }); }
});
router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "");
    if (q.length < 2) return res.json([]);
    const results = await db.select().from(partsTable).where(
      or(ilike(partsTable.partName, `%${q}%`), ilike(partsTable.partType, `%${q}%`), ilike(partsTable.compatibleModels, `%${q}%`))
    ).limit(30);
    res.json(results);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Search failed" }); }
});
router.post("/", async (req, res) => {
  try { const [part] = await db.insert(partsTable).values(req.body).returning(); res.status(201).json(part); }
  catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});
router.put("/:id", async (req, res) => {
  try {
    const [part] = await db.update(partsTable).set(req.body).where(eq(partsTable.id, Number(req.params.id))).returning();
    if (!part) return res.status(404).json({ error: "Not found" });
    res.json(part);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});
router.delete("/:id", async (req, res) => {
  try { await db.delete(partsTable).where(eq(partsTable.id, Number(req.params.id))); res.json({ success: true }); }
  catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

export default router;
