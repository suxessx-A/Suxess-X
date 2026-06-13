import { Router, type IRouter } from "express";

const router: IRouter = Router();

// Device-side breadcrumb sink for IAP debugging. The native StoreKit flow runs
// where the JS console isn't visible (TestFlight/sandbox on device), so the
// client POSTs tagged events here and they land in the server logs via pino,
// carrying the request-id and staying greppable alongside other server logs.
router.post("/log", (req, res) => {
  const { tag, data } = req.body ?? {};
  req.log.info({ tag, data }, "IAP-DEBUG");
  res.json({ ok: true });
});

export default router;
