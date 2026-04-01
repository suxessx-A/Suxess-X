import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { CoachingResult } from "@/context/CoachingContext";

interface CoachingResultCardProps {
  result: CoachingResult;
  onReset: () => void;
}

export function CoachingResultCard({ result, onReset }: CoachingResultCardProps) {
  const colors = useColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    headline: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 24,
      lineHeight: 30,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 18,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    sectionTitle: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    sectionContent: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      lineHeight: 22,
    },
    affirmationBox: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      padding: 20,
      marginTop: 8,
      marginBottom: 12,
      alignItems: "center",
    },
    affirmationText: {
      fontSize: 17,
      fontFamily: "Inter_600SemiBold",
      color: "#fff",
      textAlign: "center",
      lineHeight: 24,
    },
    nextStepBox: {
      backgroundColor: colors.goldLight,
      borderRadius: colors.radius,
      padding: 18,
      marginBottom: 24,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    nextStepIcon: {
      fontSize: 20,
      marginRight: 12,
      marginTop: 1,
    },
    nextStepContent: {
      flex: 1,
    },
    nextStepLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.gold,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    nextStepText: {
      fontSize: 15,
      fontFamily: "Inter_500Medium",
      color: "#92400e",
      lineHeight: 21,
    },
    resetButton: {
      backgroundColor: colors.secondary,
      borderRadius: colors.radius,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 20,
    },
    resetButtonText: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headline}>{result.headline}</Text>

      {result.sections.map((section, i) => (
        <View key={i} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionContent}>{section.content}</Text>
        </View>
      ))}

      <View style={styles.affirmationBox}>
        <Text style={styles.affirmationText}>{result.affirmation}</Text>
      </View>

      <View style={styles.nextStepBox}>
        <Text style={styles.nextStepIcon}>⚡</Text>
        <View style={styles.nextStepContent}>
          <Text style={styles.nextStepLabel}>Your Next Step</Text>
          <Text style={styles.nextStepText}>{result.nextStep}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={onReset} activeOpacity={0.8}>
        <Text style={styles.resetButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
