import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),   // tenant scope — null for legacy/admin-created rows
  type: text("type").notNull(), // Income | Expense | Refund | Payout
  category: text("category"), // Subscription | Repair | Parts | Salary | Other
  amount: text("amount").notNull(),
  currency: text("currency").default("USD").notNull(),
  description: text("description"),
  relatedId: text("related_id"), // repair id, subscription id, etc.
  relatedType: text("related_type"), // repair | subscription | expense
  paymentMethod: text("payment_method"),
  status: text("status").default("Completed"), // Completed | Pending | Failed | Refunded
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Transaction = typeof transactionsTable.$inferSelect;
export type InsertTransaction = typeof transactionsTable.$inferInsert;
