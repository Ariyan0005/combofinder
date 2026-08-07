import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { brandsTable } from "./brands";

// Battery model numbers (e.g. EB-BG988ABY, BN59-01385A)
export const batteryModelsTable = pgTable("battery_models", {
  id: serial("id").primaryKey(),
  brandId: integer("brand_id").notNull().references(() => brandsTable.id, { onDelete: "cascade" }),
  modelNumber: text("model_number").notNull(),   // e.g. "EB-BG988ABY"
  capacity: text("capacity"),                    // e.g. "5000mAh"
  voltage: text("voltage"),                      // e.g. "3.85V"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Devices compatible with a given battery model
export const batteryCompatibilityTable = pgTable("battery_compatibility", {
  id: serial("id").primaryKey(),
  batteryModelId: integer("battery_model_id").notNull().references(() => batteryModelsTable.id, { onDelete: "cascade" }),
  deviceName: text("device_name").notNull(),     // e.g. "Samsung Galaxy S21"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BatteryModel = typeof batteryModelsTable.$inferSelect;
export type InsertBatteryModel = typeof batteryModelsTable.$inferInsert;
export type BatteryCompatibility = typeof batteryCompatibilityTable.$inferSelect;
export type InsertBatteryCompatibility = typeof batteryCompatibilityTable.$inferInsert;
