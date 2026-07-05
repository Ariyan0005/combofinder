import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

// A POS sale (invoice) — one per checkout, may contain multiple line items
export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: integer("customer_id"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  subtotal: text("subtotal").notNull(),
  discount: text("discount").default("0").notNull(),
  total: text("total").notNull(),
  paymentMethod: text("payment_method").default("Cash").notNull(), // Cash | Card | Mobile Banking | Other
  status: text("status").default("Completed").notNull(), // Completed | Returned | Partially Returned
  notes: text("notes"),
  date: text("date").notNull(), // YYYY-MM-DD for easy date-wise filtering/export
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Sale = typeof salesTable.$inferSelect;
export type InsertSale = typeof salesTable.$inferInsert;

// Individual line item within a sale
export const saleItemsTable = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull(),
  inventoryId: integer("inventory_id"),
  partName: text("part_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: text("unit_price").notNull(),
  total: text("total").notNull(),
  returnedQuantity: integer("returned_quantity").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SaleItem = typeof saleItemsTable.$inferSelect;
export type InsertSaleItem = typeof saleItemsTable.$inferInsert;

// A return/refund event against a sale — one row per return transaction (may cover multiple items)
export const saleReturnsTable = pgTable("sale_returns", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull(),
  saleItemId: integer("sale_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  refundAmount: text("refund_amount").notNull(),
  reason: text("reason"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SaleReturn = typeof saleReturnsTable.$inferSelect;
export type InsertSaleReturn = typeof saleReturnsTable.$inferInsert;
