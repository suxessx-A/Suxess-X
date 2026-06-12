import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getReceiptIOS,
  requestReceiptRefreshIOS,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type ProductSubscriptionIOS,
  type Purchase,
  type PurchaseError,
  type EventSubscription,
} from "react-native-iap";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getBase } from "@/context/CoachingContext";

// v1.3 iOS-only IAP service (react-native-iap v15 / StoreKit 2).
//
// IMPORTANT: requestPurchase() in v15 is EVENT-BASED. Its return value is not
// the purchase. The completed transaction arrives via purchaseUpdatedListener,
// which is registered once at launch (registerIapListeners). Both the live
// listener and the launch/Restore reconcile (processAvailablePurchases) funnel
// through one handler, handleIncomingPurchase, which validates the bundle app
// receipt with the backend, finishes the transaction on success, and fires the
// entitlement-changed callback so the UI refreshes. finishTransaction is only
// called AFTER the backend accepts the receipt — otherwise StoreKit replays the
// transaction on the next launch, which is our safety net.
//
// CRASH SAFETY: app stability is non-negotiable. Every entry point this module
// exposes is total — it catches its own errors and never re-throws. StoreKit
// event callbacks, the backend round-trip, AsyncStorage, and the registered UI
// callbacks are all individually guarded so a malformed Apple event or a
// throwing consumer callback can never propagate into the app.

export const MOMENTUM_MONTHLY_SKU = "momentum_monthly";
export const FALLBACK_PRICE_LABEL = "AUD $19.99/month";

// Must match AccessContext's SESSION_TOKEN_KEY.
const SESSION_TOKEN_KEY = "session_token";

export type PurchasePhase = "idle" | "purchasing" | "verifying" | "active" | "error";
export interface PurchaseStatus {
  phase: PurchasePhase;
  message?: string;
}

interface HandleResult {
  skipped?: boolean;
  activated?: boolean;
  error?: string;
}

let connected = false;
let connecting: Promise<void> | null = null;
let cachedProduct: ProductSubscriptionIOS | null = null;

// Registry (module-level callbacks). statusListener is the foreground screen;
// entitlementChanged is AccessContext.refresh. Both are single-slot and nullable.
let statusListener: ((s: PurchaseStatus) => void) | null = null;
let entitlementChanged: (() => void) | null = null;

let listenersRegistered = false;
let purchaseSub: EventSubscription | null = null;
let errorSub: EventSubscription | null = null;

// Guard against the live listener and the reconcile loop both handling the
// same transaction id concurrently.
const inFlight = new Set<string>();

