import { Router } from "express";
import { db, knowledgeBaseTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : null;
    const category = req.query.category ? String(req.query.category) : null;
    let rows = await db.select().from(knowledgeBaseTable).orderBy(knowledgeBaseTable.createdAt);
    if (q) rows = rows.filter(r => r.title.toLowerCase().includes(q.toLowerCase()) || (r.deviceModel ?? "").toLowerCase().includes(q.toLowerCase()));
    if (category && category !== "All") rows = rows.filter(r => r.category === category);
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch knowledge base" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const [row] = await db.select().from(knowledgeBaseTable).where(eq(knowledgeBaseTable.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const [row] = await db.insert(knowledgeBaseTable).values({ ...req.body, updatedAt: new Date() }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create entry" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const [row] = await db.update(knowledgeBaseTable).set({ ...req.body, updatedAt: new Date() }).where(eq(knowledgeBaseTable.id, Number(req.params.id))).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(knowledgeBaseTable).where(eq(knowledgeBaseTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete" }); }
});

export default router;
