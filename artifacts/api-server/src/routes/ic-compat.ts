import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, icModelsTable, icCompatibilityTable, brandsTable } from "@workspace/db";

const router: IRouter = Router();

// ─── IC Models ────────────────────────────────────────────────────────────────

// GET /ic-models?brandId=
router.get("/ic-models", async (req, res): Promise<void> => {
  const brandId = req.query.brandId ? Number(req.query.brandId) : undefined;
  if (!brandId) { res.status(400).json({ error: "brandId is required" }); return; }

  const rows = await db
    .select({
      id: icModelsTable.id,
      brandId: icModelsTable.brandId,
      brandName: brandsTable.name,
      icNumber: icModelsTable.icNumber,
      description: icModelsTable.description,
      package: icModelsTable.package,
      notes: icModelsTable.notes,
      createdAt: icModelsTable.createdAt,
    })
    .from(icModelsTable)
    .innerJoin(brandsTable, eq(brandsTable.id, icModelsTable.brandId))
    .where(eq(icModelsTable.brandId, brandId))
    .orderBy(icModelsTable.icNumber);

  res.json(rows);
});

// GET /ic-models/:id
router.get("/ic-models/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [row] = await db
    .select({
      id: icModelsTable.id,
      brandId: icModelsTable.brandId,
      brandName: brandsTable.name,
      icNumber: icModelsTable.icNumber,
      description: icModelsTable.description,
      package: icModelsTable.package,
      notes: icModelsTable.notes,
      createdAt: icModelsTable.createdAt,
    })
    .from(icModelsTable)
    .innerJoin(brandsTable, eq(brandsTable.id, icModelsTable.brandId))
    .where(eq(icModelsTable.id, id));

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// POST /ic-models
router.post("/ic-models", async (req, res): Promise<void> => {
  const { brandId, icNumber, description, package: pkg, notes } = req.body;
  if (!brandId || !icNumber?.trim()) {
    res.status(400).json({ error: "brandId and icNumber are required" }); return;
  }
  const [row] = await db.insert(icModelsTable).values({
    brandId: Number(brandId),
    icNumber: icNumber.trim(),
    description: description?.trim() || null,
    package: pkg?.trim() || null,
    notes: notes?.trim() || null,
  }).returning();
  res.status(201).json(row);
});

// PUT /ic-models/:id
router.put("/ic-models/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { icNumber, description, package: pkg, notes } = req.body;
  const [row] = await db.update(icModelsTable)
    .set({
      ...(icNumber && { icNumber: icNumber.trim() }),
      description: description?.trim() || null,
      package: pkg?.trim() || null,
      notes: notes?.trim() || null,
    })
    .where(eq(icModelsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// DELETE /ic-models/:id
router.delete("/ic-models/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [row] = await db.delete(icModelsTable).where(eq(icModelsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

// ─── IC Compatibility ─────────────────────────────────────────────────────────

// GET /ic-compat?icModelId=
router.get("/ic-compat", async (req, res): Promise<void> => {
  const icModelId = req.query.icModelId ? Number(req.query.icModelId) : undefined;
  if (!icModelId) { res.status(400).json({ error: "icModelId is required" }); return; }

  const rows = await db
    .select()
    .from(icCompatibilityTable)
    .where(eq(icCompatibilityTable.icModelId, icModelId))
    .orderBy(icCompatibilityTable.deviceName);

  res.json(rows);
});

// POST /ic-compat/bulk
router.post("/ic-compat/bulk", async (req, res): Promise<void> => {
  const { icModelId, deviceNames } = req.body;
  if (!icModelId || !Array.isArray(deviceNames) || deviceNames.length === 0) {
    res.status(400).json({ error: "icModelId and deviceNames[] are required" }); return;
  }
  const clean = Array.from(new Set(deviceNames.map((d: string) => d.trim()).filter(Boolean)));
  const inserted = await db.insert(icCompatibilityTable)
    .values(clean.map(deviceName => ({ icModelId: Number(icModelId), deviceName })))
    .returning();
  res.status(201).json(inserted);
});

// POST /ic-compat
router.post("/ic-compat", async (req, res): Promise<void> => {
  const { icModelId, deviceName, notes } = req.body;
  if (!icModelId || !deviceName?.trim()) {
    res.status(400).json({ error: "icModelId and deviceName are required" }); return;
  }
  const [row] = await db.insert(icCompatibilityTable).values({
    icModelId: Number(icModelId),
    deviceName: deviceName.trim(),
    notes: notes?.trim() || null,
  }).returning();
  res.status(201).json(row);
});

// DELETE /ic-compat/:id
router.delete("/ic-compat/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [row] = await db.delete(icCompatibilityTable).where(eq(icCompatibilityTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

export default router;
