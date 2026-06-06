import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
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
 * Verify a session JWT and return the email claim. Used by endpoints that
 * accept a session_token in the body (e.g. POST /apple-receipt) since this
 * project has no shared bearer-auth middleware yet.
 */
async function verifySessionToken(token: string): Promise<string> {
  const secret = getSessionSecret();
  const { payload } = await jwtVerify(token, secret);
  if (typeof payload.email !== "string" || !payload.email) {
    throw new Error("Session token missing email claim");
  }
  return payload.email.toLowerCase();
}

// ── Apple In-App Purchase receipt validation ─────────────────────────────────
//
// Legacy verifyReceipt endpoint with APPLE_SHARED_SECRET. App Store Server API
// migration is a future task; this is intentionally simple for v1 launch.

const APPLE_PROD_URL = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";
const MOMENTUM_MONTHLY_PRODUCT_ID = "momentum_monthly";

interface AppleReceiptInfo {
  product_id?: string;
  original_transaction_id?: string;
  transaction_id?: string;
  expires_date_ms?: string;
  purchase_date_ms?: string;
}

interface AppleVerifyResponse {
  status?: number;
  environment?: string;
  latest_receipt_info?: AppleReceiptInfo[];
  receipt?: { in_app?: AppleReceiptInfo[] };
}

async function postToAppleVerify(
  url: string,
  receiptData: string,
  sharedSecret: string,
): Promise<AppleVerifyResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "receipt-data": receiptData,
      "password": sharedSecret,
      "exclude-old-transactions": true,
    }),
  });
  if (!res.ok) {
    throw new Error(`Apple verifyReceipt HTTP ${res.status}`);
  }
  return (await res.json()) as AppleVerifyResponse;
}

async function verifyAppleReceipt(receiptData: string): Promise<AppleVerifyResponse> {
  const sharedSecret = process.env.APPLE_SHARED_SECRET;
  if (!sharedSecret) {
    throw new Error("APPLE_SHARED_SECRET is not set");
  }
  // Apple's recommended pattern: hit production first; on 21007 the receipt
  // is from sandbox and we retry there. This lets a single endpoint serve
  // both TestFlight / sandbox testing and live production traffic.
  let res = await postToAppleVerify(APPLE_PROD_URL, receiptData, sharedSecret);
  if (res.status === 21007) {
    res = await postToAppleVerify(APPLE_SANDBOX_URL, receiptData, sharedSecret);
  }
  return res;
}

function pickActiveMomentumSubscription(
  apple: AppleVerifyResponse,
): AppleReceiptInfo | null {
  // latest_receipt_info is present for auto-renewable subscriptions; fall
  // back to receipt.in_app for non-subscription edge cases or first-receipt
  // verification flows.
  const entries = apple.latest_receipt_info ?? apple.receipt?.in_app ?? [];
  const now = Date.now();
  let best: AppleReceiptInfo | null = null;
  let bestExpires = 0;
  for (const entry of entries) {
    if (entry.product_id !== MOMENTUM_MONTHLY_PRODUCT_ID) continue;
    const exp = entry.expires_date_ms ? Number(entry.expires_date_ms) : 0;
    if (!Number.isFinite(exp) || exp <= now) continue;
    if (exp > bestExpires) {
      bestExpires = exp;
      best = entry;
    }
  }
  return best;
}

router.post("/apple-receipt", async (req, res) => {
  const sessionToken =
    typeof req.body?.session_token === "string" ? req.body.session_token : "";
  const receipt =
    typeof req.body?.receipt === "string" ? req.body.receipt : "";

  if (!sessionToken || !receipt) {
    res.status(400).json({ error: "session_token and receipt are required" });
    return;
  }

  let email: string;
  try {
    email = await verifySessionToken(sessionToken);
  } catch (err) {
    req.log.warn({ err }, "Invalid session token on /apple-receipt");
    res.status(401).json({ error: "Invalid session" });
    return;
  }

  let apple: AppleVerifyResponse;
  try {
    apple = await verifyAppleReceipt(receipt);
  } catch (err) {
    req.log.error({ err, email }, "Apple verifyReceipt call failed");
    res.status(500).json({ error: "Receipt validation upstream error" });
    return;
  }

  if (apple.status !== 0) {
    req.log.warn(
      { appleStatus: apple.status, environment: apple.environment, email },
      "Apple verifyReceipt rejected the receipt",
    );
    res.status(401).json({ error: "Receipt validation failed" });
    return;
  }

  const active = pickActiveMomentumSubscription(apple);
  if (!active) {
    req.log.info(
      { email, environment: apple.environment },
      "Apple receipt valid but no active momentum_monthly subscription found",
    );
    res.status(401).json({ error: "Receipt validation failed" });
    return;
  }

  const originalTxnId =
    active.original_transaction_id ?? active.transaction_id ?? null;
  const productId = active.product_id ?? MOMENTUM_MONTHLY_PRODUCT_ID;
  const expiresAt = new Date(Number(active.expires_date_ms));

  const tier: SubscriptionTier = "premium";
  await db
    .update(users)
    .set({
      paidStatus: true,
      subscriptionTier: tier,
      isPremium: true,
      isPremiumPlus: false,
      appleOriginalTransactionId: originalTxnId,
      appleProductId: productId,
      appleExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(users.email, email));

  req.log.info(
    { email, productId, originalTxnId, environment: apple.environment },
    "User upgraded via Apple IAP receipt",
  );

  res.json({
    success: true,
    paid_status: true,
    subscription_tier: tier,
  });
});

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
