import React, { useState, useEffect } from "react";
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
import { useCoaching, CoachingStrategy, StrategyRecommendation } from "@/context/CoachingContext";
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

const STRATEGY_META: Record<CoachingStrategy, { icon: string; color: string; bg: string; border: string; description: string }> = {
  DIRECT_CONVERSATION: {
    icon: "⚡",
    color: "#7c3aed",
    bg: "#faf5ff",
    border: "#ddd6fe",
    description: "Use your position to name the issue, set a clear expectation, and get a direct response.",
  },
  INDIRECT_INFLUENCE: {
    icon: "♟",
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#bae6fd",
    description: "Shift perception, build allies, and reposition without a direct confrontation.",
  },
  STRATEGIC_CONTAINMENT: {
    icon: "🛡",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
    description: "Protect your reputation, document patterns, and manage risk without escalating.",
  },
};

function StrategyCard({
  option,
  isRecommended,
  isSelected,
  onPress,
}: {
  option: { type: CoachingStrategy; label: string };
  isRecommended: boolean;
  isSelected: boolean;
  onPress: () => void;
}) {
  const meta = STRATEGY_META[option.type];

  const s = StyleSheet.create({
    wrap: {
      borderRadius: 14,
      borderWidth: isSelected ? 2 : 1.5,
      borderColor: isSelected ? meta.color : meta.border,
      backgroundColor: isSelected ? meta.bg : "#fff",
      marginBottom: 10,
      overflow: "hidden",
    },
    recommendedBadge: {
      backgroundColor: meta.color,
      paddingVertical: 5,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    recommendedBadgeText: {
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      color: "#fff",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    body: {
      paddingVertical: 16,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isSelected ? meta.color : meta.border,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    icon: { fontSize: 18 },
    textWrap: { flex: 1 },
    label: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: "#1a1a2e",
      marginBottom: 4,
    },
    desc: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: "#4b5563",
      lineHeight: 19,
    },
    checkDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: meta.color,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    checkDotText: { fontSize: 11, color: "#fff", fontFamily: "Inter_700Bold" },
    emptyDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: "#d1d5db",
      marginTop: 10,
    },
  });

  return (
    <TouchableOpacity style={s.wrap} onPress={onPress} activeOpacity={0.82}>
      {isRecommended && (
        <View style={s.recommendedBadge}>
          <Text style={s.recommendedBadgeText}>★  Recommended for your situation</Text>
        </View>
      )}
      <View style={s.body}>
        <View style={s.iconWrap}>
          <Text style={s.icon}>{meta.icon}</Text>
        </View>
        <View style={s.textWrap}>
          <Text style={s.label}>{option.label}</Text>
          <Text style={s.desc}>{meta.description}</Text>
        </View>
        {isSelected ? (
          <View style={s.checkDot}><Text style={s.checkDotText}>✓</Text></View>
        ) : (
          <View style={s.emptyDot} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function StrategyPickerScreen({
  recommendation,
  onChoose,
  onBack,
  flowTitle,
  error,
}: {
  recommendation: StrategyRecommendation;
  onChoose: (strategy: CoachingStrategy) => void;
  onBack: () => void;
  flowTitle: string;
  error: string | null;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const [selected, setSelected] = useState<CoachingStrategy>(recommendation.recommendedStrategy);
  const selectedMeta = STRATEGY_META[selected];
  const whyText = recommendation.assessment[selected];

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
    backButton: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.secondary,
      alignItems: "center", justifyContent: "center", marginRight: 14,
    },
    backArrow: { fontSize: 18, color: colors.primary },
    headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: colors.foreground, flex: 1 },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 22 },
    eyebrow: {
      fontSize: 11, fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground, textTransform: "uppercase",
      letterSpacing: 1.2, marginBottom: 6,
    },
    title: {
      fontSize: 21, fontFamily: "Inter_700Bold",
      color: colors.foreground, lineHeight: 28, marginBottom: 16,
    },
    reasonCard: {
      backgroundColor: selectedMeta.bg,
      borderRadius: 12,
      borderLeftWidth: 3,
      borderLeftColor: selectedMeta.color,
      padding: 14,
      marginBottom: 20,
    },
    reasonLabel: {
      fontSize: 10, fontFamily: "Inter_700Bold",
      color: selectedMeta.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5,
    },
    reasonText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#1a1a2e", lineHeight: 20 },
    optionLabel: {
      fontSize: 11, fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground, textTransform: "uppercase",
      letterSpacing: 1.2, marginBottom: 10,
    },
    errorBox: { backgroundColor: "#fef2f2", borderRadius: 12, padding: 14, marginBottom: 16 },
    errorText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#b91c1c", textAlign: "center" },
    footer: {
      paddingHorizontal: 20, paddingTop: 16,
      paddingBottom: bottomInset + 12,
      borderTopWidth: 1, borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    generateBtn: {
      backgroundColor: selected ? colors.primary : colors.border,
      borderRadius: colors.radius, paddingVertical: 17, alignItems: "center",
    },
    generateBtnText: {
      fontSize: 16, fontFamily: "Inter_600SemiBold",
      color: selected ? "#ffffff" : colors.mutedForeground,
    },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={onBack}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{flowTitle}</Text>
      </View>
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.eyebrow}>Strategy Assessment</Text>
        <Text style={s.title}>Choose your approach</Text>

        <View style={s.reasonCard}>
          <Text style={s.reasonLabel}>Why this approach</Text>
          <Text style={s.reasonText}>{whyText}</Text>
        </View>

        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <Text style={s.optionLabel}>Your options</Text>

        {recommendation.options.map((option) => (
          <StrategyCard
            key={option.type}
            option={option}
            isRecommended={option.type === recommendation.recommendedStrategy}
            isSelected={selected === option.type}
            onPress={() => { Haptics.selectionAsync(); setSelected(option.type); }}
          />
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={s.generateBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onChoose(selected); }}
          activeOpacity={0.85}
        >
          <Text style={s.generateBtnText}>Generate My Coaching</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FlowScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    activeFlow, answers, recommendation, result,
    isEvaluating, isLoading, error,
    setAnswer, evaluateFlow, submitFlow, resetFlow,
  } = useCoaching();
  const [currentStep, setCurrentStep] = useState(0);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (!activeFlow) {
      router.replace("/");
    }
  }, [activeFlow]);

  useEffect(() => {
    setCurrentStep(0);
  }, [activeFlow]);

  if (!activeFlow) return null;

  const flowSteps = flows[activeFlow] ?? [];
  const step = flowSteps[currentStep];
  const totalSteps = flowSteps.length;
  const selectedOption = step ? answers[step.key] : undefined;
  const isLastStep = currentStep === totalSteps - 1;

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    else resetFlow();
  };

  const handleBackFromPicker = () => {
    setCurrentStep(totalSteps - 1);
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
      await evaluateFlow();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  useEffect(() => {
    if (recommendation && !result && !isLoading && recommendation.problemType !== "INTERPERSONAL") {
      submitFlow(null);
    }
  }, [recommendation]);

  const handleChooseStrategy = (strategy: CoachingStrategy) => {
    submitFlow(strategy);
  };

  const handleReset = () => {
    resetFlow();
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row", alignItems: "center",
      paddingTop: topInset + 8, paddingBottom: 16, paddingHorizontal: 20,
      backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backButton: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center", marginRight: 14,
    },
    backArrow: { fontSize: 18, color: colors.primary },
    headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: colors.foreground, flex: 1 },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
    questionLabel: {
      fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground,
      textTransform: "uppercase", letterSpacing: 1, marginBottom: 10,
    },
    question: {
      fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground, lineHeight: 28, marginBottom: 24,
    },
    optionsScroll: { flex: 1 },
    footer: {
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: bottomInset + 12,
      borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background,
    },
    nextButton: {
      backgroundColor: selectedOption ? colors.primary : colors.border,
      borderRadius: colors.radius, paddingVertical: 17, alignItems: "center",
    },
    nextButtonText: {
      fontSize: 16, fontFamily: "Inter_600SemiBold",
      color: selectedOption ? "#ffffff" : colors.mutedForeground,
    },
    loadingContainer: {
      flex: 1, alignItems: "center", justifyContent: "center", padding: 40,
    },
    loadingText: {
      fontSize: 17, fontFamily: "Inter_500Medium", color: colors.primary, marginTop: 20, textAlign: "center",
    },
    loadingSubtext: {
      fontSize: 14, fontFamily: "Inter_400Regular",
      color: colors.mutedForeground, marginTop: 8, textAlign: "center",
    },
    errorBox: { backgroundColor: "#fef2f2", borderRadius: 12, padding: 16, marginBottom: 20 },
    errorText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#b91c1c", textAlign: "center" },
    resultContent: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  });

  if (isEvaluating) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.backButton} />
          <Text style={styles.headerTitle}>{flowTitles[activeFlow]}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analysing your situation...</Text>
          <Text style={styles.loadingSubtext}>Determining the highest-leverage approach</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.backButton} />
          <Text style={styles.headerTitle}>{flowTitles[activeFlow]}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Generating your coaching...</Text>
          <Text style={styles.loadingSubtext}>Personalizing your strategy</Text>
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

  if (recommendation) {
    return (
      <StrategyPickerScreen
        recommendation={recommendation}
        onChoose={handleChooseStrategy}
        onBack={handleBackFromPicker}
        flowTitle={flowTitles[activeFlow]}
        error={error}
      />
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
        <ProgressBar current={currentStep + 1} total={totalSteps} label="Step" />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {step ? (
          <>
            <Text style={styles.questionLabel}>Question {currentStep + 1}</Text>
            <Text style={styles.question}>{step.question}</Text>
            <ScrollView style={styles.optionsScroll} showsVerticalScrollIndicator={false}>
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
            {isLastStep ? "Analyse My Situation" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
