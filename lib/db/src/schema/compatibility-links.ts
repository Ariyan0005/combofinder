import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { compatibilityCategoriesTable } from "./compatibility-categories";
import { modelsTable } from "./models";

// Within a category, `modelId` is compatible with `compatibleModelId`.
// e.g. category="Display", modelId=Galaxy A12, compatibleModelId=Galaxy A12 Nacho.
// One row per pair. No price/stock/quality here — that lives in Inventory.
export const compatibilityLinksTable = pgTable(
  "compatibility_links",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => compatibilityCategoriesTable.id, { onDelete: "cascade" }),
    modelId: integer("model_id")
      .notNull()
      .references(() => modelsTable.id, { onDelete: "cascade" }),
    compatibleModelId: integer("compatible_model_id")
      .notNull()
      .references(() => modelsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.categoryId, table.modelId, table.compatibleModelId)]
);

export const insertCompatibilityLinkSchema = createInsertSchema(compatibilityLinksTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCompatibilityLink = z.infer<typeof insertCompatibilityLinkSchema>;
export type CompatibilityLink = typeof compatibilityLinksTable.$inferSelect;
