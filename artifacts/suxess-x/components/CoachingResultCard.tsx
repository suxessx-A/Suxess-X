import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { CoachingResult, CoachingSection } from "@/context/CoachingContext";

interface CoachingResultCardProps {
  result: CoachingResult;
  onReset: () => void;
}

const SECTION_ICON = "🔹";

function SectionCard({ section, index, colors }: { section: CoachingSection; index: number; colors: ReturnType<typeof useColors> }) {
  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 20,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      gap: 8,
    },
    icon: {
      fontSize: 14,
    },
    title: {
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      color: colors.primary,
      textTransform: "uppercase",
      letterSpacing: 0.9,
      flex: 1,
    },
    content: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      lineHeight: 23,
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.icon}>{SECTION_ICON}</Text>
        <Text style={styles.title}>{section.title}</Text>
      </View>
      <Text style={styles.content}>{section.content}</Text>
    </View>
  );
}

export function CoachingResultCard({ result, onReset }: CoachingResultCardProps) {
  const colors = useColors();

  const styles = StyleSheet.create({
    scroll: {
      flex: 1,
    },
    headlineBand: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 20,
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    headlineLabel: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: "rgba(255,255,255,0.6)",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 8,
    },
    headline: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      color: "#ffffff",
      lineHeight: 28,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 20,
      marginTop: 4,
    },
    sectionHeader: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 14,
    },
    affirmationBox: {
      backgroundColor: colors.surface1,
      borderRadius: colors.radius,
      paddingVertical: 20,
      paddingHorizontal: 20,
      marginTop: 8,
      marginBottom: 12,
      alignItems: "center",
    },
    affirmationQuote: {
      fontSize: 22,
      color: "rgba(255,255,255,0.4)",
      fontFamily: "Inter_700Bold",
      alignSelf: "flex-start",
      lineHeight: 22,
      marginBottom: 4,
    },
    affirmationText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: "#ffffff",
      textAlign: "center",
      lineHeight: 24,
    },
    nextStepBox: {
      backgroundColor: colors.goldLight,
      borderRadius: colors.radius,
      paddingVertical: 18,
      paddingHorizontal: 18,
      marginBottom: 28,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    nextStepIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.gold,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      marginTop: 1,
    },
    nextStepIcon: {
      fontSize: 15,
    },
    nextStepContent: {
      flex: 1,
    },
    nextStepLabel: {
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      color: colors.gold,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
    },
    nextStepText: {
      fontSize: 15,
      fontFamily: "Inter_500Medium",
      color: "#78350f",
      lineHeight: 22,
    },
    resetButton: {
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 15,
      alignItems: "center",
      marginBottom: 32,
    },
    resetButtonText: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
    },
  });

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.headlineBand}>
        <Text style={styles.headlineLabel}>Your Coaching</Text>
        <Text style={styles.headline}>{result.headline}</Text>
      </View>

      <Text style={styles.sectionHeader}>Breakdown</Text>

      {result.sections.map((section, i) => (
        <SectionCard key={i} section={section} index={i} colors={colors} />
      ))}

      <View style={styles.divider} />

      <View style={styles.affirmationBox}>
        <Text style={styles.affirmationQuote}>"</Text>
        <Text style={styles.affirmationText}>{result.affirmation}</Text>
      </View>

      <View style={styles.nextStepBox}>
        <View style={styles.nextStepIconWrap}>
          <Text style={styles.nextStepIcon}>⚡</Text>
        </View>
        <View style={styles.nextStepContent}>
          <Text style={styles.nextStepLabel}>Your Next Move</Text>
          <Text style={styles.nextStepText}>{result.nextStep}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={onReset} activeOpacity={0.8}>
        <Text style={styles.resetButtonText}>Start a New Flow</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
