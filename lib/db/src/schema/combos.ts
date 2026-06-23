import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { modelsTable } from "./models";

export const combosTable = pgTable("combos", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").notNull().references(() => modelsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  comboType: text("combo_type").notNull(),
  qualityGrade: text("quality_grade"),
  notes: text("notes"),
  priceRange: text("price_range"),
  inStock: boolean("in_stock").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertComboSchema = createInsertSchema(combosTable).omit({ id: true, createdAt: true });
export type InsertCombo = z.infer<typeof insertComboSchema>;
export type Combo = typeof combosTable.$inferSelect;
