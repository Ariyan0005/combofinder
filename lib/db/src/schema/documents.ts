import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").default("General"), // General | Repair Guide | Manual | Technical | Other
  deviceBrand: text("device_brand"),
  deviceModel: text("device_model"),
  fileUrl: text("file_url"),
  fileSize: text("file_size"),
  description: text("description"),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Document = typeof documentsTable.$inferSelect;
export type InsertDocument = typeof documentsTable.$inferInsert;
