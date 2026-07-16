import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, batteryModelsTable, batteryCompatibilityTable, brandsTable } from "@workspace/db";

const router: IRouter = Router();

// ─── Battery Models ───────────────────────────────────────────────────────────

// GET /battery-models?brandId=
router.get("/battery-models", async (req, res): Promise<void> => {
  const brandId = req.query.brandId ? Number(req.query.brandId) : undefined;
  if (!brandId) { res.status(400).json({ error: "brandId is required" }); return; }

  const rows = await db
    .select({
      id: batteryModelsTable.id,
      brandId: batteryModelsTable.brandId,
      brandName: brandsTable.name,
      modelNumber: batteryModelsTable.modelNumber,
      capacity: batteryModelsTable.capacity,
      voltage: batteryModelsTable.voltage,
      notes: batteryModelsTable.notes,
      createdAt: batteryModelsTable.createdAt,
    })
    .from(batteryModelsTable)
    .innerJoin(brandsTable, eq(brandsTable.id, batteryModelsTable.brandId))
    .where(eq(batteryModelsTable.brandId, brandId))
    .orderBy(batteryModelsTable.modelNumber);

  res.json(rows);
});

// GET /battery-models/:id
router.get("/battery-models/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [row] = await db
    .select({
      id: batteryModelsTable.id,
      brandId: batteryModelsTable.brandId,
      brandName: brandsTable.name,
      modelNumber: batteryModelsTable.modelNumber,
      capacity: batteryModelsTable.capacity,
      voltage: batteryModelsTable.voltage,
      notes: batteryModelsTable.notes,
      createdAt: batteryModelsTable.createdAt,
    })
    .from(batteryModelsTable)
    .innerJoin(brandsTable, eq(brandsTable.id, batteryModelsTable.brandId))
    .where(eq(batteryModelsTable.id, id));

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// POST /battery-models
router.post("/battery-models", async (req, res): Promise<void> => {
  const { brandId, modelNumber, capacity, voltage, notes } = req.body;
  if (!brandId || !modelNumber?.trim()) {
    res.status(400).json({ error: "brandId and modelNumber are required" }); return;
  }
  const [row] = await db.insert(batteryModelsTable).values({
    brandId: Number(brandId),
    modelNumber: modelNumber.trim(),
    capacity: capacity?.trim() || null,
    voltage: voltage?.trim() || null,
    notes: notes?.trim() || null,
  }).returning();
  res.status(201).json(row);
});

// PUT /battery-models/:id
router.put("/battery-models/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { modelNumber, capacity, voltage, notes } = req.body;
  const [row] = await db.update(batteryModelsTable)
    .set({
      ...(modelNumber && { modelNumber: modelNumber.trim() }),
      capacity: capacity?.trim() || null,
      voltage: voltage?.trim() || null,
      notes: notes?.trim() || null,
    })
    .where(eq(batteryModelsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// DELETE /battery-models/:id
router.delete("/battery-models/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [row] = await db.delete(batteryModelsTable).where(eq(batteryModelsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

// ─── Battery Compatibility ────────────────────────────────────────────────────

// GET /battery-compat?batteryModelId=
router.get("/battery-compat", async (req, res): Promise<void> => {
  const batteryModelId = req.query.batteryModelId ? Number(req.query.batteryModelId) : undefined;
  if (!batteryModelId) { res.status(400).json({ error: "batteryModelId is required" }); return; }

  const rows = await db
    .select()
    .from(batteryCompatibilityTable)
    .where(eq(batteryCompatibilityTable.batteryModelId, batteryModelId))
    .orderBy(batteryCompatibilityTable.deviceName);

  res.json(rows);
});

// POST /battery-compat/bulk
router.post("/battery-compat/bulk", async (req, res): Promise<void> => {
  const { batteryModelId, deviceNames } = req.body;
  if (!batteryModelId || !Array.isArray(deviceNames) || deviceNames.length === 0) {
    res.status(400).json({ error: "batteryModelId and deviceNames[] are required" }); return;
  }
  const clean = Array.from(new Set(deviceNames.map((d: string) => d.trim()).filter(Boolean)));
  const inserted = await db.insert(batteryCompatibilityTable)
    .values(clean.map(deviceName => ({ batteryModelId: Number(batteryModelId), deviceName })))
    .returning();
  res.status(201).json(inserted);
});

// POST /battery-compat
router.post("/battery-compat", async (req, res): Promise<void> => {
  const { batteryModelId, deviceName, notes } = req.body;
  if (!batteryModelId || !deviceName?.trim()) {
    res.status(400).json({ error: "batteryModelId and deviceName are required" }); return;
  }
  const [row] = await db.insert(batteryCompatibilityTable).values({
    batteryModelId: Number(batteryModelId),
    deviceName: deviceName.trim(),
    notes: notes?.trim() || null,
  }).returning();
  res.status(201).json(row);
});

// DELETE /battery-compat/:id
router.delete("/battery-compat/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [row] = await db.delete(batteryCompatibilityTable).where(eq(batteryCompatibilityTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

export default router;
