import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getReceiptIOS,
  type ProductSubscriptionIOS,
  type Purchase,
} from "react-native-iap";

// v1.3 iOS-only IAP service.
//
// Single product: momentum_monthly (auto-renewable subscription). This module
// is the only place that touches react-native-iap so the UI surfaces stay
// thin. All operations are connection-idempotent: a single StoreKit
// connection is shared across the home Subscribe button, the Settings
// Restore Purchases row, and the root-mount warm-up.
//
// Backend uses the legacy verifyReceipt endpoint, so this module returns the
// bundle's base64 app receipt (via getReceiptIOS) rather than the StoreKit 2
// JWS token. The app receipt contains every transaction this Apple ID has
// made for the bundle, so it's the right shape for both Subscribe and
// Restore flows; the backend pulls the active momentum_monthly entry out.

export const MOMENTUM_MONTHLY_SKU = "momentum_monthly";

// "AUD $19.99/month" is a static fallback shown if Apple's product fetch
// fails (offline, ID not yet configured in App Store Connect, sandbox
// hiccup). Apple's purchase sheet always renders the canonical localized
// price anyway, so the fallback only affects the button label.
export const FALLBACK_PRICE_LABEL = "AUD $19.99/month";

let connected = false;
let connecting: Promise<void> | null = null;
// iOS-only app: narrow from the cross-platform ProductSubscription union to
// the iOS variant at the cache boundary. displayPrice / price are guaranteed
// on ProductSubscriptionIOS and the platform field acts as a sanity check.
let cachedProduct: ProductSubscriptionIOS | null = null;

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

/**
 * Connect to StoreKit (idempotent) and return the momentum_monthly product,
 * cached for the lifetime of the process. Returns null if the SKU is not
 * configured in App Store Connect for this build — callers should fall
 * back to a static price label in that case.
 */
export async function initIAP(): Promise<ProductSubscriptionIOS | null> {
  await ensureConnected();
  if (cachedProduct) return cachedProduct;
  const result = await fetchProducts({
    skus: [MOMENTUM_MONTHLY_SKU],
    type: "subs",
  });
  const list = Array.isArray(result) ? result : null;
  const first = list && list.length > 0 ? list[0] : null;
  cachedProduct = first ? (first as ProductSubscriptionIOS) : null;
  return cachedProduct;
}

/**
 * End the StoreKit connection and drop the cached product. Called on app
 * teardown as hygiene; iOS releases this automatically on app termination.
 */
export async function teardownIAP(): Promise<void> {
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

/**
 * Trigger Apple's purchase sheet for momentum_monthly. Returns both the
 * Purchase object (for finishTransaction) and the base64 app receipt
 * already retrieved (so the caller can POST it to the backend). Rejects on
 * failure including user cancellation — use isUserCancellation to
 * distinguish.
 */
export async function purchaseMembership(): Promise<{
  purchase: Purchase;
  receipt: string;
}> {
  await ensureConnected();
  const result = await requestPurchase({
    request: {
      apple: { sku: MOMENTUM_MONTHLY_SKU },
    },
    type: "subs",
  });
  if (!result) {
    throw new Error("Apple did not return a purchase.");
  }
  const purchase = Array.isArray(result) ? result[0] : result;
  if (!purchase) {
    throw new Error("Apple did not return a purchase.");
  }
  const receipt = await getReceiptIOS();
  if (!receipt) {
    throw new Error("StoreKit returned an empty receipt.");
  }
  return { purchase, receipt };
}

/**
 * Read the bundle's base64 app receipt for the Restore flow. Returns null
 * if the receipt is empty (no purchases on this Apple ID for this bundle);
 * the backend will inspect the receipt's transactions to find the active
 * momentum_monthly subscription if one is present.
 */
export async function getCurrentPurchaseReceipt(): Promise<string | null> {
  await ensureConnected();
  try {
    const receipt = await getReceiptIOS();
    return receipt && receipt.length > 0 ? receipt : null;
  } catch {
    return null;
  }
}

/**
 * Acknowledge a purchase to Apple after the backend has accepted the
 * receipt. Subscriptions: isConsumable = false. Failing to call this leaves
 * the transaction pending and Apple will replay it on next launch.
 */
export async function finishMembershipTransaction(
  purchase: Purchase,
): Promise<void> {
  await finishTransaction({ purchase, isConsumable: false });
}

/**
 * Detect Apple's user-cancellation signal. The exact error code string
 * varies by react-native-iap version and platform; matching defensively
 * lets a Sign-Up sheet dismissal stay silent while every other failure
 * surfaces as an Alert.
 */
export function isUserCancellation(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = String((err as { code: unknown }).code).toUpperCase();
    return code.includes("USER_CANCEL");
  }
  return false;
}

/**
 * Extract a human-readable message from a PurchaseError or any other thrown
 * value, with a safe fallback for unexpected shapes.
 */
export function getIapErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}
