import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash"),
  accountType: text("account_type").notNull().default("Free Technician"), // Free Technician | Pro Technician | Shop Owner | Admin
  subscriptionPlan: text("subscription_plan").default("Free"), // Free | Pro | Business | Lifetime
  subscriptionStatus: text("subscription_status").default("active"), // active | expired | cancelled
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  country: text("country"),
  shopName: text("shop_name"),
  isActive: boolean("is_active").default(true).notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
