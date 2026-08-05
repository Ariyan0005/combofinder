import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const schematicsTable = pgTable("schematics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  deviceBrand: text("device_brand"),
  deviceModel: text("device_model"),
  schematicType: text("schematic_type").default("Motherboard"), // Motherboard | Display | Battery | Charging | Other
  fileUrl: text("file_url"),
  thumbnailUrl: text("thumbnail_url"),
  fileSize: text("file_size"),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Schematic = typeof schematicsTable.$inferSelect;
export type InsertSchematic = typeof schematicsTable.$inferInsert;
