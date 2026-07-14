import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { modelsTable } from "./models";

export const compatibilitiesTable = pgTable("compatibilities", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").notNull().references(() => modelsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  comboType: text("combo_type").notNull(),
  qualityGrade: text("quality_grade"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCompatibilitySchema = createInsertSchema(compatibilitiesTable).omit({ id: true, createdAt: true });
export type InsertCompatibility = z.infer<typeof insertCompatibilitySchema>;
export type Compatibility = typeof compatibilitiesTable.$inferSelect;
