import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAccess } from "@/context/AccessContext";

const WEEKLY_URL = process.env.EXPO_PUBLIC_STRIPE_WEEKLY_URL ?? "";
const MONTHLY_URL = process.env.EXPO_PUBLIC_STRIPE_MONTHLY_URL ?? "";

const VALUE_POINTS = [
  "Turn uncertainty into clear, immediate action",
  "Handle critical moments without hesitation",
  "Take control of your career direction",
];

type Plan = "weekly" | "monthly";

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { markPaid } = useAccess();
  const [selectedPlan, setSelectedPlan] = useState<Plan>("monthly");
  const [isLoading, setIsLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 0 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleUnlock = async () => {
    const url = selectedPlan === "weekly" ? WEEKLY_URL : MONTHLY_URL;
    if (!url) {
      alert("Payment integration coming soon. Set EXPO_PUBLIC_STRIPE_WEEKLY_URL and EXPO_PUBLIC_STRIPE_MONTHLY_URL.");
      return;
    }
    setIsLoading(true);
    try {
      await Linking.openURL(url);
    } catch {
      alert("Could not open payment link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0f0f1a" },
    scroll: { flex: 1 },
    hero: {
      paddingTop: topInset + 48,
      paddingBottom: 36,
      paddingHorizontal: 28,
      alignItems: "center",
    },
    badge: {
      backgroundColor: "rgba(212,160,23,0.15)",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(212,160,23,0.3)",
      paddingVertical: 5,
      paddingHorizontal: 14,
      marginBottom: 28,
    },
    badgeText: {
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      color: "#d4a017",
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    headline: {
      fontSize: 27,
      fontFamily: "Inter_700Bold",
      color: "#ffffff",
      textAlign: "center",
      lineHeight: 35,
      marginBottom: 16,
    },
    subtext: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.65)",
      textAlign: "center",
      lineHeight: 23,
      marginBottom: 22,
    },
    tensionLine: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: "rgba(255,255,255,0.45)",
      textAlign: "center",
      lineHeight: 20,
      fontStyle: "italic",
    },
    valueSection: {
      marginHorizontal: 20,
      marginBottom: 24,
      backgroundColor: "rgba(255,255,255,0.04)",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    valueRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 14,
    },
    valueRowLast: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    valueDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#d4a017",
      marginTop: 7,
    },
    valueText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: "rgba(255,255,255,0.85)",
      flex: 1,
      lineHeight: 21,
    },
    pricingSection: {
      marginHorizontal: 20,
      marginBottom: 28,
      gap: 10,
    },
    pricingCard: {
      borderRadius: 14,
      borderWidth: 1.5,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    pricingCardUnselected: {
      borderColor: "rgba(255,255,255,0.12)",
      backgroundColor: "rgba(255,255,255,0.04)",
    },
    pricingCardSelected: {
      borderColor: "#7c3aed",
      backgroundColor: "rgba(124,58,237,0.12)",
    },
    pricingLeft: { flex: 1 },
    pricingLabel: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: "#ffffff",
      marginBottom: 3,
    },
    pricingAmount: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.5)",
    },
    popularBadge: {
      backgroundColor: "#d4a017",
      borderRadius: 6,
      paddingVertical: 3,
      paddingHorizontal: 9,
    },
    popularText: {
      fontSize: 9,
      fontFamily: "Inter_700Bold",
      color: "#1a1a2e",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 14,
    },
    radioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#7c3aed",
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: bottomInset + 24,
    },
    unlockBtn: {
      backgroundColor: "#7c3aed",
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: "center",
      marginBottom: 14,
    },
    unlockBtnLoading: {
      backgroundColor: "#5b21b6",
    },
    unlockBtnText: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: "#ffffff",
      letterSpacing: 0.3,
    },
    backLink: {
      alignItems: "center",
      paddingVertical: 10,
    },
    backLinkText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: "rgba(255,255,255,0.4)",
    },
    guarantee: {
      alignItems: "center",
      marginBottom: 12,
    },
    guaranteeText: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.25)",
      textAlign: "center",
    },
  });

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View style={s.badge}>
            <Text style={s.badgeText}>Suxess X</Text>
          </View>
          <Text style={s.headline}>
            Stop overthinking.{"\n"}Take control of what{"\n"}you do next.
          </Text>
          <Text style={s.subtext}>
            In the moments that define your career — when you're stuck, triggered, or unsure — get clear on what to do and move forward with confidence.
          </Text>
          <Text style={s.tensionLine}>
            Most people hesitate, avoid it, or make the wrong move.{"\n"}You don't have to.
          </Text>
        </View>

        <View style={s.valueSection}>
          {VALUE_POINTS.map((point, i) => (
            <View
              key={i}
              style={i === VALUE_POINTS.length - 1 ? s.valueRowLast : s.valueRow}
            >
              <View style={s.valueDot} />
              <Text style={s.valueText}>{point}</Text>
            </View>
          ))}
        </View>

        <View style={s.pricingSection}>
          <TouchableOpacity
            style={[
              s.pricingCard,
              selectedPlan === "weekly"
                ? s.pricingCardSelected
                : s.pricingCardUnselected,
            ]}
            onPress={() => setSelectedPlan("weekly")}
            activeOpacity={0.82}
          >
            <View style={s.pricingLeft}>
              <Text style={s.pricingLabel}>Weekly</Text>
              <Text style={s.pricingAmount}>$6 per week</Text>
            </View>
            <View
              style={[
                s.radioOuter,
                {
                  borderColor:
                    selectedPlan === "weekly"
                      ? "#7c3aed"
                      : "rgba(255,255,255,0.2)",
                },
              ]}
            >
              {selectedPlan === "weekly" && <View style={s.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.pricingCard,
              selectedPlan === "monthly"
                ? s.pricingCardSelected
                : s.pricingCardUnselected,
            ]}
            onPress={() => setSelectedPlan("monthly")}
            activeOpacity={0.82}
          >
            <View style={s.pricingLeft}>
              <Text style={s.pricingLabel}>Monthly</Text>
              <Text style={s.pricingAmount}>$20 per month</Text>
            </View>
            <View
              style={[
                s.radioOuter,
                {
                  borderColor:
                    selectedPlan === "monthly"
                      ? "#7c3aed"
                      : "rgba(255,255,255,0.2)",
                },
              ]}
            >
              {selectedPlan === "monthly" && <View style={s.radioInner} />}
            </View>
            <View style={s.popularBadge}>
              <Text style={s.popularText}>Most Popular</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>

      <View style={s.footer}>
        <View style={s.guarantee}>
          <Text style={s.guaranteeText}>Cancel anytime · Secure payment</Text>
        </View>
        <TouchableOpacity
          style={[s.unlockBtn, isLoading && s.unlockBtnLoading]}
          onPress={handleUnlock}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          <Text style={s.unlockBtnText}>
            {isLoading ? "Opening..." : "Unlock Access"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.backLink} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.backLinkText}>Back to Example</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
