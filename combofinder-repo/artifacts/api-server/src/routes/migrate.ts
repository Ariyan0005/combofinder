/**
 * Migration endpoint — called once when a Free user upgrades to Pro.
 * Accepts bulk repairs, inventory, customers, ledger accounts+entries, and sales
 * exported from the user's local storage and inserts them into the server database.
 */
import { Router } from "express";
import { db, repairsTable, inventoryTable, customersTable, ledgerAccountsTable, ledgerEntriesTable, expensesTable, suppliersTable, inventoryCategoriesTable, supplierPurchasesTable, supplierPaymentsTable, salesTable, saleItemsTable } from "@workspace/db";

const router = Router();

router.post("/migrate", async (req: any, res: any) => {
  const userId: number | undefined = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const {
    repairs    = [],
    inventory  = [],
    customers  = [],
    ledger     = { accounts: [], entries: [] },
    sales      = [],
    expenses   = [],
    suppliers         = [],
    categories        = [],
    supplierPurchases = [],
    supplierPayments  = [],
  } = req.body ?? {};

  let migratedRepairs   = 0;
  let migratedInventory = 0;
  let migratedCustomers = 0;
  let migratedAccounts  = 0;
  let migratedEntries   = 0;
  let migratedExpenses   = 0;
  let migratedSuppliers  = 0;
  let migratedCategories        = 0;
  let migratedSupplierPurchases = 0;
  let migratedSupplierPayments  = 0;
  let migratedSales             = 0;
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

  // ── Expenses ─────────────────────────────────────────────────────────────────
  for (const exp of expenses) {
    try {
      const { id: _id, userId: _uid, ...data } = exp;
      await db.insert(expensesTable).values({
        userId,
        category:    data.category    ?? "Other",
        amount:      Number(data.amount) || 0,
        description: data.description ?? null,
        date:        data.date ?? new Date().toISOString().split("T")[0],
        createdAt:   data.createdAt ? new Date(data.createdAt) : new Date(),
      });
      migratedExpenses++;
    } catch (err: any) {
      errors.push(`Expense: ${err.message}`);
    }
  }


  // ── Suppliers ─────────────────────────────────────────────────────────────────
  const supplierIdMap: Record<number, number> = {};
  for (const s of suppliers) {
    try {
      const { id: oldSid, userId: _uid, ...data } = s;
      const [supplierRow] = await db.insert(suppliersTable).values({
        userId,
        name:          String(data.name ?? 'Unknown'),
        phone:         data.phone     ?? null,
        whatsapp:      data.whatsapp  ?? null,
        partTypes:     data.partTypes ?? null,
        notes:         data.notes     ?? null,
        isActive:      Boolean(data.isActive ?? true),
        createdAt:     data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt:     new Date(),
      });
      migratedSuppliers++;
    } catch (err: any) {
      errors.push(`Supplier: ${err.message}`);
    }
  }

  // ── Inventory Categories ───────────────────────────────────────────────────────
  // Build a map of old local category IDs → new server category IDs (for parentId remapping)
  const categoryIdMap: Record<number, number> = {};
  // Process parent categories first (parentId === null/undefined), then children
  const sortedCategories = [...categories].sort((a: any, b: any) => {
    if (!a.parentId && b.parentId) return -1;
    if (a.parentId && !b.parentId) return 1;
    return 0;
  });
  for (const cat of sortedCategories) {
    try {
      const { id: oldId, userId: _uid, ...data } = cat;
      const serverParentId = data.parentId ? (categoryIdMap[data.parentId] ?? null) : null;
      const [row] = await db.insert(inventoryCategoriesTable).values({
        userId,
        name:        String(data.name ?? 'Unknown'),
        description: data.description ?? null,
        parentId:    serverParentId,
        icon:        data.icon  ?? null,
        color:       data.color ?? null,
        createdAt:   data.createdAt ? new Date(data.createdAt) : new Date(),
      }).returning();
      if (row?.id && oldId !== undefined) categoryIdMap[oldId] = row.id;
      migratedCategories++;
    } catch (err: any) {
      errors.push(`Category: ${err.message}`);
    }
  }


  // ── Supplier Purchases ────────────────────────────────────────────────────────
  const purchaseIdMap: Record<number, number> = {};
  for (const p of supplierPurchases) {
    try {
      const { id: oldId, userId: _uid, supplierId: _sid, ...data } = p;
      // Remap supplierId using supplierIdMap if available
      const serverSupplierId = supplierIdMap?.[_sid] ?? _sid;
      const [row] = await db.insert(supplierPurchasesTable).values({
        userId,
        supplierId:    serverSupplierId,
        supplierName:  data.supplierName  ?? null,
        inventoryId:   data.inventoryId   ?? null,
        productName:   data.productName   ?? null,
        quantity:      Number(data.quantity ?? 1),
        totalAmount:   String(data.totalAmount ?? '0'),
        paidAmount:    String(data.paidAmount  ?? '0'),
        dueAmount:     String(data.dueAmount   ?? '0'),
        paymentStatus: data.paymentStatus  ?? 'credit',
        purchaseDate:  data.purchaseDate   ?? new Date().toISOString().split('T')[0],
        invoiceNumber: data.invoiceNumber  ?? null,
        notes:         data.notes          ?? null,
        createdAt:     data.createdAt  ? new Date(data.createdAt) : new Date(),
        updatedAt:     new Date(),
      }).returning();
      if (row?.id && oldId !== undefined) purchaseIdMap[oldId] = row.id;
      migratedSupplierPurchases++;
    } catch (err: any) {
      errors.push(`SupplierPurchase: ${err.message}`);
    }
  }

  // ── Supplier Payments ─────────────────────────────────────────────────────────
  for (const p of supplierPayments) {
    try {
      const { id: _id, userId: _uid, supplierId: _sid, ...data } = p;
      const serverSupplierId = supplierIdMap?.[_sid] ?? _sid;
      await db.insert(supplierPaymentsTable).values({
        userId,
        supplierId:    serverSupplierId,
        supplierName:  data.supplierName  ?? null,
        purchaseId:    data.purchaseId ? (purchaseIdMap[data.purchaseId] ?? null) : null,
        amount:        String(data.amount ?? '0'),
        paymentMethod: data.paymentMethod ?? 'cash',
        date:          data.date ?? new Date().toISOString().split('T')[0],
        notes:         data.notes ?? null,
        createdAt:     data.createdAt ? new Date(data.createdAt) : new Date(),
      });
      migratedSupplierPayments++;
    } catch (err: any) {
      errors.push(`SupplierPayment: ${err.message}`);
    }
  }

  // ── Sales / Invoices ──────────────────────────────────────────────────────────
  for (const s of sales) {
    try {
      const { id: _id, userId: _uid, items, returns, ...saleData } = s;
      const [newSale] = await db.insert(salesTable).values({
        userId,
        invoiceNumber: saleData.invoiceNumber ?? ('MIGR-' + Date.now() + '-' + migratedSales),
        customerId:    saleData.customerId   ?? null,
        customerName:  saleData.customerName ?? null,
        customerPhone: saleData.customerPhone ?? null,
        subtotal:      String(saleData.subtotal ?? '0'),
        discount:      String(saleData.discount ?? '0'),
        total:         String(saleData.total   ?? '0'),
        paymentMethod: saleData.paymentMethod ?? 'Cash',
        status:        saleData.status        ?? 'Completed',
        advancePaid:   String(saleData.advancePaid ?? '0'),
        notes:         saleData.notes ?? null,
        date:          saleData.date  ?? new Date().toISOString().split('T')[0],
        createdAt:     saleData.createdAt ? new Date(saleData.createdAt) : new Date(),
      }).returning();

      if (newSale?.id && Array.isArray(items)) {
        for (const item of items) {
          try {
            await db.insert(saleItemsTable).values({
              saleId:      newSale.id,
              inventoryId: item.inventoryId ?? null,
              partName:    item.partName    ?? 'Unknown',
              quantity:    Number(item.quantity  ?? 1),
              unitPrice:   String(item.unitPrice ?? '0'),
              total:       String(item.total     ?? '0'),
              returnedQuantity: 0,
            });
          } catch (_) {}
        }
      }
      migratedSales++;
    } catch (err: any) {
      errors.push('Sale: ' + err.message);
    }
  }

  res.json({
    success: true,
    migratedRepairs,
    migratedInventory,
    migratedCustomers,
    migratedAccounts,
    migratedEntries,
    migratedExpenses,
    migratedSuppliers,
    migratedCategories,
    migratedSupplierPurchases,
    migratedSupplierPayments,
    migratedSales,
    ...(errors.length > 0 && { warnings: errors }),
  });
});

export default router;
