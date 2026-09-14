import { Router } from "express";
import { db, suppliersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getBranchCondition, extractBranchSaveData } from "../lib/branch-helper";

const router = Router();

function getUid(req: any, res: any): number | null {
  const uid: number | undefined = req.userId;
  if (!uid) { res.status(403).json({ error: "User session invalid" }); return null; }
  return uid;
}

function ownerOnly(req: any, res: any): boolean {
  const session = req.session;
  const role = String(session?.userRole ?? "").toLowerCase();
  if (session?.staffId || ["staff", "technician", "manager", "both"].includes(role)) {
    res.status(403).json({ error: "Owner access required" });
    return false;
  }
  return true;
}

router.get("/", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const branchCond = getBranchCondition(req, suppliersTable.branchId);
    const rows = await db.select().from(suppliersTable)
      .where(branchCond ? and(eq(suppliersTable.userId, userId), branchCond) : eq(suppliersTable.userId, userId))
      .orderBy(suppliersTable.name);
    res.json(rows);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = getUid(req, res); if (!userId) return;
    const [row] = await db.select().from(suppliersTable)
      .where(and(eq(suppliersTable.id, Number(req.params.id)), eq(suppliersTable.userId, userId)));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/", async (req, res) => {
  try {
    if (!ownerOnly(req, res)) return;
    const userId = getUid(req, res); if (!userId) return;
    const { branchId, branchName } = extractBranchSaveData(req, req.body);
    const { id: _id, userId: _userId, createdAt: _createdAt, ...safeBody } = req.body;
    const [row] = await db.insert(suppliersTable).values({
      ...safeBody,
      userId,
      branchId,
      branchName,
      updatedAt: new Date(),
    }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create" }); }
});

router.put("/:id", async (req, res) => {
  try {
    if (!ownerOnly(req, res)) return;
    const userId = getUid(req, res); if (!userId) return;
    const { id: _id, userId: _userId, createdAt: _ca, branchId: _branchId, branchName: _branchName, ...safeUpdates } = req.body;
    const [row] = await db.update(suppliersTable)
      .set({ ...safeUpdates, updatedAt: new Date() })
      .where(and(eq(suppliersTable.id, Number(req.params.id)), eq(suppliersTable.userId, userId), getBranchCondition(req, suppliersTable.branchId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!ownerOnly(req, res)) return;
    const userId = getUid(req, res); if (!userId) return;
    await db.delete(suppliersTable)
      .where(and(eq(suppliersTable.id, Number(req.params.id)), eq(suppliersTable.userId, userId), getBranchCondition(req, suppliersTable.branchId)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete" }); }
});

export default router;
