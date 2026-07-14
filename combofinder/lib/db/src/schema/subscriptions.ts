import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  plan: text("plan").notNull(), // Free | Pro | Business | Lifetime
  price: text("price").notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").notNull().default("Paid"), // Paid | Pending | Cancelled | Refunded
  billingCycle: text("billing_cycle").default("Monthly"), // Monthly | Yearly | Lifetime
  startDate: text("start_date"),
  endDate: text("end_date"),
  transactionId: text("transaction_id"),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Subscription = typeof subscriptionsTable.$inferSelect;
export type InsertSubscription = typeof subscriptionsTable.$inferInsert;
