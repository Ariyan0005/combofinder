import { Router } from "express";
import { db, schematicsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { slugify } from "../lib/slug";

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

router.post("/", requireAdminRole, async (req, res): Promise<void> => {
  try {
    const body = req.body ?? {};
    if (!String(body.title ?? "").trim()) {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    const modelId = body.modelId ? Number(body.modelId) : null;
    const slug = body.slug?.trim() || slugify(`${body.deviceBrand ?? ""}-${body.deviceModel ?? ""}-${body.title}`);
    const [row] = await db.insert(schematicsTable).values({
      title: String(body.title).trim(),
      slug: slug || null,
      modelId,
      deviceBrand: body.deviceBrand?.trim() || null,
      deviceModel: body.deviceModel?.trim() || null,
      schematicType: body.schematicType?.trim() || "Other",
      fileUrl: body.fileUrl?.trim() || null,
      thumbnailUrl: body.thumbnailUrl?.trim() || null,
      fileSize: body.fileSize?.trim() || null,
      tags: body.tags?.trim() || null,
      notes: body.notes?.trim() || null,
      component: body.component?.trim() || null,
      pinNumber: body.pinNumber?.trim() || null,
      pinName: body.pinName?.trim() || null,
      voltage: body.voltage?.trim() || null,
      ground: body.ground?.trim() || null,
      signalInfo: body.signalInfo?.trim() || null,
      testPointInfo: body.testPointInfo?.trim() || null,
      isPublished: body.isPublished === true,
    }).returning();
    res.status(201).json(row);
    return;
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create" }); }
});

router.put("/:id", requireAdminRole, async (req, res): Promise<void> => {
  try {
    const body = req.body ?? {};
    const updates: Record<string, unknown> = {};
    for (const key of [
      "title", "deviceBrand", "deviceModel", "schematicType", "fileUrl", "thumbnailUrl",
      "fileSize", "tags", "notes", "component", "pinNumber", "pinName", "voltage",
      "ground", "signalInfo", "testPointInfo",
    ]) {
      if (body[key] !== undefined) updates[key] = typeof body[key] === "string" ? body[key].trim() || null : body[key];
    }
    if (body.modelId !== undefined) updates.modelId = body.modelId ? Number(body.modelId) : null;
    if (body.slug !== undefined) updates.slug = body.slug?.trim() || null;
    if (body.isPublished !== undefined) updates.isPublished = body.isPublished === true;
    if (updates.slug === undefined && (updates.title || updates.deviceBrand || updates.deviceModel)) {
      const [existing] = await db.select().from(schematicsTable).where(eq(schematicsTable.id, Number(req.params.id))).limit(1);
      if (existing) {
        updates.slug = slugify(`${updates.deviceBrand ?? existing.deviceBrand ?? ""}-${updates.deviceModel ?? existing.deviceModel ?? ""}-${updates.title ?? existing.title}`);
      }
    }
    const [row] = await db.update(schematicsTable).set(updates).where(eq(schematicsTable.id, Number(req.params.id))).returning();
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
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
