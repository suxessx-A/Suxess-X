import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { FlowButton } from "@/components/FlowButton";
import { useCoaching, FlowType } from "@/context/CoachingContext";
import { useAccess } from "@/context/AccessContext";
import {
  initIAP,
  startMembershipPurchase,
  setPurchaseStatusListener,
  type PurchasePhase,
  FALLBACK_PRICE_LABEL,
} from "@/lib/iap";
import type { ProductSubscriptionIOS } from "react-native-iap";

const flows: { id: FlowType; label: string; subtitle: string; icon: string }[] = [
  {
    id: "conversation",
    label: "Handle a tough conversation",
    subtitle: "Navigate feedback, conflict, or boundaries",
    icon: "💬",
  },
  {
    id: "stuck",
    label: "I feel stuck in my career",
    subtitle: "Break through plateaus and find direction",
    icon: "🧭",
  },
  {
    id: "speak_up",
    label: "Speak up in meetings",
    subtitle: "Own the room and be heard",
    icon: "🎤",
  },
  {
    id: "executive_visibility",
    label: "Make my work visible to leadership",
    subtitle: "Turn results into executive-level presence",
    icon: "✨",
  },
  {
    id: "negotiate",
    label: "Negotiate something important",
    subtitle: "Salary, promotion, scope, or resources",
    icon: "🤝",
  },
  {
    id: "mindset",
    label: "Reset my mindset quickly",
    subtitle: "Silence doubt and get back in your power",
    icon: "🔥",
  },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setActiveFlow } = useCoaching();
  const { isPaid, signOut } = useAccess();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  // IAP state for the !isPaid branch. Fetching the product is best-effort;
  // if it fails we fall back to a static price label so the Subscribe button
  // is always tappable (Apple shows the canonical price in its sheet anyway).
  const [iapProduct, setIapProduct] = useState<ProductSubscriptionIOS | null>(null);
  const [iapLoading, setIapLoading] = useState(true);
  const [purchasePhase, setPurchasePhase] = useState<PurchasePhase>("idle");
  const purchasing = purchasePhase === "purchasing" || purchasePhase === "verifying";

  useEffect(() => {
    if (isPaid) return;
    let alive = true;
    (async () => {
      try {
        const p = await initIAP();
        if (alive) setIapProduct(p);
      } catch (err) {
        // Stay silent — fallback label will be used. Logged for debugging.
        console.warn("Home inactive-view IAP init failed:", err);
      } finally {
        if (alive) setIapLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isPaid]);

  // Observe purchase status emitted by the module-level StoreKit listener. The
  // receipt POST, finishTransaction, and entitlement refresh all happen inside
  // lib/iap; this screen only reflects the outcome. The listener body in
  // lib/iap is fully guarded, so nothing here can be reached by a thrown Apple
  // event.
  useEffect(() => {
    setPurchaseStatusListener((s) => {
      setPurchasePhase(s.phase);
      if (s.phase === "error" && s.message) {
        Alert.alert("Purchase failed", s.message, [{ text: "OK" }]);
      }
      // On "active", AccessContext's entitlement callback runs refresh(), which
      // flips isPaid and re-renders this component into the active flow grid.
    });
    return () => setPurchaseStatusListener(null);
  }, []);

  const handleFlowPress = (id: FlowType) => {
    setActiveFlow(id);
    router.push("/flow");
  };

  const handleSubscribe = () => {
    if (purchasing) return;
    // Fire-and-forget: startMembershipPurchase is total (never throws) and the
    // purchaseUpdatedListener delivers the result through the status callback.
    void startMembershipPurchase();
  };

  const subscribeLabel = iapProduct?.displayPrice
    ? `Subscribe — ${iapProduct.displayPrice}/month`
    : `Subscribe — ${FALLBACK_PRICE_LABEL}`;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    header: {
      paddingTop: topInset + 20,
      paddingHorizontal: 24,
      paddingBottom: 28,
      backgroundColor: colors.primary,
    },
    headerTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    brand: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: "rgba(255,255,255,0.7)",
      letterSpacing: 2,
      textTransform: "uppercase",
      marginBottom: 0,
    },
    settingsBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.14)",
      alignItems: "center",
      justifyContent: "center",
    },
    settingsIcon: {
      fontSize: 17,
    },
    heading: {
      fontSize: 26,
      fontFamily: "Inter_700Bold",
      color: "#ffffff",
      lineHeight: 34,
    },
    headingAccent: {
      color: colors.gold,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: bottomInset + 20,
    },
    sectionLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 16,
    },
    inactiveWrap: {
      paddingHorizontal: 24,
      paddingTop: 40,
      paddingBottom: bottomInset + 24,
      alignItems: "center",
    },
    inactiveTitle: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      textAlign: "center",
      lineHeight: 30,
      marginBottom: 12,
    },
    inactiveBody: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 28,
      maxWidth: 360,
    },
    // Teal accent for the primary subscribe CTA. The dark on-color text gives
    // strong contrast against the teal background without relying on a brand
    // primary that may shift.
    subscribeBtn: {
      borderRadius: 12,
      backgroundColor: "#00D4AA",
      paddingVertical: 16,
      paddingHorizontal: 22,
      alignSelf: "stretch",
      maxWidth: 360,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
      marginBottom: 14,
    },
    subscribeBtnDisabled: {
      opacity: 0.7,
    },
    subscribeBtnText: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: "#0a1628",
      letterSpacing: 0.2,
    },
    subscribeLoading: {
      height: 18,
      justifyContent: "center",
    },
    inactiveSignOutBtn: {
      paddingVertical: 12,
      paddingHorizontal: 22,
      alignSelf: "stretch",
      maxWidth: 360,
      alignItems: "center",
    },
    inactiveSignOutText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
  });

  // Subscription-inactive state: sterile informational screen with no
  // external links and no payment copy. Reachable when a logged-in user's
  // paid_status is false (cancelled or never subscribed). Re-activation is
  // handled entirely off-app; the only affordance in this view is Sign Out.
  if (!isPaid) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <Text style={styles.brand}>Amplify X Momentum</Text>
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => router.push("/settings")}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Settings"
              >
                <Text style={styles.settingsIcon}>⚙️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.heading}>
              Welcome back.
            </Text>
          </View>

          <View style={styles.inactiveWrap}>
            <Text style={styles.inactiveTitle}>Activate your membership</Text>
            <Text style={styles.inactiveBody}>
              Get access to interactive AI coaching for the moments that define your career.
            </Text>
            <TouchableOpacity
              style={[styles.subscribeBtn, purchasing && styles.subscribeBtnDisabled]}
              onPress={() => void handleSubscribe()}
              disabled={purchasing || iapLoading}
              activeOpacity={0.85}
            >
              {purchasing || iapLoading ? (
                <View style={styles.subscribeLoading}>
                  <ActivityIndicator color="#0a1628" />
                </View>
              ) : (
                <Text style={styles.subscribeBtnText}>{subscribeLabel}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.inactiveSignOutBtn}
              onPress={() => void signOut()}
              activeOpacity={0.7}
            >
              <Text style={styles.inactiveSignOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.brand}>Amplify X Momentum</Text>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => router.push("/settings")}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heading}>
            What's happening{"\n"}
            <Text style={styles.headingAccent}>right now?</Text>
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionLabel}>Choose your situation</Text>

          {flows.map((flow) => (
            <FlowButton
              key={flow.id}
              label={flow.label}
              subtitle={flow.subtitle}
              icon={flow.icon}
              onPress={() => handleFlowPress(flow.id)}
              variant="secondary"
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