// DEBUG — remove before submit
// Fire-and-forget breadcrumb to the server log so the on-device IAP flow is
// traceable in the Railway logs. Total: swallows all errors, never throws.
async function debugLog(tag: string, data?: unknown): Promise<void> {
  try {
    await fetch(`${getBase()}/api/debug/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag, data }),
    });
  } catch {
    // Best-effort.
  }
}

// Notify the foreground screen of a status change. Wrapped: a throwing UI
// callback (e.g. an Alert that fails) must never escape into StoreKit code.
function emitStatus(s: PurchaseStatus): void {
  try {
    statusListener?.(s);
  } catch (err) {
    console.warn("IAP status listener threw:", err);
  }
}

// Fire the entitlement-changed callback (AccessContext.refresh). Wrapped per
// the stability contract: a refresh failure must not crash the purchase
// listener (requirement: swallow refresh() errors).
function emitEntitlementChanged(): void {
  try {
    entitlementChanged?.();
  } catch (err) {
    console.warn("IAP entitlement callback threw:", err);
  }
}

export function setPurchaseStatusListener(cb: ((s: PurchaseStatus) => void) | null): void {
  statusListener = cb;
}

export function setOnEntitlementChange(cb: (() => void) | null): void {
  entitlementChanged = cb;
}

async function ensureConnected(): Promise<void> {
  if (connected) return;
  if (!connecting) {
    connecting = (async () => {
      await initConnection();
      connected = true;
    })();
  }
  try {
    await connecting;
  } catch (err) {
    connecting = null;
    throw err instanceof Error ? err : new Error("IAP connection failed");
  }
}

/** Connect to StoreKit (idempotent) and return the cached momentum_monthly
 *  product, or null if the SKU is not configured for this build. */
export async function initIAP(): Promise<ProductSubscriptionIOS | null> {
  await ensureConnected();
  // Attach the StoreKit listeners now that initConnection() has completed and
  // the Nitro runtime is ready. Attaching before initConnection (the old
  // _layout ordering) left the v15 native listener inert, so purchase events
  // never reached handleIncomingPurchase and the Subscribe spinner hung
  // forever. Guarded so a registration failure can neither crash the app nor
  // block the product fetch below; idempotent via the listenersRegistered guard.
  try {
    registerIapListeners();
  } catch (err) {
    console.warn("registerIapListeners failed:", err);
  }
  if (cachedProduct) return cachedProduct;
  const result = await fetchProducts({ skus: [MOMENTUM_MONTHLY_SKU], type: "subs" });
  const list = Array.isArray(result) ? result : null;
  const first = list && list.length > 0 ? list[0] : null;
  cachedProduct = first ? (first as ProductSubscriptionIOS) : null;
  return cachedProduct;
}

/** Register the StoreKit event listeners exactly once. Called from initIAP()
 *  AFTER ensureConnected() resolves — v15 only wires the native listener if
 *  initConnection() has completed (Nitro ready); attaching earlier leaves it
 *  inert. The handlers read the session token lazily at fire-time. Each callback
 *  body is fully guarded so a malformed Apple event can never crash the app. */
export function registerIapListeners(): void {
  void debugLog("listeners:enter", { alreadyRegistered: listenersRegistered }); // DEBUG — remove before submit
  if (listenersRegistered) return;
  const pSub = purchaseUpdatedListener((purchase) => {
    void debugLog("event:received", { productId: purchase?.productId }); // DEBUG — remove before submit
    try {
      void handleIncomingPurchase(purchase, true);
    } catch (err) {
      console.warn("purchaseUpdatedListener handler threw:", err);
    }
  });
  const eSub = purchaseErrorListener((error: PurchaseError) => {
    try {
      if (isUserCancellation(error)) {
        emitStatus({ phase: "idle" });
        return;
      }
      emitStatus({ phase: "error", message: error?.message || "Purchase failed." });
    } catch (err) {
      console.warn("purchaseErrorListener handler threw:", err);
    }
  });
  // Mark registered only after BOTH attaches succeed. If an attach throws, the
  // flag stays false and the next initIAP() retries — no half-attached state.
  purchaseSub = pSub;
  errorSub = eSub;
  listenersRegistered = true;
  void debugLog("listeners:attached"); // DEBUG — remove before submit
}

/** Kick off Apple's purchase sheet. Fire-and-forget: the outcome is delivered
 *  to the listener, NOT this promise. Total — never throws. */
export async function startMembershipPurchase(): Promise<void> {
  emitStatus({ phase: "purchasing" });
  try {
    await ensureConnected();
    void debugLog("purchase:requesting"); // DEBUG — remove before submit
    await requestPurchase({
      request: { apple: { sku: MOMENTUM_MONTHLY_SKU } },
      type: "subs",
    });
    // Result intentionally ignored — purchaseUpdatedListener handles delivery.
  } catch (err) {
    void debugLog("purchase:threw", { msg: getIapErrorMessage(err) }); // DEBUG — remove before submit
    if (isUserCancellation(err)) {
      emitStatus({ phase: "idle" });
      return;
    }
    emitStatus({ phase: "error", message: getIapErrorMessage(err) });
  }
}

/** The single funnel for every momentum_monthly transaction — whether it comes
 *  from the live listener, the launch reconcile, or Restore. Validates the
 *  receipt with the backend and finishes the transaction only on success.
 *
 *  Total by construction: the entire body runs inside one try/catch/finally, so
 *  any failure from AsyncStorage, getReceiptIOS, fetch, or finishTransaction is
 *  converted into a returned { error } result and never thrown. */
async function handleIncomingPurchase(
  purchase: Purchase,
  emit: boolean,
): Promise<HandleResult> {
  // Defensive: a malformed event could hand us a null/partial purchase.
  if (!purchase || purchase.productId !== MOMENTUM_MONTHLY_SKU) {
    return { skipped: true };
  }
  const key = purchase.id;
  if (key && inFlight.has(key)) return { skipped: true };
  if (key) inFlight.add(key);

  const status = (s: PurchaseStatus) => {
    if (emit) emitStatus(s);
  };

  try {
    status({ phase: "verifying" });

    const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      // No session to attach the purchase to. Do NOT finish — it will replay
      // and reconcile once the user is signed in.
      status({ phase: "error", message: "Not signed in." });
      return { error: "no-session" };
    }

    let receipt = await getReceiptIOS();
    if (!receipt) receipt = await requestReceiptRefreshIOS(); // fresh-sandbox fallback
    if (!receipt) {
      status({ phase: "error", message: "StoreKit returned an empty receipt." });
      return { error: "empty-receipt" };
    }

    const res = await fetch(`${getBase()}/api/auth/apple-receipt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_token: token, receipt }),
    });
    if (!res.ok) {
      // Leave the transaction unfinished so it can be retried/reconciled.
      status({ phase: "error", message: `Server rejected the receipt (HTTP ${res.status}).` });
      return { error: `http-${res.status}` };
    }

    await finishTransaction({ purchase, isConsumable: false });
    emitEntitlementChanged();
    status({ phase: "active" });
    return { activated: true };
  } catch (err) {
    status({ phase: "error", message: getIapErrorMessage(err) });
    return { error: getIapErrorMessage(err) };
  } finally {
    if (key) inFlight.delete(key);
  }
}

