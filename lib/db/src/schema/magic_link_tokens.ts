import { pgTable, text, varchar, timestamp, boolean, index, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// One-time sign-in codes / links issued by POST /api/auth/request-link and
// consumed by POST /api/auth/verify. Tokens expire 15 minutes after issue and
// the row is marked used=true on a successful verify.
export const magicLinkTokens = pgTable(
  "magic_link_tokens",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userEmail: text("user_email").notNull(),
    urlToken: text("url_token").notNull().unique(),
    code: varchar("code", { length: 6 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    used: boolean("used").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Lookup path for /verify and the rate limiter: every read filters by
    // user_email plus a freshness predicate, so this composite covers both.
    lookupIdx: index("magic_link_tokens_lookup_idx").on(
      table.userEmail,
      table.used,
      table.expiresAt,
    ),
  }),
);

export const insertMagicLinkTokenSchema = createInsertSchema(magicLinkTokens).omit({
  id: true,
  createdAt: true,
});
export type InsertMagicLinkToken = z.infer<typeof insertMagicLinkTokenSchema>;
export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
