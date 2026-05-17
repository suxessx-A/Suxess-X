import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
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
