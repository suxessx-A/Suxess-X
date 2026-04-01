import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useCoaching } from "@/context/CoachingContext";
import { ProgressBar } from "@/components/ProgressBar";
import { OptionChip } from "@/components/OptionChip";
import { CoachingResultCard } from "@/components/CoachingResultCard";
import { flows } from "@/data/flows";

const flowTitles: Record<string, string> = {
  conversation: "Tough Conversation",
  stuck: "Career Clarity",
  visibility: "Step Up & Be Seen",
  negotiate: "Negotiate",
  mindset: "Mindset Reset",
};

export default function FlowScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeFlow, answers, setAnswer, submitFlow, result, isLoading, error, resetFlow } = useCoaching();
  const [currentStep, setCurrentStep] = useState(0);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  if (!activeFlow) {
    router.replace("/");
    return null;
  }

  const flowSteps = flows[activeFlow] ?? [];
  const step = flowSteps[currentStep];
  const totalSteps = flowSteps.length;
  const selectedOption = step ? answers[step.key] : undefined;
  const isLastStep = currentStep === totalSteps - 1;

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      resetFlow();
      router.back();
    }
  };

  const handleSelect = (option: string) => {
    if (!step) return;
    Haptics.selectionAsync();
    setAnswer(step.key, option);
  };

  const handleNext = async () => {
    if (!selectedOption) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLastStep) {
      await submitFlow();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleReset = () => {
    resetFlow();
    setCurrentStep(0);
    router.replace("/");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
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
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    backArrow: {
      fontSize: 18,
      color: colors.primary,
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    questionLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 10,
    },
    question: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      lineHeight: 28,
      marginBottom: 24,
    },
    optionsScroll: {
      flex: 1,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: bottomInset + 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    nextButton: {
      backgroundColor: selectedOption ? colors.primary : colors.border,
      borderRadius: colors.radius,
      paddingVertical: 17,
      alignItems: "center",
    },
    nextButtonText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: selectedOption ? "#ffffff" : colors.mutedForeground,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    loadingText: {
      fontSize: 17,
      fontFamily: "Inter_500Medium",
      color: colors.primary,
      marginTop: 20,
      textAlign: "center",
    },
    loadingSubtext: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 8,
      textAlign: "center",
    },
    errorBox: {
      backgroundColor: "#fef2f2",
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    errorText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: "#b91c1c",
      textAlign: "center",
    },
    resultContent: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 24,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.backButton} />
          <Text style={styles.headerTitle}>{flowTitles[activeFlow]}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Crafting your coaching...</Text>
          <Text style={styles.loadingSubtext}>Personalizing your guidance</Text>
        </View>
      </View>
    );
  }

  if (result) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleReset}>
            <Text style={styles.backArrow}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Coaching</Text>
        </View>
        <View style={styles.resultContent}>
          <CoachingResultCard result={result} onReset={handleReset} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{flowTitles[activeFlow]}</Text>
      </View>

      <View style={styles.content}>
        <ProgressBar
          current={currentStep + 1}
          total={totalSteps}
          label="Step"
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {step ? (
          <>
            <Text style={styles.questionLabel}>Question {currentStep + 1}</Text>
            <Text style={styles.question}>{step.question}</Text>

            <ScrollView
              style={styles.optionsScroll}
              showsVerticalScrollIndicator={false}
            >
              {step.options.map((option) => (
                <OptionChip
                  key={option}
                  label={option}
                  selected={selectedOption === option}
                  onPress={() => handleSelect(option)}
                />
              ))}
            </ScrollView>
          </>
        ) : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          disabled={!selectedOption}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>
            {isLastStep ? "Get My Coaching" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
