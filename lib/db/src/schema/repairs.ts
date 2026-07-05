import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const repairsTable = pgTable("repairs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  phoneBrand: text("phone_brand").notNull(),
  phoneModel: text("phone_model").notNull(),
  imei: text("imei"),
  problem: text("problem").notNull(),
  status: text("status").notNull().default("Waiting"),
  engineer: text("engineer"),
  partsUsed: text("parts_used"),
  laborCost: text("labor_cost"),
  partsCost: text("parts_cost"),
  totalCost: text("total_cost"),
  advancePaid: text("advance_paid"),
  notes: text("notes"),
  warrantyDays: integer("warranty_days").default(0),
  isPaid: boolean("is_paid").default(false).notNull(),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Repair = typeof repairsTable.$inferSelect;
export type InsertRepair = typeof repairsTable.$inferInsert;
