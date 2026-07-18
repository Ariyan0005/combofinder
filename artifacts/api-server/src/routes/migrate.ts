/**
 * Migration endpoint — called once when a Free user upgrades to Pro.
 * Accepts bulk repairs, inventory, customers, ledger accounts+entries, and sales
 * exported from the user's local storage and inserts them into the server database.
 */
import { Router } from "express";
import { db, repairsTable, inventoryTable, customersTable, ledgerAccountsTable, ledgerEntriesTable } from "@workspace/db";

const router = Router();

router.post("/migrate", async (req: any, res: any) => {
  const userId: number | undefined = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const {
    repairs   = [],
    inventory = [],
    customers = [],
    ledger    = { accounts: [], entries: [] },
    sales     = [],
  } = req.body ?? {};

  let migratedRepairs   = 0;
  let migratedInventory = 0;
  let migratedCustomers = 0;
  let migratedAccounts  = 0;
  let migratedEntries   = 0;
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

  // ── Customers ────────────────────────────────────────────────────────────────
  for (const c of customers) {
    try {
      const { id: _id, userId: _uid, totalRepairs: _tr, repairDue: _rd, creditDue: _cd, ...data } = c;
      await db.insert(customersTable).values({
        userId,
        name:     String(data.name ?? "Unknown"),
        phone:    data.phone    ?? null,
        whatsapp: data.whatsapp ?? null,
        notes:    data.notes    ?? null,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      });
      migratedCustomers++;
    } catch (err: any) {
      errors.push(`Customer: ${err.message}`);
    }
  }

  // ── Ledger Accounts + Entries ─────────────────────────────────────────────────
  // Build a map of old local account IDs → new server account IDs
  const accountIdMap: Record<number, number> = {};
  const ledgerAccounts = Array.isArray(ledger?.accounts) ? ledger.accounts : [];
  const ledgerEntries  = Array.isArray(ledger?.entries)  ? ledger.entries  : [];

  for (const acc of ledgerAccounts) {
    try {
      const { id: oldId, userId: _uid, creditSum: _cs, debitSum: _ds, balance: _b, entries: _e, ...data } = acc;
      const [row] = await db.insert(ledgerAccountsTable).values({
        userId,
        name:    String(data.name ?? "Unknown"),
        phone:   data.phone   ?? null,
        email:   data.email   ?? null,
        address: data.address ?? null,
        notes:   data.notes   ?? null,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      }).returning();
      if (row?.id && oldId !== undefined) accountIdMap[oldId] = row.id;
      migratedAccounts++;
    } catch (err: any) {
      errors.push(`Ledger account: ${err.message}`);
    }
  }

  for (const entry of ledgerEntries) {
    try {
      const { id: _id, userId: _uid, ...data } = entry;
      const serverAccountId = accountIdMap[data.accountId];
      if (!serverAccountId) {
        errors.push(`Ledger entry: no matching account for accountId ${data.accountId}`);
        continue;
      }
      await db.insert(ledgerEntriesTable).values({
        userId,
        accountId:   serverAccountId,
        type:        data.type === "credit" ? "credit" : "debit",
        amount:      String(Number(data.amount) || 0),
        itemName:    data.itemName    ?? null,
        description: data.description ?? null,
        reference:   data.reference   ?? null,
        date:        data.date ? new Date(data.date) : new Date(),
        createdAt:   data.createdAt ? new Date(data.createdAt) : new Date(),
      });
      migratedEntries++;
    } catch (err: any) {
      errors.push(`Ledger entry: ${err.message}`);
    }
  }

  // ── Sales / Invoices — logged but not migrated (complex schema with items) ───
  const skippedSales = Array.isArray(sales) ? sales.length : 0;

  res.json({
    success: true,
    migratedRepairs,
    migratedInventory,
    migratedCustomers,
    migratedAccounts,
    migratedEntries,
    ...(skippedSales > 0 && { note: `${skippedSales} local invoices were not migrated (POS invoices require manual entry on Pro)` }),
    ...(errors.length > 0 && { warnings: errors }),
  });
});

export default router;
