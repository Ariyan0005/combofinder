import { boolean, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { modelsTable } from "./models";

export const schematicsTable = pgTable("schematics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug"),
  modelId: integer("model_id").references(() => modelsTable.id, { onDelete: "set null" }),
  deviceBrand: text("device_brand"),
  deviceModel: text("device_model"),
  schematicType: text("schematic_type").default("Motherboard"), // Motherboard | Display | Battery | Charging | Other
  fileUrl: text("file_url"),
  thumbnailUrl: text("thumbnail_url"),
  fileSize: text("file_size"),
  tags: text("tags"),
  notes: text("notes"),
  component: text("component"),
  pinNumber: text("pin_number"),
  pinName: text("pin_name"),
  voltage: text("voltage"),
  ground: text("ground"),
  signalInfo: text("signal_info"),
  testPointInfo: text("test_point_info"),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  slugIdx: index("schematics_slug_idx").on(table.slug),
  modelIdx: index("schematics_model_id_idx").on(table.modelId),
  publishedIdx: index("schematics_published_idx").on(table.isPublished),
  typeIdx: index("schematics_type_idx").on(table.schematicType),
}));

export type Schematic = typeof schematicsTable.$inferSelect;
export type InsertSchematic = typeof schematicsTable.$inferInsert;
