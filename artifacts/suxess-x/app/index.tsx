import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { FlowButton } from "@/components/FlowButton";
import { useCoaching, FlowType } from "@/context/CoachingContext";

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
    id: "visibility",
    label: "I need to step up / be seen",
    subtitle: "Own your presence and get recognized",
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
      paddingTop: 28,
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
