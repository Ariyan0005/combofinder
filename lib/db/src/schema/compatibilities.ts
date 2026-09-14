import { boolean, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { modelsTable } from "./models";

export const compatibilitiesTable = pgTable("compatibilities", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").notNull().references(() => modelsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  comboType: text("combo_type").notNull(),
  partType: text("part_type"),
  qualityGrade: text("quality_grade"),
  notes: text("notes"),
  imageUrl: text("image_url"),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  modelIdx: index("compatibilities_model_id_idx").on(table.modelId),
  publishedIdx: index("compatibilities_published_idx").on(table.isPublished),
  partTypeIdx: index("compatibilities_part_type_idx").on(table.partType),
}));

export const insertCompatibilitySchema = createInsertSchema(compatibilitiesTable).omit({ id: true, createdAt: true });
export type InsertCompatibility = z.infer<typeof insertCompatibilitySchema>;
export type Compatibility = typeof compatibilitiesTable.$inferSelect;
