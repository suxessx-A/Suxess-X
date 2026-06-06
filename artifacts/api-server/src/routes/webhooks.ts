import { Router, type IRouter } from "express";

const router: IRouter = Router();

// App Store Server Notifications V2 stub.
//
// Apple POSTs a signed JWS payload to this endpoint on subscription state
// changes: DID_RENEW, DID_CHANGE_RENEWAL_STATUS, EXPIRED, REFUND, etc. For
// the v1 launch we only validate receipts on demand from the app via POST
// /api/auth/apple-receipt; this endpoint is a placeholder so the URL is
// configurable in App Store Connect now, but does not yet alter user state.
//
// Implement before the first batch of subscriptions renews (~1 month after
// the first IAP purchase, sandbox 5 minutes after a sandbox purchase).
router.post("/apple-storeserver", (req, res) => {
  // TODO(v1.3+): verify the signedPayload JWS against Apple's public keys,
  // decode the notificationType + subtype, find the user by
  // appleOriginalTransactionId, and update paidStatus / appleExpiresAt
  // accordingly. For now we log the raw body so sandbox notifications can
  // be observed in Railway logs during testing.
  req.log.info(
    {
      apple: req.body,
      signatureHeader: req.headers["x-apple-signature"] ?? null,
    },
    "Received Apple App Store Server notification (stub - no state change)",
  );
  res.status(200).json({ received: true, stubbed: true });
});

export default router;