/** Reconcile unfinished/active purchases. Used at launch (flush a stuck
 *  transaction) and by the Restore Purchases button. Total — catches its own
 *  errors and returns a summary instead of throwing, so callers (sign-in flow,
 *  Restore button) cannot be destabilized by a StoreKit failure. */
export async function processAvailablePurchases(
  opts: { emitStatus?: boolean } = {},
): Promise<{ handled: number; activated: boolean; error?: string }> {
  try {
    await ensureConnected();
    const purchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
    const momentum = Array.isArray(purchases)
      ? purchases.filter((p) => p?.productId === MOMENTUM_MONTHLY_SKU)
      : [];
    let handled = 0;
    let activated = false;
    let error: string | undefined;
    for (const p of momentum) {
      const r = await handleIncomingPurchase(p, opts.emitStatus ?? false);
      if (r.skipped) continue;
      handled += 1;
      if (r.activated) activated = true;
      if (r.error) error = r.error;
    }
    return { handled, activated, error };
  } catch (err) {
    console.warn("processAvailablePurchases failed:", err);
    return { handled: 0, activated: false, error: getIapErrorMessage(err) };
  }
}

/** End the StoreKit connection, drop listeners and cache. Total — never throws. */
export async function teardownIAP(): Promise<void> {
  try {
    purchaseSub?.remove();
    errorSub?.remove();
  } catch (err) {
    console.warn("IAP listener teardown threw:", err);
  }
  purchaseSub = null;
  errorSub = null;
  listenersRegistered = false;
  if (!connected) return;
  try {
    await endConnection();
  } catch {
    // Best-effort.
  }
  connected = false;
  cachedProduct = null;
  connecting = null;
}

export function isUserCancellation(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = String((err as { code: unknown }).code).toUpperCase();
    return code.includes("USER_CANCEL");
  }
  return false;
}

export function getIapErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}
