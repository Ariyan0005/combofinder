import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const suppliersTable = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  whatsapp: text("whatsapp"),
  address: text("address"),
  country: text("country"),
  website: text("website"),
  partTypes: text("part_types"), // comma-separated: Displays, Batteries, ICs
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  rating: text("rating"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Supplier = typeof suppliersTable.$inferSelect;
export type InsertSupplier = typeof suppliersTable.$inferInsert;
