import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { brandsTable } from "./brands";

// IC chip model numbers (e.g. PM8150, SM8350, 338S00309)
export const icModelsTable = pgTable("ic_models", {
  id: serial("id").primaryKey(),
  brandId: integer("brand_id").notNull().references(() => brandsTable.id, { onDelete: "cascade" }),
  icNumber: text("ic_number").notNull(),      // e.g. "PM8150"
  description: text("description"),           // e.g. "Power Management IC"
  package: text("package"),                   // e.g. "BGA", "QFN"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Devices compatible with a given IC
export const icCompatibilityTable = pgTable("ic_compatibility", {
  id: serial("id").primaryKey(),
  icModelId: integer("ic_model_id").notNull().references(() => icModelsTable.id, { onDelete: "cascade" }),
  deviceName: text("device_name").notNull(),  // e.g. "Samsung Galaxy S21"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type IcModel = typeof icModelsTable.$inferSelect;
export type InsertIcModel = typeof icModelsTable.$inferInsert;
export type IcCompatibility = typeof icCompatibilityTable.$inferSelect;
export type InsertIcCompatibility = typeof icCompatibilityTable.$inferInsert;
