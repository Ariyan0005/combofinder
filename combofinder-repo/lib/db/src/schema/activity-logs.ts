import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  actor: text("actor").notNull(), // username or "System"
  actorType: text("actor_type").default("Admin"), // Admin | System | User
  action: text("action").notNull(), // Created | Updated | Deleted | Logged In | etc.
  entity: text("entity"), // Brand | Model | User | Repair | etc.
  entityId: text("entity_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogsTable.$inferSelect;
export type InsertActivityLog = typeof activityLogsTable.$inferInsert;
