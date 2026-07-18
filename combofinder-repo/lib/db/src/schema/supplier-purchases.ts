import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

// Records each purchase from a supplier (linked to a stock movement)
export const supplierPurchasesTable = pgTable("supplier_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  supplierId: integer("supplier_id").notNull(),
  supplierName: text("supplier_name"),
  stockMovementId: integer("stock_movement_id"), // optional link to stock movement
  inventoryId: integer("inventory_id"),
  productName: text("product_name"),
  quantity: integer("quantity").default(1).notNull(),
  totalAmount: text("total_amount").notNull(),   // মোট দাম
  paidAmount: text("paid_amount").notNull(),      // এখন পরিশোধ করা
  dueAmount: text("due_amount").notNull(),        // বাকি
  paymentStatus: text("payment_status").notNull().default("credit"), // "paid" | "partial" | "credit"
  purchaseDate: text("purchase_date").notNull(),
  invoiceNumber: text("invoice_number"),  // groups multiple items under one invoice
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Records each payment made to a supplier (to reduce dues)
export const supplierPaymentsTable = pgTable("supplier_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  supplierId: integer("supplier_id").notNull(),
  supplierName: text("supplier_name"),
  purchaseId: integer("purchase_id"), // optional — can be a general payment against dues
  amount: text("amount").notNull(),
  paymentMethod: text("payment_method").default("cash"), // "cash" | "bank" | "mobile_banking" | "other"
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SupplierPurchase = typeof supplierPurchasesTable.$inferSelect;
export type InsertSupplierPurchase = typeof supplierPurchasesTable.$inferInsert;
export type SupplierPayment = typeof supplierPaymentsTable.$inferSelect;
export type InsertSupplierPayment = typeof supplierPaymentsTable.$inferInsert;
