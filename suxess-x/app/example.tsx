import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { CoachingResultCard } from "@/components/CoachingResultCard";
import { EXAMPLE_RESULT } from "@/data/exampleResult";

export default function ExampleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: topInset + 8,
      paddingBottom: 16,
      paddingHorizontal: 20,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    exampleBadge: {
      backgroundColor: "#fef3c7",
      borderRadius: 6,
      paddingVertical: 3,
      paddingHorizontal: 8,
      marginRight: 10,
    },
    exampleBadgeText: {
      fontSize: 9,
      fontFamily: "Inter_700Bold",
      color: "#92400e",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      flex: 1,
    },
    resultContent: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.exampleBadge}>
          <Text style={s.exampleBadgeText}>Example</Text>
        </View>
        <Text style={s.headerTitle}>Your Coaching</Text>
      </View>
      <View style={s.resultContent}>
        <CoachingResultCard
          result={EXAMPLE_RESULT}
          onReset={() => router.back()}
          ctaButton={{
            label: "Get Your Own Coaching",
            onPress: () => router.push("/paywall"),
          }}
        />
      </View>
    </View>
  );
}
