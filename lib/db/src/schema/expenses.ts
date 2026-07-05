import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const expensesTable = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  category: text("category").notNull(),
  amount: text("amount").notNull(),
  description: text("description"),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Expense = typeof expensesTable.$inferSelect;
export type InsertExpense = typeof expensesTable.$inferInsert;
