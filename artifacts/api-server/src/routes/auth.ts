import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { SignJWT } from "jose";
import { and, count, eq, gt } from "drizzle-orm";
import {
  db,
  magicLinkTokens,
  users,
  type SubscriptionTier,
} from "@workspace/db";
import { sendMagicLinkEmail } from "../lib/email";

const router: IRouter = Router();

// Apple App Review escape hatch. The reviewer signs in with this email plus
// the hardcoded code 111111; verify always succeeds for that pair and the
// account is force-promoted to premium_plus so the full app is exercisable
// without a real Stripe payment. The request-link endpoint still inserts a
// real token row for this email so the regular code/url_token path also
// works, but the email send is skipped to avoid bouncing on a non-existent
// inbox.
const REVIEWER_EMAIL = "apple-review@amplify-x.co";
const REVIEWER_CODE = "111111";

const TOKEN_TTL_MS = 15 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const SESSION_TTL = "30d";

// Permissive email shape check. We do not validate deliverability here; that
// is Resend's job, and the rate limiter caps abuse from junk addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateCode(): string {
  // Cryptographically random 6-digit code, 000000-999999, zero-padded.
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, "0");
}

function generateUrlToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function deepLinkUrl(email: string, urlToken: string): string {
  const base = process.env.APP_DEEP_LINK_BASE ?? "amplifyx://verify";
  const u = new URL(base);
  u.searchParams.set("email", email);
  u.searchParams.set("token", urlToken);
  return u.toString();
}

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function signSessionToken(email: string): Promise<string> {
  const secret = getSessionSecret();
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secret);
}

/**
 * Issue a magic-link sign-in for an email: inserts a fresh token row and
 * sends the email via Resend (unless skipEmail is set, used for the reviewer
 * account). Exported so the Stripe webhook can fire a welcome link inline
 * after checkout without an internal HTTP round-trip.
 */
export async function issueMagicLinkForEmail(
  email: string,
  options: { skipEmail?: boolean } = {},
): Promise<{ code: string; urlToken: string }> {
  const code = generateCode();
  const urlToken = generateUrlToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await db.insert(magicLinkTokens).values({
    userEmail: email,
    urlToken,
    code,
    expiresAt,
  });
  if (!options.skipEmail) {
    const url = deepLinkUrl(email, urlToken);
    await sendMagicLinkEmail({ to: email, code, url });
  }
  return { code, urlToken };
}

router.post("/request-link", async (req, res) => {
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: "Invalid email" });
    return;
  }

  try {
    // Rate limit: max 5 issued tokens per email per rolling hour.
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recent = await db
      .select({ value: count() })
      .from(magicLinkTokens)
      .where(
        and(
          eq(magicLinkTokens.userEmail, email),
          gt(magicLinkTokens.createdAt, since),
        ),
      );
    const recentCount = Number(recent[0]?.value ?? 0);
    if (recentCount >= RATE_LIMIT_MAX) {
      res.setHeader("Retry-After", "3600");
      res.status(429).json({ error: "Too many requests, please try again later." });
      return;
    }

    // Reviewer email: still create the token row so the regular code/url_token
    // path could be used, but skip the actual email send to avoid Resend errors
    // on a mailbox that may not exist.
    const skipEmail = email === REVIEWER_EMAIL;
    await issueMagicLinkForEmail(email, { skipEmail });

    res.json({ success: true, message: "Check your email" });
  } catch (err) {
    req.log.error({ err, email }, "Failed to issue magic link");
    res.status(500).json({ error: "Failed to send link" });
  }
});

router.post("/verify", async (req, res) => {
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : undefined;
  const urlToken =
    typeof req.body?.url_token === "string" ? req.body.url_token.trim() : undefined;

  if (!email || !EMAIL_RE.test(email)) {
    res.status(401).json({ error: "Invalid or expired code" });
    return;
  }
  if (!code && !urlToken) {
    res.status(401).json({ error: "Invalid or expired code" });
    return;
  }

  try {
    const isReviewer = email === REVIEWER_EMAIL && code === REVIEWER_CODE;
    let acceptedTokenId: string | null = null;

    if (!isReviewer) {
      // Find an active token for this email; match in app code against either
      // the supplied code or url_token. There can be up to RATE_LIMIT_MAX
      // active rows for a single email, so an in-memory scan is fine.
      const now = new Date();
      const rows = await db
        .select()
        .from(magicLinkTokens)
        .where(
          and(
            eq(magicLinkTokens.userEmail, email),
            eq(magicLinkTokens.used, false),
            gt(magicLinkTokens.expiresAt, now),
          ),
        )
        .limit(50);

      const match = rows.find((r) => {
        if (code && r.code === code) return true;
        if (urlToken && r.urlToken === urlToken) return true;
        return false;
      });

      if (!match) {
        res.status(401).json({ error: "Invalid or expired code" });
        return;
      }
      acceptedTokenId = match.id;
    }

    if (acceptedTokenId) {
      await db
        .update(magicLinkTokens)
        .set({ used: true })
        .where(eq(magicLinkTokens.id, acceptedTokenId));
    }

    // Upsert user. Reviewer is force-promoted to premium_plus regardless of
    // prior state; normal first-time sign-in creates the user with no paid
    // status (paid_status is set by the Stripe webhook).
    const tier: SubscriptionTier = isReviewer ? "premium_plus" : "none";
    const paid = isReviewer;

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let user;
    if (existing.length === 0) {
      const inserted = await db
        .insert(users)
        .values({
          email,
          paidStatus: paid,
          subscriptionTier: tier,
          isPremium: paid,
          isPremiumPlus: isReviewer,
        })
        .returning();
      user = inserted[0];
    } else if (isReviewer) {
      const updated = await db
        .update(users)
        .set({
          paidStatus: true,
          subscriptionTier: "premium_plus",
          isPremium: true,
          isPremiumPlus: true,
          updatedAt: new Date(),
        })
        .where(eq(users.email, email))
        .returning();
      user = updated[0];
    } else {
      user = existing[0];
    }

    if (!user) {
      throw new Error("User upsert returned no row");
    }

    const sessionToken = await signSessionToken(email);
    res.json({
      session_token: sessionToken,
      user: {
        email: user.email,
        paid_status: user.paidStatus,
        subscription_tier: user.subscriptionTier,
      },
    });
  } catch (err) {
    req.log.error({ err, email }, "Verify failed");
    res.status(500).json({ error: "Verification error" });
  }
});

export default router;
