import { pgTable, serial, text, timestamp, boolean, integer, numeric } from "drizzle-orm/pg-core";

export const partsSuppliersTable = pgTable("parts_suppliers", {
  id:          serial("id").primaryKey(),
  name:        text("name").notNull(),
  country:     text("country").notNull(),
  city:        text("city").notNull(),
  whatsapp:    text("whatsapp"),
  partTypes:   text("part_types"),  // comma-separated e.g. "LCD,Battery,IC"
  website:     text("website"),
  isVerified:  boolean("is_verified").default(false).notNull(),
  isActive:    boolean("is_active").default(true).notNull(),
  avgRating:   numeric("avg_rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0).notNull(),
  sortOrder:   integer("sort_order").default(0).notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});

export type PartsSupplier       = typeof partsSuppliersTable.$inferSelect;
export type InsertPartsSupplier = typeof partsSuppliersTable.$inferInsert;

export const supplierReviewsTable = pgTable("supplier_reviews", {
  id:         serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  userId:     integer("user_id"),   // nullable — allows guest reviews in the future
  rating:     integer("rating").notNull(),   // 1-5
  comment:    text("comment"),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});

export type SupplierReview       = typeof supplierReviewsTable.$inferSelect;
export type InsertSupplierReview = typeof supplierReviewsTable.$inferInsert;
