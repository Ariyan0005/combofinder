import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const repairCategoriesTable = pgTable("repair_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  laborCostDefault: text("labor_cost_default"),
  estimatedTime: text("estimated_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RepairCategory = typeof repairCategoriesTable.$inferSelect;
export type InsertRepairCategory = typeof repairCategoriesTable.$inferInsert;
