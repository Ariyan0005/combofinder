/**
 * Migration endpoint — called once when a Free user upgrades to Pro.
 * Accepts bulk repairs + inventory exported from the user's local storage
 * and inserts them into the server database.
 */
import { Router } from "express";
import { db, repairsTable, inventoryTable } from "@workspace/db";

const router = Router();

router.post("/migrate", async (req: any, res: any) => {
  const userId: number | undefined = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { repairs = [], inventory = [] } = req.body ?? {};

  if (!Array.isArray(repairs) || !Array.isArray(inventory)) {
    return res.status(400).json({ error: "repairs and inventory must be arrays" });
  }

  let migratedRepairs = 0;
  let migratedInventory = 0;
  const errors: string[] = [];

  // ── Repairs ─────────────────────────────────────────────────────────────────
  for (const r of repairs) {
    try {
      const { id: _id, userId: _uid, ...data } = r;
      await db.insert(repairsTable).values({
        userId,
        customerName:  String(data.customerName  ?? "Unknown"),
        customerPhone: String(data.customerPhone ?? ""),
        phoneBrand:    String(data.phoneBrand    ?? ""),
        phoneModel:    String(data.phoneModel    ?? ""),
        imei:          data.imei ?? null,
        problem:       String(data.problem       ?? ""),
        status:        String(data.status        ?? "Repairing"),
        engineer:      data.engineer      ?? null,
        partsUsed:     data.partsUsed    ?? null,
        laborCost:     data.laborCost    ?? null,
        partsCost:     data.partsCost    ?? null,
        totalCost:     data.totalCost    ?? null,
        advancePaid:   data.advancePaid  ?? null,
        isPaid:        Boolean(data.isPaid),
        notes:         data.notes        ?? null,
        warrantyDays:  Number(data.warrantyDays) || 0,
        createdAt:     data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt:     new Date(),
      });
      migratedRepairs++;
    } catch (err: any) {
      errors.push(`Repair: ${err.message}`);
    }
  }

  // ── Inventory ────────────────────────────────────────────────────────────────
  for (const item of inventory) {
    try {
      const { id: _id, userId: _uid, ...data } = item;
      await db.insert(inventoryTable).values({
        userId,
        partName:      String(data.partName ?? "Unknown"),
        partType:      String(data.partType ?? "General"),
        brand:         data.brand    ?? null,
        model:         data.model    ?? null,
        quality:       data.quality  ?? "Compatible",
        quantity:      Number(data.quantity) || 0,
        minStock:      Number(data.minStock) || 2,
        purchasePrice: data.purchasePrice ?? null,
        sellingPrice:  data.sellingPrice  ?? null,
        categoryId:    data.categoryId ? Number(data.categoryId) : null,
        barcode:       data.barcode ?? null,
        sku:           data.sku     ?? null,
        notes:         data.notes   ?? null,
        createdAt:     data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt:     new Date(),
      });
      migratedInventory++;
    } catch (err: any) {
      errors.push(`Inventory: ${err.message}`);
    }
  }

  res.json({
    success: true,
    migratedRepairs,
    migratedInventory,
    ...(errors.length > 0 && { warnings: errors }),
  });
});

export default router;
