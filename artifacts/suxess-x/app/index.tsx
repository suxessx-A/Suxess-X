import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
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
  const { setActiveFlow } = useCoaching();
  const { isPaid, signOut } = useAccess();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  // A signed-in user whose paid_status is false has no in-app path to access
  // and no payment surface; silently sign them out so AppGate returns them to
  // the login screen. Nothing is rendered in the meantime.
  useEffect(() => {
    if (!isPaid) void signOut();
  }, [isPaid, signOut]);

  const handleFlowPress = (id: FlowType) => {
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
  });

  // Unpaid users are signed out by the effect above; render nothing until
  // AppGate swaps in the login screen.
  if (!isPaid) return null;

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
