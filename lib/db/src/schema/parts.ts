import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const partsTable = pgTable("parts", {
  id: serial("id").primaryKey(),
  icNumber: text("ic_number").notNull().unique(),
  partName: text("part_name").notNull(),
  partType: text("part_type").notNull(),
  compatibleModels: text("compatible_models").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPartSchema = createInsertSchema(partsTable).omit({ id: true, createdAt: true });
export type InsertPart = z.infer<typeof insertPartSchema>;
export type Part = typeof partsTable.$inferSelect;
