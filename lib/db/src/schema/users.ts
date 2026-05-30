import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Allowed values for subscriptionTier. Enforced in application code at write
// time (no pg CHECK constraint) so we can add tiers without a destructive
// migration. v1.2 introduces paidStatus + subscriptionTier as the canonical
// premium model; the legacy isPremium / isPremiumPlus booleans are kept in
// sync by every write path until the frontend is migrated.
export const SUBSCRIPTION_TIERS = ["none", "premium", "premium_plus"] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export const users = pgTable("users", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  email: text("email").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  paidStatus: boolean("paid_status").notNull().default(false),
  subscriptionTier: text("subscription_tier").notNull().default("none"),
  isPremium: boolean("is_premium").notNull().default(false),
  isPremiumPlus: boolean("is_premium_plus").notNull().default(false),
  name: text("name"),
  industry: text("industry"),
  level: text("level"),
  challenge: text("challenge"),
  goal: text("goal"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
