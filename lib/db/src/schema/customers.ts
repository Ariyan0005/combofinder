import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  notes: text("notes"),
  totalRepairs: integer("total_repairs").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Customer = typeof customersTable.$inferSelect;
export type InsertCustomer = typeof customersTable.$inferInsert;
