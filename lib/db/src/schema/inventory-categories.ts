import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const inventoryCategoriesTable = pgTable("inventory_categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  parentId: integer("parent_id"),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InventoryCategory = typeof inventoryCategoriesTable.$inferSelect;
export type InsertInventoryCategory = typeof inventoryCategoriesTable.$inferInsert;
