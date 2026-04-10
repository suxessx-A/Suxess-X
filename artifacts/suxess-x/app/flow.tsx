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
  speak_up: "Speak Up",
  executive_visibility: "Executive Visibility",
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

const RISK_CONFIG = {
  LOW:    { color: "#059669", bg: "#f0fdf4", border: "#a7f3d0", label: "LOW RISK" },
  MEDIUM: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "MEDIUM RISK" },
  HIGH:   { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "HIGH RISK" },
};

function SituationDiagnosisCard({ recommendation }: { recommendation: StrategyRecommendation }) {
  if (!recommendation.powerDiagnosis && !recommendation.outcomeGoal) return null;
  const risk = recommendation.riskLevel ? RISK_CONFIG[recommendation.riskLevel] : null;

  const s = StyleSheet.create({
    card: {
      borderRadius: 14, borderWidth: 1.5, borderColor: "#e5e7eb",
      backgroundColor: "#f8fafc", marginBottom: 14, overflow: "hidden",
    },
    headerRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingVertical: 10, paddingHorizontal: 14,
      backgroundColor: "#1a1a2e",
    },
    headerLabel: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff", textTransform: "uppercase", letterSpacing: 1.2 },
    riskBadge: {
      borderRadius: 6, paddingVertical: 3, paddingHorizontal: 9,
      backgroundColor: risk?.color ?? "#6b7280",
    },
    riskText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff", textTransform: "uppercase", letterSpacing: 1 },
    body: { paddingVertical: 14, paddingHorizontal: 14 },
    rowLabel: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#7c3aed", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
    rowText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#1a1a2e", lineHeight: 20, marginBottom: 12 },
    rowTextLast: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#1a1a2e", lineHeight: 20 },
    divider: { height: 1, backgroundColor: "#e5e7eb", marginBottom: 12 },
  });

  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <Text style={s.headerLabel}>Situation Analysis</Text>
        {risk && <View style={s.riskBadge}><Text style={s.riskText}>{risk.label}</Text></View>}
      </View>
      <View style={s.body}>
        {recommendation.powerDiagnosis ? (
          <>
            <Text style={s.rowLabel}>Power Dynamics</Text>
            <Text style={recommendation.outcomeGoal ? s.rowText : s.rowTextLast}>{recommendation.powerDiagnosis}</Text>
          </>
        ) : null}
        {recommendation.outcomeGoal ? (
          <>
            {recommendation.powerDiagnosis && <View style={s.divider} />}
            <Text style={s.rowLabel}>Success Looks Like</Text>
            <Text style={s.rowTextLast}>{recommendation.outcomeGoal}</Text>
          </>
        ) : null}
      </View>
    </View>
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
  const whenNotText = recommendation.whenNotTo?.[selected];

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
      color: colors.foreground, lineHeight: 28, marginBottom: 14,
    },
    reasonCard: {
      backgroundColor: selectedMeta.bg,
      borderRadius: 12,
      borderLeftWidth: 3,
      borderLeftColor: selectedMeta.color,
      padding: 14,
      marginBottom: 14,
    },
    reasonLabel: {
      fontSize: 10, fontFamily: "Inter_700Bold",
      color: selectedMeta.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5,
    },
    reasonText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#1a1a2e", lineHeight: 20 },
    whenNotRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: selectedMeta.border },
    whenNotIcon: { fontSize: 13, marginTop: 1 },
    whenNotWrap: { flex: 1 },
    whenNotLabel: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#dc2626", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
    whenNotText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#374151", lineHeight: 19 },
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

        <SituationDiagnosisCard recommendation={recommendation} />

        <View style={s.reasonCard}>
          <Text style={s.reasonLabel}>Why this approach</Text>
          <Text style={s.reasonText}>{whyText}</Text>
          {whenNotText ? (
            <View style={s.whenNotRow}>
              <Text style={s.whenNotIcon}>⚠</Text>
              <View style={s.whenNotWrap}>
                <Text style={s.whenNotLabel}>When NOT to use this</Text>
                <Text style={s.whenNotText}>{whenNotText}</Text>
              </View>
            </View>
          ) : null}
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
    setCurrentStep(0);
  }, [activeFlow]);

  useEffect(() => {
    if (recommendation && !result && !isLoading && recommendation.problemType !== "AVOIDING_CHALLENGER") {
      submitFlow(null);
    }
  }, [recommendation]);

  if (!activeFlow) return null;

  const flowSteps = flows[activeFlow] ?? [];
  const step = flowSteps[currentStep];
  const totalSteps = flowSteps.length;
  const isLastStep = currentStep === totalSteps - 1;

  const isMultiSelect = step?.multiSelect === true;
  const minSelect = step?.minSelect ?? 1;
  const maxSelect = step?.maxSelect ?? 1;

  const selectedSingle: string | undefined = step && !isMultiSelect
    ? (answers[step.key] as string | undefined)
    : undefined;
  const selectedMulti: string[] = step && isMultiSelect
    ? (Array.isArray(answers[step.key]) ? (answers[step.key] as string[]) : [])
    : [];

  const canProceed = isMultiSelect
    ? selectedMulti.length >= minSelect
    : !!selectedSingle;

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    else { resetFlow(); router.back(); }
  };

  const handleBackFromPicker = () => {
    setCurrentStep(totalSteps - 1);
  };

  const handleSelect = (option: string) => {
    if (!step) return;
    Haptics.selectionAsync();
    if (isMultiSelect) {
      const current = Array.isArray(answers[step.key]) ? (answers[step.key] as string[]) : [];
      if (current.includes(option)) {
        setAnswer(step.key, current.filter((o) => o !== option));
      } else if (current.length < maxSelect) {
        setAnswer(step.key, [...current, option]);
      }
    } else {
      setAnswer(step.key, option);
    }
  };

  const handleNext = async () => {
    if (!canProceed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLastStep) {
      await evaluateFlow();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleChooseStrategy = (strategy: CoachingStrategy) => {
    submitFlow(strategy);
  };

  const handleReset = () => {
    resetFlow();
    router.back();
  };

  const multiSelectCountLabel = (() => {
    if (!isMultiSelect) return null;
    const count = selectedMulti.length;
    if (minSelect === maxSelect) return `${count} / ${maxSelect} selected`;
    return `${count} selected (${minSelect}–${maxSelect} required)`;
  })();

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
    phaseLabel: {
      fontSize: 11, fontFamily: "Inter_700Bold", color: colors.primary,
      textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4,
    },
    questionLabel: {
      fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground,
      textTransform: "uppercase", letterSpacing: 1, marginBottom: 10,
    },
    question: {
      fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground, lineHeight: 28, marginBottom: 6,
    },
    subtext: {
      fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginBottom: 20,
    },
    optionsScroll: { flex: 1 },
    countBadge: {
      alignSelf: "flex-end", marginBottom: 8,
      backgroundColor: canProceed ? "#f0fdf4" : "#f9fafb",
      borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10,
      borderWidth: 1, borderColor: canProceed ? "#bbf7d0" : "#e5e7eb",
    },
    countBadgeText: {
      fontSize: 12, fontFamily: "Inter_600SemiBold",
      color: canProceed ? "#15803d" : colors.mutedForeground,
    },
    footer: {
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: bottomInset + 12,
      borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background,
    },
    nextButton: {
      backgroundColor: canProceed ? colors.primary : colors.border,
      borderRadius: colors.radius, paddingVertical: 17, alignItems: "center",
    },
    nextButtonText: {
      fontSize: 16, fontFamily: "Inter_600SemiBold",
      color: canProceed ? "#ffffff" : colors.mutedForeground,
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
            {step.phase ? (
              <Text style={styles.phaseLabel}>{step.phase}</Text>
            ) : (
              <Text style={styles.questionLabel}>Question {currentStep + 1}</Text>
            )}
            <Text style={styles.question}>{step.question}</Text>
            {step.subtext ? (
              <Text style={styles.subtext}>{step.subtext}</Text>
            ) : null}
            <ScrollView style={styles.optionsScroll} showsVerticalScrollIndicator={false}>
              {multiSelectCountLabel ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{multiSelectCountLabel}</Text>
                </View>
              ) : null}
              {step.options.map((option) => (
                <OptionChip
                  key={option}
                  label={option}
                  selected={isMultiSelect ? selectedMulti.includes(option) : selectedSingle === option}
                  onPress={() => handleSelect(option)}
                  disabled={isMultiSelect && !selectedMulti.includes(option) && selectedMulti.length >= maxSelect}
                />
              ))}
              <View style={{ height: 8 }} />
            </ScrollView>
          </>
        ) : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          disabled={!canProceed}
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
