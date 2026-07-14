import { Router } from "express";
import { db, issuesFixesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : null;
    let rows = await db.select().from(issuesFixesTable).orderBy(desc(issuesFixesTable.createdAt));
    if (q) rows = rows.filter(r => r.title.toLowerCase().includes(q.toLowerCase()) || (r.deviceModel ?? "").toLowerCase().includes(q.toLowerCase()));
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    const [row] = await db.insert(issuesFixesTable).values({ ...req.body, updatedAt: new Date() }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create" }); }
});

router.put("/:id", async (req, res) => {
  try {
    const [row] = await db.update(issuesFixesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(issuesFixesTable.id, Number(req.params.id))).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(issuesFixesTable).where(eq(issuesFixesTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete" }); }
});

export default router;
