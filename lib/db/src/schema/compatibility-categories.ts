import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Top-level part type (e.g. Display, Battery, Charging Board).
// A user must pick one of these before any compatibility data loads.
export const compatibilityCategoriesTable = pgTable("compatibility_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCompatibilityCategorySchema = createInsertSchema(compatibilityCategoriesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCompatibilityCategory = z.infer<typeof insertCompatibilityCategorySchema>;
export type CompatibilityCategory = typeof compatibilityCategoriesTable.$inferSelect;
