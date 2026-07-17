import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator,
  Linking as RNLinking,
} from "react-native";
import * as Linking from "expo-linking";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAccess, type SessionUser, type SubscriptionTier } from "@/context/AccessContext";
import { getBase } from "@/context/CoachingContext";

// v1.2 login-only LoginScreen. Two-state: email entry, then 6-digit code.
// Deep-link entry (amplifyx://verify?email=...&token=...) is intercepted here
// because AppGate renders this component for any unauthenticated launch,
// including a cold-launch from the magic-link button.

const PRIVACY_URL = "https://waitlist.amplify-x.co/privacy-policy";
const TERMS_URL = "https://waitlist.amplify-x.co/terms-of-service";
const SUPPORT_MAILTO = "mailto:support@amplify-x.co?subject=Amplify%20X%20Momentum%20Support";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^\d{6}$/;

type Stage = "email" | "code";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAccess();
  const topInset = Platform.OS === "web" ? 28 : insets.top + 12;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const codeInputRef = useRef<TextInput>(null);
  const handledDeepLinkRef = useRef(false);

  // Cold-launch / background-launch via the magic-link button.
  const url = Linking.useURL();
  useEffect(() => {
    if (!url || handledDeepLinkRef.current) return;
    const parsed = safeParseDeepLink(url);
    if (!parsed) return;
    handledDeepLinkRef.current = true;
    void processUrlToken(parsed.email, parsed.token);
    // processUrlToken is stable via useCallback below; deliberately not listed
    // here to avoid resetting handled flag on re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const requestLink = useCallback(async (forEmail: string) => {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const res = await fetch(`${getBase()}/api/auth/request-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forEmail }),
      });
      if (res.status === 429) {
        setError("Too many sign-in attempts. Please try again in an hour.");
        return false;
      }
      if (!res.ok) {
        setError("Could not send a sign-in code. Please try again.");
        return false;
      }
      return true;
    } catch {
      setError("Network error. Check your connection and try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const verifyCode = useCallback(async (forEmail: string, forCode: string) => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`${getBase()}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forEmail, code: forCode }),
      });
      if (res.status === 401) {
        setError("Invalid or expired code. Please try again or request a new code.");
        return false;
      }
      if (!res.ok) {
        setError("Sign-in failed. Please try again.");
        return false;
      }
      const data = await res.json();
      const user = toSessionUser(data?.user, forEmail);
      const token = typeof data?.session_token === "string" ? data.session_token : "";
      if (!token || !user) {
        setError("Sign-in response was incomplete. Please try again.");
        return false;
      }
      await signIn(token, user);
      return true;
    } catch {
      setError("Network error. Check your connection and try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [signIn]);

  // Deep-link path: amplifyx://verify?email=...&token=... posts with url_token.
  const processUrlToken = useCallback(async (deepEmail: string, deepToken: string) => {
    setEmail(deepEmail);
    setStage("code");
    setBusy(true);
    try {
      const res = await fetch(`${getBase()}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: deepEmail, url_token: deepToken }),
      });
      if (!res.ok) {
        setError("That sign-in link has expired. Please request a new code.");
        return;
      }
      const data = await res.json();
      const user = toSessionUser(data?.user, deepEmail);
      const token = typeof data?.session_token === "string" ? data.session_token : "";
      if (!token || !user) {
        setError("Sign-in response was incomplete. Please try again.");
        return;
      }
      await signIn(token, user);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }, [signIn]);

  const handleEmailContinue = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    const ok = await requestLink(trimmed);
    if (ok) {
      setEmail(trimmed);
      setStage("code");
      setInfo(`We sent a code to ${trimmed}.`);
      // Focus the OTP field after a short delay to let the layout settle.
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
  };

  const handleVerify = async () => {
    if (!CODE_RE.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    await verifyCode(email, code);
    // On success, AppGate re-renders and unmounts this screen.
  };

  const handleResend = async () => {
    setInfo(null);
    const ok = await requestLink(email);
    if (ok) setInfo(`We sent a new code to ${email}.`);
  };

  const handleBackToEmail = () => {
    setStage("email");
    setCode("");
    setError(null);
    setInfo(null);
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingTop: topInset, paddingBottom: bottomInset },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <View style={s.brandBadge}>
            <Text style={s.brandBadgeText}>Amplify X</Text>
          </View>

          {stage === "email" ? (
            <>
              <Text style={s.headline}>Welcome to{"\n"}Amplify X Momentum</Text>
              <Text style={s.sub}>Sign in with your email. We will send you a 6-digit code.</Text>

              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="send"
                onSubmitEditing={handleEmailContinue}
                editable={!busy}
              />

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[s.primaryBtn, busy && s.btnDisabled]}
                onPress={handleEmailContinue}
                disabled={busy}
                activeOpacity={0.85}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.primaryBtnText}>Send sign-in code</Text>
                )}
              </TouchableOpacity>

            </>
          ) : (
            <>
              <Text style={s.headline}>Check your email</Text>
              <Text style={s.sub}>We sent a 6-digit code to {email}.</Text>

              <Text style={s.label}>6-digit code</Text>
              <TextInput
                ref={codeInputRef}
                style={[s.input, s.otpInput]}
                placeholder="••••••"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                returnKeyType="go"
                onSubmitEditing={handleVerify}
                editable={!busy}
              />

              {error ? <Text style={s.error}>{error}</Text> : info ? <Text style={s.info}>{info}</Text> : null}

              <TouchableOpacity
                style={[s.primaryBtn, busy && s.btnDisabled]}
                onPress={handleVerify}
                disabled={busy}
                activeOpacity={0.85}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.primaryBtnText}>Sign in</Text>
                )}
              </TouchableOpacity>

              <Text style={s.helperText}>Didn't receive it? Tap the link in your email, or</Text>
              <TouchableOpacity onPress={handleResend} activeOpacity={0.7} disabled={busy}>
                <Text style={s.linkText}>Resend code</Text>
              </TouchableOpacity>

              <View style={s.divider} />

              <TouchableOpacity onPress={handleBackToEmail} activeOpacity={0.7} disabled={busy}>
                <Text style={s.linkTextMuted}>Use a different email</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={s.footer}>
          <TouchableOpacity onPress={() => RNLinking.openURL(PRIVACY_URL)} activeOpacity={0.7}>
            <Text style={s.footerLink}>Privacy</Text>
          </TouchableOpacity>
          <Text style={s.footerDot}>·</Text>
          <TouchableOpacity onPress={() => RNLinking.openURL(TERMS_URL)} activeOpacity={0.7}>
            <Text style={s.footerLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={s.footerDot}>·</Text>
          <TouchableOpacity onPress={() => RNLinking.openURL(SUPPORT_MAILTO)} activeOpacity={0.7}>
            <Text style={s.footerLink}>Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeParseDeepLink(url: string): { email: string; token: string } | null {
  try {
    const parsed = Linking.parse(url);
    const isVerify = parsed.hostname === "verify" || parsed.path === "verify" || parsed.path?.endsWith("/verify");
    if (!isVerify) return null;
    const params = parsed.queryParams ?? {};
    const email = typeof params.email === "string" ? params.email : Array.isArray(params.email) ? params.email[0] : "";
    const token = typeof params.token === "string" ? params.token : Array.isArray(params.token) ? params.token[0] : "";
    if (!email || !token) return null;
    return { email: email.toLowerCase(), token };
  } catch {
    return null;
  }
}

function toSessionUser(raw: unknown, fallbackEmail: string): SessionUser | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const tier = r.subscription_tier;
  const validTier: SubscriptionTier =
    tier === "premium" || tier === "premium_plus" ? tier : "none";
  return {
    email: typeof r.email === "string" && r.email ? r.email : fallbackEmail,
    paid_status: r.paid_status === true,
    subscription_tier: validTier,
  };
}

const PURPLE = "#7c3aed";
const GOLD = "#d4a017";
const BG = "#0a0a14";
const CARD = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.1)";

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "stretch",
  },
  brandBadge: {
    alignSelf: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212,160,23,0.3)",
    backgroundColor: "rgba(212,160,23,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 22,
  },
  brandBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: GOLD,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headline: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  sub: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#fff",
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  otpInput: {
    fontFamily: Platform.select({
      ios: "Menlo",
      default: "Inter_700Bold",
    }),
    fontSize: 22,
    letterSpacing: 8,
    textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  btnDisabled: { opacity: 0.5 },
  helperText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.4)",
    marginTop: 12,
    textAlign: "center",
  },
  linkText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: PURPLE,
    textAlign: "center",
    marginTop: 6,
    paddingVertical: 6,
  },
  linkTextMuted: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 18,
  },
  secondaryLinkRow: {
    paddingVertical: 4,
  },
  secondaryLinkText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  error: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#fca5a5",
    marginTop: 2,
    marginBottom: 8,
    textAlign: "center",
  },
  info: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
    marginBottom: 8,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    paddingHorizontal: 20,
  },
  footerLink: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  footerDot: {
    fontSize: 12,
    color: "rgba(255,255,255,0.2)",
  },
});
