import { Router } from "express";
import Stripe from "stripe";
import { db, users, sessions } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const stripeSecret = process.env.STRIPE_SECRET_KEY;

function getStripe(): Stripe | null {
  return stripeSecret ? new Stripe(stripeSecret) : null;
}

// Resolve a Stripe customer id for an email. Prefer a stored stripeCustomerId,
// otherwise look the customer up by email — no server code currently persists
// stripeCustomerId for app users, so the email lookup is the common path.
async function resolveCustomerId(
  stripe: Stripe,
  storedCustomerId: string | null | undefined,
  email: string,
): Promise<string | null> {
  if (storedCustomerId) return storedCustomerId;
  const matches = await stripe.customers.list({ email, limit: 1 });
  return matches.data[0]?.id ?? null;
}

// GET /api/users/:email/premium — premium status by email (used by Restore Purchases).
router.get("/:email/premium", async (req, res) => {
  const { email } = req.params;
  try {
    const rows = await db
      .select({
        isPremium: users.isPremium,
        isPremiumPlus: users.isPremiumPlus,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user premium status");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users/:email/portal-session — open the Stripe customer billing portal.
router.post("/:email/portal-session", async (req, res) => {
  const { email } = req.params;
  const stripe = getStripe();
  if (!stripe) {
    res.status(500).json({ error: "Stripe is not configured" });
    return;
  }

  try {
    const rows = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const customerId = await resolveCustomerId(stripe, rows[0]?.stripeCustomerId, email);
    if (!customerId) {
      res.status(404).json({ error: "No active subscription" });
      return;
    }

    const activeSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    if (activeSubs.data.length === 0) {
      res.status(404).json({ error: "No active subscription" });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "https://momentum.amplify-x.co/",
    });

    res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err, email }, "Failed to create Stripe billing portal session");
    res.status(500).json({ error: "Failed to open subscription management" });
  }
});

// DELETE /api/users/:email — delete the account: cancel any active Stripe
// subscription, then remove the user and their sessions transactionally.
router.delete("/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const rows = await db
      .select({ id: users.id, stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = rows[0];
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Cancel active Stripe subscriptions. Best-effort: a Stripe outage must
    // never block the user's deletion request, so failures are logged and
    // deletion proceeds regardless.
    const stripe = getStripe();
    if (stripe) {
      try {
        const customerId = await resolveCustomerId(stripe, user.stripeCustomerId, email);
        if (customerId) {
          const activeSubs = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
          });
          for (const sub of activeSubs.data) {
            await stripe.subscriptions.cancel(sub.id);
          }
        }
      } catch (stripeErr) {
        req.log.error(
          { stripeErr, email },
          "Stripe subscription cancellation failed during account deletion; proceeding with data removal",
        );
      }
    }

    // Remove all user data in a single transaction so a partial failure cannot
    // leave orphaned sessions behind.
    await db.transaction(async (tx) => {
      await tx.delete(sessions).where(eq(sessions.userId, user.id));
      await tx.delete(users).where(eq(users.id, user.id));
    });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err, email }, "Failed to delete user account");
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
