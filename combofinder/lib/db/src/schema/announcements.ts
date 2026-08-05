import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const announcementsTable = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  targetType: text("target_type").default("All"), // All | Free | Pro | Business | Lifetime
  priority: text("priority").default("Normal"), // Low | Normal | High | Critical
  isPublished: boolean("is_published").default(false).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Announcement = typeof announcementsTable.$inferSelect;
export type InsertAnnouncement = typeof announcementsTable.$inferInsert;
