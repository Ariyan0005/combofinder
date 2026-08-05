import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

// Stores the latest local-data backup for each free-plan user.
// Overwritten on every save — one row per user.
export const userBackupsTable = pgTable("user_backups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  data: text("data").notNull(),           // full JSON snapshot
  itemCounts: text("item_counts"),        // JSON summary for UI preview
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserBackup = typeof userBackupsTable.$inferSelect;
export type InsertUserBackup = typeof userBackupsTable.$inferInsert;
