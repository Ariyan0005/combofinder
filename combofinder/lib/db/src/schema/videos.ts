import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const videosTable = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").default("Repair Tutorial"), // Repair Tutorial | Tips & Tricks | Tools | Other
  deviceBrand: text("device_brand"),
  deviceModel: text("device_model"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  duration: text("duration"),
  description: text("description"),
  tags: text("tags"),
  views: text("views").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Video = typeof videosTable.$inferSelect;
export type InsertVideo = typeof videosTable.$inferInsert;
