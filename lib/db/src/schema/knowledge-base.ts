import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const knowledgeBaseTable = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull().default("Repair Tips"), // Repair Tips | Schematics | Videos | PDF
  content: text("content"),
  deviceBrand: text("device_brand"),
  deviceModel: text("device_model"),
  fileUrl: text("file_url"),
  videoUrl: text("video_url"),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type KnowledgeBaseItem = typeof knowledgeBaseTable.$inferSelect;
export type InsertKnowledgeBaseItem = typeof knowledgeBaseTable.$inferInsert;
