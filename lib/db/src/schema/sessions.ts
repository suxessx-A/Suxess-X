import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  flowType: text("flow_type").notNull(),
  problemType: text("problem_type"),
  strategy: text("strategy"),
  answers: jsonb("answers"),
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  createdAt: true,
});
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
