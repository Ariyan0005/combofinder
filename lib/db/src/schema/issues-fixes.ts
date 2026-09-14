import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const issuesFixesTable = pgTable("issues_fixes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  deviceBrand: text("device_brand"),
  deviceModel: text("device_model"),
  problemType: text("problem_type"), // Display | Battery | Charging | Software | Hardware | Other
  symptom: text("symptom"),
  solution: text("solution").notNull(),
  difficulty: text("difficulty").default("Medium"), // Easy | Medium | Hard | Expert
  tags: text("tags"),
  views: text("views").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type IssueFix = typeof issuesFixesTable.$inferSelect;
export type InsertIssueFix = typeof issuesFixesTable.$inferInsert;
