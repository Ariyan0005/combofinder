import { Router } from "express";
import { db, schematicsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// Middleware: allow only admin/superadmin roles on mutating methods
function requireAdminRole(req: any, res: any, next: any) {
  const role: string = (req.session?.userRole ?? "").toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin";
  if (!isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

router.get("/", async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : null;
    let rows = await db.select().from(schematicsTable).orderBy(desc(schematicsTable.createdAt));
    if (q) rows = rows.filter(r => r.title.toLowerCase().includes(q.toLowerCase()) || (r.deviceModel ?? "").toLowerCase().includes(q.toLowerCase()));
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", requireAdminRole, async (req, res) => {
  try {
    const [row] = await db.insert(schematicsTable).values(req.body).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create" }); }
});

router.put("/:id", requireAdminRole, async (req, res) => {
  try {
    const [row] = await db.update(schematicsTable).set(req.body).where(eq(schematicsTable.id, Number(req.params.id))).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.delete("/:id", requireAdminRole, async (req, res) => {
  try {
    await db.delete(schematicsTable).where(eq(schematicsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete" }); }
});

export default router;
