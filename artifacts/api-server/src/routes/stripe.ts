import { Router } from "express";
import Stripe from "stripe";
import { db, users, type SubscriptionTier } from "@workspace/db";
import { and, eq, isNull } from "drizzle-orm";
import { issueMagicLinkForEmail } from "./auth";

const router = Router();

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Map a Stripe price id to a subscription tier. Premium-plus mapping is TBD
// (currently every paid plan routes to premium); add price-id checks here
// when the premium-plus product is created in Stripe.
function tierForPriceId(_priceId: string | null | undefined): SubscriptionTier {
  return "premium";
}

router.post("/webhook", async (req, res) => {
  if (!stripeSecret || !webhookSecret) {
    res.status(500).json({ error: "Stripe not configured" });
    return;
  }

  const stripe = new Stripe(stripeSecret);
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    req.log.warn({ err }, "Stripe webhook signature verification failed");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = (
          session.customer_details?.email ??
          session.customer_email ??
          ""
        )
          .toString()
          .trim()
          .toLowerCase();
        const customerId = (session.customer as string) ?? null;
        const subscriptionId = (session.subscription as string) ?? null;

        if (!email) {
          req.log.warn(
            { sessionId: session.id },
            "checkout.session.completed without an email; skipping",
          );
          break;
        }

        // Determine tier from the subscription's first price id. Falls back to
        // 'premium' on retrieval errors so a transient Stripe API issue does
        // not block the upgrade.
        let tier: SubscriptionTier = "premium";
        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            const priceId = sub.items.data[0]?.price?.id;
            tier = tierForPriceId(priceId);
          } catch (e) {
            req.log.warn(
              { e, subscriptionId },
              "Could not retrieve subscription; defaulting tier to premium",
            );
          }
        }
        const isPlus = tier === "premium_plus";

        // Upsert by email. Insert if absent, otherwise update premium fields
        // and Stripe ids. Legacy isPremium / isPremiumPlus booleans stay in
        // sync until the frontend reads paid_status / subscription_tier.
        await db
          .insert(users)
          .values({
            email,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            paidStatus: true,
            subscriptionTier: tier,
            isPremium: true,
            isPremiumPlus: isPlus,
          })
          .onConflictDoUpdate({
            target: users.email,
            set: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              paidStatus: true,
              subscriptionTier: tier,
              isPremium: true,
              isPremiumPlus: isPlus,
              updatedAt: new Date(),
            },
          });

        req.log.info(
          { email, customerId, subscriptionId, tier },
          "User upgraded via checkout",
        );

        // Send a welcome magic link so the new customer can sign in. Best
        // effort: a Resend outage must not 5xx the webhook (Stripe would
        // retry the entire event); the row already reflects the upgrade.
        try {
          await issueMagicLinkForEmail(email);
        } catch (e) {
          req.log.error({ e, email }, "Failed to send welcome magic link");
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const subscriptionId = sub.id;
        const customerId = (sub.customer as string) ?? null;

        await db
          .update(users)
          .set({
            paidStatus: false,
            subscriptionTier: "none",
            isPremium: false,
            isPremiumPlus: false,
            updatedAt: new Date(),
          })
          .where(eq(users.stripeSubscriptionId, subscriptionId));

        // Fallback for legacy rows that pre-date the stripeSubscriptionId
        // column: match on customer id only when subscription id is unset.
        if (customerId) {
          await db
            .update(users)
            .set({
              paidStatus: false,
              subscriptionTier: "none",
              isPremium: false,
              isPremiumPlus: false,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(users.stripeCustomerId, customerId),
                isNull(users.stripeSubscriptionId),
              ),
            );
        }

        req.log.info(
          { subscriptionId, customerId },
          "User downgraded on subscription cancellation",
        );
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        req.log.info(
          {
            invoiceId: invoice.id,
            customerId: invoice.customer,
            amount: invoice.amount_paid,
          },
          "invoice.payment_succeeded",
        );
        break;
      }

      default:
        req.log.info({ type: event.type }, "Stripe webhook event ignored");
        res.json({ received: true, ignored: true });
        return;
    }

    res.json({ received: true });
  } catch (err) {
    req.log.error({ err }, "Error processing Stripe webhook");
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
