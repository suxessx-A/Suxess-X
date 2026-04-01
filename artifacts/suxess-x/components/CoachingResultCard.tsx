import React, { useState } from "react";
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

type SectionStyle = {
  icon: string;
  accentColor: string;
  backgroundColor: string;
  labelColor: string;
};

const SECTION_STYLES: Record<string, SectionStyle> = {
  "Where You're Playing Small": {
    icon: "🪞",
    accentColor: "#dc2626",
    backgroundColor: "#fff5f5",
    labelColor: "#b91c1c",
  },
  "Authority Shift": {
    icon: "⚡",
    accentColor: "#7c3aed",
    backgroundColor: "#faf5ff",
    labelColor: "#6d28d9",
  },
  "What to Say": {
    icon: "💬",
    accentColor: "#0369a1",
    backgroundColor: "#f0f9ff",
    labelColor: "#0369a1",
  },
  "What to Do": {
    icon: "✅",
    accentColor: "#15803d",
    backgroundColor: "#f0fdf4",
    labelColor: "#15803d",
  },
  "Bold Move": {
    icon: "🔥",
    accentColor: "#b45309",
    backgroundColor: "#fffbeb",
    labelColor: "#b45309",
  },
  "Consequence": {
    icon: "⚠️",
    accentColor: "#9a3412",
    backgroundColor: "#fff7ed",
    labelColor: "#9a3412",
  },
};

const DEFAULT_STYLE: SectionStyle = {
  icon: "🔹",
  accentColor: "#7c3aed",
  backgroundColor: "#faf5ff",
  labelColor: "#6d28d9",
};

function getSectionStyle(title: string): SectionStyle {
  for (const key of Object.keys(SECTION_STYLES)) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return SECTION_STYLES[key];
    }
  }
  return DEFAULT_STYLE;
}

function SectionCard({ section }: { section: CoachingSection }) {
  const s = getSectionStyle(section.title);
  const isScript = section.title.toLowerCase().includes("what to say");

  const styles = StyleSheet.create({
    card: {
      borderRadius: 14,
      marginBottom: 10,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: s.accentColor,
      paddingVertical: 10,
      paddingHorizontal: 16,
      gap: 8,
    },
    icon: {
      fontSize: 14,
    },
    title: {
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      color: "#ffffff",
      textTransform: "uppercase",
      letterSpacing: 1,
      flex: 1,
    },
    body: {
      backgroundColor: s.backgroundColor,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    content: {
      fontSize: 15,
      fontFamily: isScript ? "Inter_500Medium" : "Inter_400Regular",
      color: "#1a1a2e",
      lineHeight: 24,
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{s.icon}</Text>
        <Text style={styles.title}>{section.title}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.content}>{section.content}</Text>
      </View>
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
      borderRadius: 16,
      paddingVertical: 22,
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    headlineLabel: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: "rgba(255,255,255,0.55)",
      textTransform: "uppercase",
      letterSpacing: 1.4,
      marginBottom: 8,
    },
    headline: {
      fontSize: 21,
      fontFamily: "Inter_700Bold",
      color: "#ffffff",
      lineHeight: 29,
    },
    sectionGroupLabel: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 12,
      marginTop: 4,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    affirmationBox: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 22,
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    affirmationLabel: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: "rgba(255,255,255,0.55)",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 10,
    },
    affirmationText: {
      fontSize: 17,
      fontFamily: "Inter_600SemiBold",
      color: "#ffffff",
      lineHeight: 26,
    },
    nextStepBox: {
      backgroundColor: colors.goldLight,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 18,
      marginBottom: 24,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    nextStepIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.gold,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 13,
      marginTop: 2,
    },
    nextStepIcon: {
      fontSize: 16,
    },
    nextStepContent: {
      flex: 1,
    },
    nextStepLabel: {
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      color: "#92400e",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
    },
    nextStepText: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: "#78350f",
      lineHeight: 22,
    },
    resetButton: {
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 36,
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

      <Text style={styles.sectionGroupLabel}>Executive Breakdown</Text>

      {result.sections.map((section, i) => (
        <SectionCard key={i} section={section} />
      ))}

      <View style={styles.divider} />

      <View style={styles.affirmationBox}>
        <Text style={styles.affirmationLabel}>Remember This</Text>
        <Text style={styles.affirmationText}>{result.affirmation}</Text>
      </View>

      <View style={styles.nextStepBox}>
        <View style={styles.nextStepIconWrap}>
          <Text style={styles.nextStepIcon}>⚡</Text>
        </View>
        <View style={styles.nextStepContent}>
          <Text style={styles.nextStepLabel}>Your Next Move — Next 24 Hours</Text>
          <Text style={styles.nextStepText}>{result.nextStep}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={onReset} activeOpacity={0.8}>
        <Text style={styles.resetButtonText}>Start a New Flow</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
