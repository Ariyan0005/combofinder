import { Router } from "express";
import { db, staffTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// GET /api/staff — list all staff for the authenticated user
router.get("/", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const rows = await db.select().from(staffTable)
      .where(eq(staffTable.userId, userId))
      .orderBy(desc(staffTable.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

// POST /api/staff — create a new staff member
router.post("/", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const b = req.body;
    if (!b.name || !String(b.name).trim()) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    const [row] = await db.insert(staffTable).values({
      userId,
      name:     String(b.name).trim(),
      phone:    b.phone    ? String(b.phone).trim()    : null,
      staffId:  b.staffId  ? String(b.staffId).trim()  : null,
      role:     b.role     ? String(b.role)             : "Staff",
      isActive: b.isActive !== undefined ? Boolean(b.isActive) : true,
      notes:    b.notes    ? String(b.notes).trim()    : null,
      updatedAt: new Date(),
    }).returning();
    res.status(201).json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create staff member" });
  }
});

// PUT /api/staff/:id — update a staff member
router.put("/:id", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const b = req.body;
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (b.name     !== undefined) updates.name     = String(b.name).trim();
    if (b.phone    !== undefined) updates.phone    = b.phone    ? String(b.phone).trim()    : null;
    if (b.staffId  !== undefined) updates.staffId  = b.staffId  ? String(b.staffId).trim()  : null;
    if (b.role     !== undefined) updates.role     = String(b.role);
    if (b.isActive !== undefined) updates.isActive = Boolean(b.isActive);
    if (b.notes    !== undefined) updates.notes    = b.notes    ? String(b.notes).trim()    : null;

    const [row] = await db.update(staffTable).set(updates)
      .where(and(
        eq(staffTable.id, Number(req.params.id)),
        eq(staffTable.userId, userId),
      ))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update staff member" });
  }
});

// DELETE /api/staff/:id — delete a staff member
router.delete("/:id", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    await db.delete(staffTable)
      .where(and(
        eq(staffTable.id, Number(req.params.id)),
        eq(staffTable.userId, userId),
      ));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete staff member" });
  }
});

export default router;
