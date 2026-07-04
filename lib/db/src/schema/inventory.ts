import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const inventoryTable = pgTable("inventory", {
  id: serial("id").primaryKey(),
  partName: text("part_name").notNull(),
  partType: text("part_type").notNull(),
  brand: text("brand"),
  model: text("model"),
  quality: text("quality").default("Compatible"), // Original | OEM | Copy | Refurbished
  quantity: integer("quantity").default(0).notNull(),
  minStock: integer("min_stock").default(2).notNull(),
  purchasePrice: text("purchase_price"),
  sellingPrice: text("selling_price"),
  // NEW: supplier link, category link, barcode/SKU for scan
  supplierId: integer("supplier_id"),
  categoryId: integer("category_id"),
  barcode: text("barcode"),
  sku: text("sku"),
  supplier: text("supplier"),      // legacy plain-text supplier name (kept for compat)
  shelfLocation: text("shelf_location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InventoryItem = typeof inventoryTable.$inferSelect;
export type InsertInventoryItem = typeof inventoryTable.$inferInsert;
