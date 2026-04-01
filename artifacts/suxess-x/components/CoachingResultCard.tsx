import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";
import { CoachingResult, CoachingScript, CoachingStrategy } from "@/context/CoachingContext";

interface CoachingResultCardProps {
  result: CoachingResult;
  onReset: () => void;
}

const STRATEGY_CONFIG: Record<CoachingStrategy, {
  label: string;
  description: string;
  color: string;
  bg: string;
  icon: string;
}> = {
  DIRECT_CONVERSATION: {
    label: "Direct Conversation",
    description: "You have the leverage. Use it.",
    color: "#7c3aed",
    bg: "#faf5ff",
    icon: "⚡",
  },
  INDIRECT_INFLUENCE: {
    label: "Indirect Influence",
    description: "Positioning and influence will move this faster than confrontation.",
    color: "#0369a1",
    bg: "#f0f9ff",
    icon: "♟",
  },
  STRATEGIC_CONTAINMENT: {
    label: "Strategic Containment",
    description: "Protect your position. Do not escalate directly.",
    color: "#b45309",
    bg: "#fffbeb",
    icon: "🛡",
  },
};

function StrategyBadge({ strategy }: { strategy: CoachingStrategy }) {
  const cfg = STRATEGY_CONFIG[strategy];
  const s = StyleSheet.create({
    wrap: {
      backgroundColor: cfg.bg,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: cfg.color,
      padding: 16,
      marginBottom: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: cfg.color,
      alignItems: "center",
      justifyContent: "center",
    },
    icon: { fontSize: 18, color: "#fff" },
    textWrap: { flex: 1 },
    eyebrow: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: cfg.color, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 3 },
    label: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#1a1a2e" },
    desc: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#4b5563", marginTop: 2, lineHeight: 18 },
  });
  return (
    <View style={s.wrap}>
      <View style={s.iconWrap}><Text style={s.icon}>{cfg.icon}</Text></View>
      <View style={s.textWrap}>
        <Text style={s.eyebrow}>Strategy Selected</Text>
        <Text style={s.label}>{cfg.label}</Text>
        <Text style={s.desc}>{cfg.desc}</Text>
      </View>
    </View>
  );
}

function Block({ label, color, bg, children }: { label: string; color: string; bg: string; children: React.ReactNode }) {
  const s = StyleSheet.create({
    card: { borderRadius: 14, marginBottom: 10, overflow: "hidden" },
    header: { backgroundColor: color, paddingVertical: 10, paddingHorizontal: 16 },
    headerText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff", textTransform: "uppercase", letterSpacing: 1 },
    body: { backgroundColor: bg, paddingVertical: 14, paddingHorizontal: 16 },
  });
  return (
    <View style={s.card}>
      <View style={s.header}><Text style={s.headerText}>{label}</Text></View>
      <View style={s.body}>{children}</View>
    </View>
  );
}

function BodyText({ children }: { children: string }) {
  return <Text style={{ fontSize: 15, fontFamily: "Inter_400Regular", color: "#1a1a2e", lineHeight: 24 }}>{children}</Text>;
}

function ScriptSection({ script, strategy }: { script: CoachingScript; strategy: CoachingStrategy }) {
  const cfg = STRATEGY_CONFIG[strategy];
  const s = StyleSheet.create({
    card: { borderRadius: 14, marginBottom: 10, overflow: "hidden" },
    header: { backgroundColor: cfg.color, paddingVertical: 10, paddingHorizontal: 16 },
    headerText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff", textTransform: "uppercase", letterSpacing: 1 },
    body: { backgroundColor: "#f0f9ff", paddingTop: 14, paddingBottom: 14, paddingHorizontal: 16 },
    row: { marginBottom: 14 },
    rowLast: { marginBottom: 0 },
    label: { fontSize: 10, fontFamily: "Inter_700Bold", color: cfg.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 },
    pushBackLabel: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#dc2626", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 },
    quote: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1a1a2e", lineHeight: 23, borderLeftWidth: 3, borderLeftColor: cfg.color, paddingLeft: 12, paddingVertical: 3 },
    pushBackQuote: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1a1a2e", lineHeight: 23, borderLeftWidth: 3, borderLeftColor: "#dc2626", paddingLeft: 12, paddingVertical: 3 },
    divider: { height: 1, backgroundColor: "#bfdbfe", marginBottom: 14 },
  });

  const lines: { label: string; text: string; isPushback?: boolean }[] = [
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
            <Text style={line.isPushback ? s.pushBackLabel : s.label}>{line.label}</Text>
            <Text style={line.isPushback ? s.pushBackQuote : s.quote}>"{line.text}"</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TacticsList({ tactics, strategy }: { tactics: string[]; strategy: CoachingStrategy }) {
  const cfg = STRATEGY_CONFIG[strategy];
  const label =
    strategy === "DIRECT_CONVERSATION" ? "What to Do"
    : strategy === "INDIRECT_INFLUENCE" ? "Authority Move"
    : "Containment Moves";

  const s = StyleSheet.create({
    card: { borderRadius: 14, marginBottom: 10, overflow: "hidden" },
    header: { backgroundColor: cfg.color, paddingVertical: 10, paddingHorizontal: 16 },
    headerText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff", textTransform: "uppercase", letterSpacing: 1 },
    body: { backgroundColor: cfg.bg, paddingVertical: 14, paddingHorizontal: 16 },
    tactic: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#1a1a2e", lineHeight: 24, marginBottom: 10 },
    tacticLast: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#1a1a2e", lineHeight: 24 },
  });

  return (
    <View style={s.card}>
      <View style={s.header}><Text style={s.headerText}>{label}</Text></View>
      <View style={s.body}>
        {tactics.map((t, i) => (
          <Text key={i} style={i === tactics.length - 1 ? s.tacticLast : s.tactic}>{t}</Text>
        ))}
      </View>
    </View>
  );
}

export function CoachingResultCard({ result, onReset }: CoachingResultCardProps) {
  const colors = useColors();
  const cfg = STRATEGY_CONFIG[result.strategy];

  const s = StyleSheet.create({
    scroll: { flex: 1 },
    groupLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10, marginTop: 6 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
    affirmationBox: { backgroundColor: cfg.color, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 20, marginBottom: 10 },
    affirmationLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 },
    affirmationText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff", lineHeight: 24 },
    nextBox: { backgroundColor: colors.goldLight, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 18, marginBottom: 28, flexDirection: "row", alignItems: "flex-start" },
    nextIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", marginRight: 13, marginTop: 2 },
    nextIcon: { fontSize: 16 },
    nextContent: { flex: 1 },
    nextLabel: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#92400e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
    nextText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#78350f", lineHeight: 22 },
    resetBtn: { borderWidth: 2, borderColor: colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginBottom: 36 },
    resetBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.primary },
  });

  return (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      <StrategyBadge strategy={result.strategy} />

      <Block label="Executive Breakdown" color="#374151" bg="#f9fafb">
        <BodyText>{result.reframe}</BodyText>
        {result.breakdown ? (
          <Text style={{ fontSize: 15, fontFamily: "Inter_400Regular", color: "#4b5563", lineHeight: 24, marginTop: 10 }}>
            {result.breakdown}
          </Text>
        ) : null}
      </Block>

      {result.script && (
        <ScriptSection script={result.script} strategy={result.strategy} />
      )}

      <TacticsList tactics={result.tactics} strategy={result.strategy} />

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
