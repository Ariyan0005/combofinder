import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

// Records every stock change: purchase (in), sale, repair use (out), manual adjustment
export const stockMovementsTable = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),   // tenant scope — null for legacy rows
  inventoryId: integer("inventory_id").notNull(),
  type: text("type").notNull(), // "in" | "sale" | "out" | "adjustment"
  quantity: integer("quantity").notNull(),          // always positive; type tells direction
  supplierId: integer("supplier_id"),               // for "in" movements
  supplierName: text("supplier_name"),              // denormalized for quick display
  unitPrice: text("unit_price"),
  totalPrice: text("total_price"),
  notes: text("notes"),
  reference: text("reference"),                     // e.g. "Repair #42", "Walk-in sale"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StockMovement = typeof stockMovementsTable.$inferSelect;
export type InsertStockMovement = typeof stockMovementsTable.$inferInsert;
