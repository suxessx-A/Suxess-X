import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { FlowButton } from "@/components/FlowButton";
import { useCoaching, FlowType } from "@/context/CoachingContext";
import { useAccess } from "@/context/AccessContext";

const BRAND_URL = "https://amplify-x.co";

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
    inactiveLinkBtn: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: 22,
      alignSelf: "stretch",
      maxWidth: 360,
      alignItems: "center",
      marginBottom: 12,
    },
    inactiveLinkText: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    inactiveSignOutBtn: {
      paddingVertical: 14,
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

  // Subscription-inactive state: sterile screen, no payment links or pricing.
  // Reachable when a logged-in user's paid_status is false (cancelled or never
  // subscribed). amplify-x.co handles the marketing / re-subscribe path
  // off-app to stay clear of Apple anti-steering rules.
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
            <Text style={styles.inactiveTitle}>Your subscription is currently inactive.</Text>
            <Text style={styles.inactiveBody}>
              Sign in is still active. Visit amplify-x.co for information on plans and to manage your account.
            </Text>
            <TouchableOpacity
              style={styles.inactiveLinkBtn}
              onPress={() => Linking.openURL(BRAND_URL)}
              activeOpacity={0.85}
            >
              <Text style={styles.inactiveLinkText}>Visit amplify-x.co</Text>
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
