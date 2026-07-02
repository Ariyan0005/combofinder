import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const expensesTable = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // Rent | Utilities | Supplies | Salaries | Equipment | Other
  amount: text("amount").notNull(),
  description: text("description"),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Expense = typeof expensesTable.$inferSelect;
export type InsertExpense = typeof expensesTable.$inferInsert;
