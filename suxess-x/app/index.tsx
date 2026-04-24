import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { FlowButton } from "@/components/FlowButton";
import { useCoaching, FlowType } from "@/context/CoachingContext";
import { useAccess } from "@/context/AccessContext";

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
  const params = useLocalSearchParams<{ payment_success?: string; unlock?: string }>();
  const { setActiveFlow } = useCoaching();
  const { isPaid, isCheckingAccess, markPaid } = useAccess();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (params.payment_success === "true" && !isPaid) {
      markPaid();
    }
    if (params.unlock === "owner" && !isPaid) {
      markPaid();
    }
  }, [params.payment_success, params.unlock]);

  const handleFlowPress = (id: FlowType) => {
    if (!isPaid) {
      router.push("/paywall");
      return;
    }
    setActiveFlow(id);
    router.push("/flow");
  };

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
    brand: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: "rgba(255,255,255,0.7)",
      letterSpacing: 2,
      textTransform: "uppercase",
      marginBottom: 10,
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
    tryFreeCard: {
      borderRadius: 16,
      backgroundColor: "#1a1a2e",
      padding: 20,
      marginBottom: 24,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    tryFreeIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(212,160,23,0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    tryFreeIcon: { fontSize: 20 },
    tryFreeTextWrap: { flex: 1 },
    tryFreeLabel: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: "#ffffff",
      marginBottom: 3,
    },
    tryFreeSub: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.5)",
      lineHeight: 17,
    },
    tryFreeArrow: {
      fontSize: 18,
      color: "#d4a017",
      fontFamily: "Inter_700Bold",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 16,
    },
    lockNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    lockIcon: { fontSize: 12, color: colors.mutedForeground },
    lockText: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    lockLink: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>Suxess X</Text>
          <Text style={styles.heading}>
            What's happening{"\n"}
            <Text style={styles.headingAccent}>right now?</Text>
          </Text>
        </View>

        <View style={styles.content}>
          <TouchableOpacity
            style={styles.tryFreeCard}
            onPress={() => router.push("/example")}
            activeOpacity={0.85}
          >
            <View style={styles.tryFreeIconWrap}>
              <Text style={styles.tryFreeIcon}>👀</Text>
            </View>
            <View style={styles.tryFreeTextWrap}>
              <Text style={styles.tryFreeLabel}>Try Free</Text>
              <Text style={styles.tryFreeSub}>See a full coaching example — no account needed</Text>
            </View>
            <Text style={styles.tryFreeArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>
            {isPaid ? "Choose your situation" : "Your coaching flows"}
          </Text>

          {!isPaid && !isCheckingAccess && (
            <View style={styles.lockNotice}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockText}>
                Unlock full access.{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/paywall")}>
                <Text style={styles.lockLink}>See plans →</Text>
              </TouchableOpacity>
            </View>
          )}

          {flows.map((flow) => (
            <FlowButton
              key={flow.id}
              label={flow.label}
              subtitle={flow.subtitle}
              icon={flow.icon}
              onPress={() => handleFlowPress(flow.id)}
              variant="secondary"
              locked={!isPaid}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
