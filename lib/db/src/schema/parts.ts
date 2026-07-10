import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { partCategoriesTable } from "./part-categories";
import { modelsTable } from "./models";

export const partsTable = pgTable("parts", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => partCategoriesTable.id, { onDelete: "cascade" }),
  modelId: integer("model_id").notNull().references(() => modelsTable.id, { onDelete: "cascade" }),
  partName: text("part_name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPartSchema = createInsertSchema(partsTable).omit({ id: true, createdAt: true });
export type InsertPart = z.infer<typeof insertPartSchema>;
export type Part = typeof partsTable.$inferSelect;
