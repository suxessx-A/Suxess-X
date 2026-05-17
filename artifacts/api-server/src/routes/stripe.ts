import { Router } from "express";
import Stripe from "stripe";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post(
  "/webhook",
  async (req, res) => {
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
          const customerId = session.customer as string;
          const mode = session.mode;
          if (customerId) {
            await db
              .update(users)
              .set({
                isPremium: true,
                isPremiumPlus: mode === "subscription",
                updatedAt: new Date(),
              })
              .where(eq(users.stripeCustomerId, customerId));
            req.log.info({ customerId, mode }, "User upgraded via checkout");
          }
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = sub.customer as string;
          if (customerId) {
            await db
              .update(users)
              .set({ isPremium: false, isPremiumPlus: false, updatedAt: new Date() })
              .where(eq(users.stripeCustomerId, customerId));
            req.log.info({ customerId }, "User downgraded on subscription cancellation");
          }
          break;
        }
        default:
          break;
      }
      res.json({ received: true });
    } catch (err) {
      req.log.error({ err }, "Error processing Stripe webhook");
      res.status(500).json({ error: "Webhook processing failed" });
    }
  },
);

export default router;
