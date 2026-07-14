import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const ledgerAccountsTable = pgTable("ledger_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ledgerEntriesTable = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountId: integer("account_id").notNull(),
  type: text("type").notNull(), // credit | debit
  amount: text("amount").notNull(),
  itemName: text("item_name"),
  description: text("description"),
  reference: text("reference"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LedgerAccount = typeof ledgerAccountsTable.$inferSelect;
export type InsertLedgerAccount = typeof ledgerAccountsTable.$inferInsert;
export type LedgerEntry = typeof ledgerEntriesTable.$inferSelect;
export type InsertLedgerEntry = typeof ledgerEntriesTable.$inferInsert;
