import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getBase } from "@/context/CoachingContext";

// v1.2 login-only model. The backend issues a session JWT after magic-link
// verify; this context persists it (with the user object) in AsyncStorage and
// exposes isPaid for the home screen's inactive-subscription gate.
//
// Legacy AsyncStorage flags suxess_paid and suxess_premium are written
// alongside the new session so any code path that still reads them lines up
// with the canonical paid_status from /verify.

export type SubscriptionTier = "none" | "premium" | "premium_plus";

export interface SessionUser {
  email: string;
  paid_status: boolean;
  subscription_tier: SubscriptionTier;
}

interface AccessContextValue {
  sessionToken: string | null;
  user: SessionUser | null;
  isPaid: boolean;
  isCheckingAccess: boolean;
  signIn: (token: string, user: SessionUser) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SESSION_TOKEN_KEY = "session_token";
const USER_KEY = "user";
const LEGACY_PAID = "suxess_paid";
const LEGACY_PREMIUM = "suxess_premium";

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Hydrate from disk on mount. If the stored JWT has expired we treat the
  // session as absent and clear everything, so AppGate routes to LoginScreen.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.multiGet([SESSION_TOKEN_KEY, USER_KEY]);
        const token = stored[0]?.[1] ?? null;
        const userStr = stored[1]?.[1] ?? null;
        if (token && userStr && !isJwtExpired(token)) {
          const parsed = safeParseUser(userStr);
          if (parsed) {
            setSessionToken(token);
            setUser(parsed);
            setIsCheckingAccess(false);
            return;
          }
        }
        if (token || userStr) {
          // Stale / expired / unparseable: scrub so we do not partially
          // resurrect a half-session.
          await AsyncStorage.multiRemove([
            SESSION_TOKEN_KEY,
            USER_KEY,
            LEGACY_PAID,
            LEGACY_PREMIUM,
          ]);
        }
      } catch (e) {
        console.warn("AccessProvider hydrate error:", e);
      } finally {
        setIsCheckingAccess(false);
      }
    })();
  }, []);

  const writeLegacyFlags = async (u: SessionUser) => {
    await AsyncStorage.multiSet([
      [LEGACY_PAID, u.paid_status ? "true" : "false"],
      [LEGACY_PREMIUM, u.subscription_tier !== "none" ? "true" : "false"],
    ]);
  };

  const signIn = useCallback(async (token: string, u: SessionUser) => {
    try {
      await AsyncStorage.multiSet([
        [SESSION_TOKEN_KEY, token],
        [USER_KEY, JSON.stringify(u)],
      ]);
      await writeLegacyFlags(u);
    } catch (e) {
      console.warn("signIn persist error:", e);
    }
    setSessionToken(token);
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        SESSION_TOKEN_KEY,
        USER_KEY,
        LEGACY_PAID,
        LEGACY_PREMIUM,
      ]);
    } catch {}
    setSessionToken(null);
    setUser(null);
  }, []);

  // Refresh paid_status from the existing legacy endpoint. The v1.2 backend
  // keeps isPremium/isPremiumPlus in sync with paid_status/subscription_tier
  // on every write, so consuming the legacy shape is safe.
  const refresh = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(
        `${getBase()}/api/users/${encodeURIComponent(user.email)}/premium`,
      );
      if (!res.ok) return;
      const data: { isPremium?: boolean; isPremiumPlus?: boolean } = await res.json();
      if (typeof data.isPremium !== "boolean") return;
      const tier: SubscriptionTier = data.isPremiumPlus
        ? "premium_plus"
        : data.isPremium
        ? "premium"
        : "none";
      const updated: SessionUser = {
        ...user,
        paid_status: data.isPremium,
        subscription_tier: tier,
      };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
      await writeLegacyFlags(updated);
      setUser(updated);
    } catch (e) {
      console.warn("AccessProvider refresh error:", e);
    }
  }, [user]);

  const isPaid = user?.paid_status ?? false;

  return (
    <AccessContext.Provider
      value={{ sessionToken, user, isPaid, isCheckingAccess, signIn, signOut, refresh }}
    >
      {children}
    </AccessContext.Provider>
  );
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used within AccessProvider");
  return ctx;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeParseUser(raw: string): SessionUser | null {
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.email === "string" &&
      typeof parsed.paid_status === "boolean" &&
      (parsed.subscription_tier === "none" ||
        parsed.subscription_tier === "premium" ||
        parsed.subscription_tier === "premium_plus")
    ) {
      return parsed as SessionUser;
    }
  } catch {}
  return null;
}

// Decode the JWT's exp claim without verifying its signature: we only need to
// know if a locally-cached token is past its expiry before deciding whether to
// treat it as a valid session. Signature verification stays on the server.
function isJwtExpired(jwt: string): boolean {
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return true;
    const payloadStr = parts[1] ?? "";
    const padded = payloadStr.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = base64Decode(padded);
    const claims = JSON.parse(decoded);
    if (typeof claims.exp !== "number") return false;
    return claims.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function base64Decode(s: string): string {
  // React Native 0.81+ ships atob globally; pad to a multiple of 4.
  const padded = s + "==".slice(0, (4 - (s.length % 4)) % 4);
  return atob(padded);
}
