import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const partCategoriesTable = pgTable("part_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPartCategorySchema = createInsertSchema(partCategoriesTable).omit({ id: true, createdAt: true });
export type InsertPartCategory = z.infer<typeof insertPartCategorySchema>;
export type PartCategory = typeof partCategoriesTable.$inferSelect;
