import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const inventoryCategoriesTable = pgTable("inventory_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InventoryCategory = typeof inventoryCategoriesTable.$inferSelect;
export type InsertInventoryCategory = typeof inventoryCategoriesTable.$inferInsert;
