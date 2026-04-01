import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";
import { CoachingResult, CoachingScript, CoachingStrategy, ProblemType } from "@/context/CoachingContext";

interface CoachingResultCardProps {
  result: CoachingResult;
  onReset: () => void;
}

type ThemeConfig = { color: string; bg: string; border: string };

const STRATEGY_THEME: Record<CoachingStrategy, ThemeConfig & { label: string; icon: string; eyebrow: string }> = {
  DIRECT_CONVERSATION: { label: "Direct Conversation", eyebrow: "Strategy", icon: "⚡", color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe" },
  INDIRECT_INFLUENCE:  { label: "Indirect Influence",  eyebrow: "Strategy", icon: "♟", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  STRATEGIC_CONTAINMENT: { label: "Strategic Containment", eyebrow: "Strategy", icon: "🛡", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
};

const PROBLEM_TYPE_THEME: Record<ProblemType, ThemeConfig & { label: string; icon: string; eyebrow: string }> = {
  INTERPERSONAL: { label: "Interpersonal",   eyebrow: "Problem Type", icon: "💬", color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe" },
  POSITIONING:   { label: "Positioning",     eyebrow: "Problem Type", icon: "♟", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  PERFORMANCE:   { label: "Performance",     eyebrow: "Problem Type", icon: "⚙", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  INTERNAL:      { label: "Mindset & State", eyebrow: "Problem Type", icon: "🧠", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
};

const SECTION_ICONS: Record<string, string> = {
  "Visibility Gap": "👁",
  "Value Signals": "📣",
  "Positioning Moves": "♟",
  "Root Cause": "🔍",
  "Execution System": "⚙",
  "Priority Shift": "⚡",
  "The Pattern": "🪞",
  "Reframe": "🔄",
  "State Tools": "🛠",
  "What to Do": "✅",
  "Authority Move": "♟",
  "Containment Moves": "🛡",
};

function HeaderBadge({ result }: { result: CoachingResult }) {
  const theme = result.strategy
    ? STRATEGY_THEME[result.strategy]
    : PROBLEM_TYPE_THEME[result.problemType];
  const ptTheme = PROBLEM_TYPE_THEME[result.problemType];

  const s = StyleSheet.create({
    wrap: {
      borderRadius: 14, borderWidth: 1.5, borderColor: theme.border,
      backgroundColor: theme.bg, padding: 16, marginBottom: 14,
      flexDirection: "row", alignItems: "center", gap: 12,
    },
    iconWrap: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: theme.color, alignItems: "center", justifyContent: "center",
    },
    icon: { fontSize: 18, color: "#fff" },
    textWrap: { flex: 1 },
    eyebrow: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: theme.color, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 2 },
    label: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#1a1a2e" },
    sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6b7280", marginTop: 2 },
  });

  return (
    <View style={s.wrap}>
      <View style={s.iconWrap}><Text style={s.icon}>{theme.icon}</Text></View>
      <View style={s.textWrap}>
        <Text style={s.eyebrow}>{theme.eyebrow}</Text>
        <Text style={s.label}>{theme.label}</Text>
        {result.strategy && result.problemType !== "INTERPERSONAL" && (
          <Text style={s.sub}>{ptTheme.label}</Text>
        )}
        {!result.strategy && (
          <Text style={s.sub}>Tailored for your situation</Text>
        )}
      </View>
    </View>
  );
}

function BreakdownBlock({ reframe, breakdown }: { reframe: string; breakdown: string }) {
  const s = StyleSheet.create({
    card: { borderRadius: 14, marginBottom: 10, overflow: "hidden" },
    header: { backgroundColor: "#374151", paddingVertical: 10, paddingHorizontal: 16 },
    headerText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff", textTransform: "uppercase", letterSpacing: 1 },
    body: { backgroundColor: "#f9fafb", paddingVertical: 14, paddingHorizontal: 16 },
    reframe: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1a1a2e", lineHeight: 23 },
    breakdown: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#4b5563", lineHeight: 22, marginTop: 10 },
  });
  return (
    <View style={s.card}>
      <View style={s.header}><Text style={s.headerText}>Executive Breakdown</Text></View>
      <View style={s.body}>
        <Text style={s.reframe}>{reframe}</Text>
        {breakdown ? <Text style={s.breakdown}>{breakdown}</Text> : null}
      </View>
    </View>
  );
}

function ScriptSection({ script, strategy }: { script: CoachingScript; strategy: CoachingStrategy }) {
  const cfg = STRATEGY_THEME[strategy];
  const s = StyleSheet.create({
    card: { borderRadius: 14, marginBottom: 10, overflow: "hidden" },
    header: { backgroundColor: cfg.color, paddingVertical: 10, paddingHorizontal: 16 },
    headerText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff", textTransform: "uppercase", letterSpacing: 1 },
    body: { backgroundColor: "#f0f9ff", paddingTop: 14, paddingBottom: 14, paddingHorizontal: 16 },
    row: { marginBottom: 14 },
    rowLast: { marginBottom: 0 },
    label: { fontSize: 10, fontFamily: "Inter_700Bold", color: cfg.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 },
    pushLabel: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#dc2626", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 },
    quote: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1a1a2e", lineHeight: 23, borderLeftWidth: 3, borderLeftColor: cfg.color, paddingLeft: 12, paddingVertical: 3 },
    pushQuote: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1a1a2e", lineHeight: 23, borderLeftWidth: 3, borderLeftColor: "#dc2626", paddingLeft: 12, paddingVertical: 3 },
    divider: { height: 1, backgroundColor: "#bfdbfe", marginBottom: 14 },
  });
  const lines = [
    { label: "Opening", text: script.opening },
    { label: "The Issue", text: script.issue },
    { label: "The Impact", text: script.impact },
    { label: "What You Need", text: script.ask },
    { label: "If They Push Back", text: script.pushback, isPushback: true },
  ];
  return (
    <View style={s.card}>
      <View style={s.header}><Text style={s.headerText}>💬  What to Say</Text></View>
      <View style={s.body}>
        {lines.map((line, i) => (
          <View key={i} style={i === lines.length - 1 ? s.rowLast : s.row}>
            {line.isPushback && <View style={s.divider} />}
            <Text style={line.isPushback ? s.pushLabel : s.label}>{line.label}</Text>
            <Text style={line.isPushback ? s.pushQuote : s.quote}>"{line.text}"</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SectionCard({ section, problemType, strategy }: {
  section: { title: string; content: string };
  problemType: ProblemType;
  strategy: CoachingStrategy | null;
}) {
  const baseTheme = strategy ? STRATEGY_THEME[strategy] : PROBLEM_TYPE_THEME[problemType];
  const icon = SECTION_ICONS[section.title] ?? "▸";

  const s = StyleSheet.create({
    card: { borderRadius: 14, marginBottom: 10, overflow: "hidden" },
    header: { backgroundColor: baseTheme.color, paddingVertical: 10, paddingHorizontal: 16 },
    headerText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff", textTransform: "uppercase", letterSpacing: 1 },
    body: { backgroundColor: baseTheme.bg, paddingVertical: 14, paddingHorizontal: 16 },
    content: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#1a1a2e", lineHeight: 24 },
  });

  return (
    <View style={s.card}>
      <View style={s.header}>
        <Text style={s.headerText}>{icon}  {section.title}</Text>
      </View>
      <View style={s.body}>
        <Text style={s.content}>{section.content}</Text>
      </View>
    </View>
  );
}

export function CoachingResultCard({ result, onReset }: CoachingResultCardProps) {
  const colors = useColors();

  const s = StyleSheet.create({
    scroll: { flex: 1 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
    nextBox: {
      backgroundColor: colors.goldLight, borderRadius: 16,
      paddingVertical: 18, paddingHorizontal: 18, marginBottom: 28,
      flexDirection: "row", alignItems: "flex-start",
    },
    nextIconWrap: {
      width: 34, height: 34, borderRadius: 17, backgroundColor: colors.gold,
      alignItems: "center", justifyContent: "center", marginRight: 13, marginTop: 2,
    },
    nextIcon: { fontSize: 16 },
    nextContent: { flex: 1 },
    nextLabel: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#92400e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
    nextText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#78350f", lineHeight: 22 },
    resetBtn: { borderWidth: 2, borderColor: colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginBottom: 36 },
    resetBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.primary },
  });

  return (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      <HeaderBadge result={result} />

      <BreakdownBlock reframe={result.reframe} breakdown={result.breakdown} />

      {result.script && result.strategy && (
        <ScriptSection script={result.script} strategy={result.strategy} />
      )}

      {result.sections.map((section, i) => (
        <SectionCard
          key={i}
          section={section}
          problemType={result.problemType}
          strategy={result.strategy}
        />
      ))}

      <View style={s.divider} />

      <View style={s.nextBox}>
        <View style={s.nextIconWrap}><Text style={s.nextIcon}>⚡</Text></View>
        <View style={s.nextContent}>
          <Text style={s.nextLabel}>Next 24 Hours</Text>
          <Text style={s.nextText}>{result.nextSteps.join("\n")}</Text>
        </View>
      </View>

      <TouchableOpacity style={s.resetBtn} onPress={onReset} activeOpacity={0.8}>
        <Text style={s.resetBtnText}>Start a New Flow</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
