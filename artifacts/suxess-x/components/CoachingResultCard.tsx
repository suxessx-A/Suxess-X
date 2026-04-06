import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";
import { CoachingResult, CoachingScript, CoachingSection, CoachingStrategy, ProblemType } from "@/context/CoachingContext";

interface CoachingResultCardProps {
  result: CoachingResult;
  onReset: () => void;
}

type ThemeConfig = { color: string; bg: string; border: string };

const STRATEGY_THEME: Record<CoachingStrategy, ThemeConfig & { label: string; icon: string; eyebrow: string }> = {
  DIRECT_CONVERSATION: { label: "Challenge It Directly", eyebrow: "Challenger Mode", icon: "⚡", color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe" },
  INDIRECT_INFLUENCE:  { label: "Shift the Dynamic",    eyebrow: "Challenger Mode", icon: "♟", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  STRATEGIC_CONTAINMENT: { label: "Hold the Standard",  eyebrow: "Challenger Mode", icon: "🛡", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
};

const PROBLEM_TYPE_THEME: Record<ProblemType, ThemeConfig & { label: string; icon: string; eyebrow: string }> = {
  VICTIM:              { label: "Creator Activation",  eyebrow: "Role Shift",   icon: "🔥", color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe" },
  AVOIDING_CHALLENGER: { label: "Challenger Mode",      eyebrow: "Role Shift",   icon: "⚡", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  OVERWHELMED:         { label: "Momentum Reset",       eyebrow: "Role Shift",   icon: "🚀", color: "#059669", bg: "#f0fdf4", border: "#a7f3d0" },
};

const SECTION_ICONS: Record<string, string> = {
  "State Set": "🎯",
  "Script Variations": "💬",
  "Tactical Delivery": "📍",
  "Standard Setter": "✅",
  "Influence Moves": "♟",
  "Boundary Hold": "🛡",
  "Clarity Map": "🔍",
  "Direction Options": "🗺",
  "Outreach Scripts": "✉",
  "Follow-Up Strategy": "📋",
  "Ownership Shift": "🔥",
  "External Move": "⚡",
  "Direction Lock": "🎯",
  "State Change": "⚡",
  "Momentum List": "📋",
  "Back Online": "🚀",
  "What to Do": "✅",
  "Momentum Loop": "🔄",
};

function HeaderBadge({ result }: { result: CoachingResult }) {
  const theme = result.strategy
    ? STRATEGY_THEME[result.strategy]
    : PROBLEM_TYPE_THEME[result.problemType];

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
        <Text style={s.sub}>Tailored for your situation</Text>
      </View>
    </View>
  );
}

function ExecutionHeader({ roleShift, behavioralObjective, tacticalTools }: {
  roleShift?: string;
  behavioralObjective?: string;
  tacticalTools?: string[];
}) {
  if (!roleShift && !behavioralObjective && (!tacticalTools || tacticalTools.length === 0)) return null;

  const [from, to] = roleShift?.includes("→") ? roleShift.split("→").map((s) => s.trim()) : [roleShift, ""];

  const s = StyleSheet.create({
    card: {
      borderRadius: 14, borderWidth: 1.5, borderColor: "#1a1a2e",
      backgroundColor: "#1a1a2e", marginBottom: 10, overflow: "hidden",
    },
    shiftRow: {
      flexDirection: "row", alignItems: "center", flexWrap: "wrap",
      paddingVertical: 14, paddingHorizontal: 16, gap: 6,
    },
    shiftLabel: { fontSize: 10, fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, paddingHorizontal: 16, paddingTop: 14 },
    fromChip: {
      backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8,
      paddingVertical: 5, paddingHorizontal: 10,
    },
    fromText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.6)" },
    arrow: { fontSize: 16, color: "#d4a017", fontFamily: "Inter_700Bold" },
    toChip: {
      backgroundColor: "#7c3aed", borderRadius: 8,
      paddingVertical: 5, paddingHorizontal: 10,
    },
    toText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
    divider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginHorizontal: 16 },
    objectiveWrap: { paddingVertical: 12, paddingHorizontal: 16 },
    objectiveLabel: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#d4a017", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 },
    objectiveText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)", lineHeight: 20 },
    toolsWrap: { paddingBottom: 14, paddingHorizontal: 16 },
    toolsLabel: { fontSize: 10, fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
    toolsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    toolChip: {
      backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
      paddingVertical: 4, paddingHorizontal: 8,
    },
    toolText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.7)" },
  });

  return (
    <View style={s.card}>
      {roleShift ? (
        <>
          <Text style={s.shiftLabel}>Role Shift</Text>
          <View style={s.shiftRow}>
            {from ? <View style={s.fromChip}><Text style={s.fromText}>{from}</Text></View> : null}
            {to ? <Text style={s.arrow}>→</Text> : null}
            {to ? <View style={s.toChip}><Text style={s.toText}>{to}</Text></View> : null}
          </View>
        </>
      ) : null}

      {behavioralObjective ? (
        <>
          <View style={s.divider} />
          <View style={s.objectiveWrap}>
            <Text style={s.objectiveLabel}>Behavioral Objective</Text>
            <Text style={s.objectiveText}>{behavioralObjective}</Text>
          </View>
        </>
      ) : null}

      {tacticalTools && tacticalTools.length > 0 ? (
        <>
          <View style={s.divider} />
          <View style={s.toolsWrap}>
            <Text style={s.toolsLabel}>Tactical Tools</Text>
            <View style={s.toolsRow}>
              {tacticalTools.map((tool, i) => (
                <View key={i} style={s.toolChip}>
                  <Text style={s.toolText}>{tool}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      ) : null}
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
      <View style={s.header}><Text style={s.headerText}>Situation Analysis</Text></View>
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
    header: { backgroundColor: cfg.color, paddingVertical: 10, paddingHorizontal: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    headerText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff", textTransform: "uppercase", letterSpacing: 1 },
    headerSub: { fontSize: 9, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.8 },
    body: { backgroundColor: "#f0f9ff", paddingTop: 14, paddingBottom: 14, paddingHorizontal: 16 },
    row: { marginBottom: 16 },
    rowLast: { marginBottom: 0 },
    stepRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
    stepBadge: { backgroundColor: cfg.color, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    stepBadgeText: { fontSize: 8, fontFamily: "Inter_700Bold", color: "#fff", textTransform: "uppercase", letterSpacing: 0.8 },
    label: { fontSize: 10, fontFamily: "Inter_700Bold", color: cfg.color, textTransform: "uppercase", letterSpacing: 1 },
    pauseRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, marginBottom: 16, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fef3c7", borderRadius: 8, borderWidth: 1, borderColor: "#fde68a" },
    pauseIcon: { fontSize: 14 },
    pauseText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#92400e", flex: 1 },
    pushStepBadge: { backgroundColor: "#dc2626", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    pushLabel: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#dc2626", textTransform: "uppercase", letterSpacing: 1 },
    quote: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1a1a2e", lineHeight: 23, borderLeftWidth: 3, borderLeftColor: cfg.color, paddingLeft: 12, paddingVertical: 4 },
    pushQuote: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1a1a2e", lineHeight: 23, borderLeftWidth: 3, borderLeftColor: "#dc2626", paddingLeft: 12, paddingVertical: 4 },
    divider: { height: 1, backgroundColor: "#bfdbfe", marginBottom: 16 },
  });

  const steps = [
    { step: "Step 2", label: "Frame the Conversation", text: script.opening, framework: "Jefferson Fisher" },
    { step: "Step 3", label: "Compliance Ladder", text: script.issue, framework: "Chase Hughes · Voss" },
    { step: "Step 4", label: "Controlled Delivery", text: script.impact, framework: "Observable Impact" },
    { step: "Step 4", label: "Clear Expectation", text: script.ask, framework: "Outcome-Based Ask", showPause: true },
    { step: "Step 5", label: "After the Pause", text: script.pushback, isPushback: true, framework: "Strategic Pause" },
  ];

  return (
    <View style={s.card}>
      <View style={s.header}>
        <Text style={s.headerText}>💬  Challenger Script</Text>
        <Text style={s.headerSub}>5-step execution</Text>
      </View>
      <View style={s.body}>
        {steps.map((line, i) => (
          <View key={i}>
            {line.isPushback && <View style={s.divider} />}
            <View style={i === steps.length - 1 ? s.rowLast : s.row}>
              <View style={s.stepRow}>
                <View style={line.isPushback ? s.pushStepBadge : s.stepBadge}>
                  <Text style={s.stepBadgeText}>{line.step}</Text>
                </View>
                <Text style={line.isPushback ? s.pushLabel : s.label}>{line.label}</Text>
              </View>
              <Text style={line.isPushback ? s.pushQuote : s.quote}>"{line.text}"</Text>
              {line.showPause && (
                <View style={s.pauseRow}>
                  <Text style={s.pauseIcon}>⏸</Text>
                  <Text style={s.pauseText}>Pause 3–5 seconds. Say nothing. Let them respond first.</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function SectionCard({ section, problemType, strategy }: {
  section: CoachingSection;
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

function PremiumLockCard({ section }: { section: CoachingSection }) {
  const icon = SECTION_ICONS[section.title] ?? "🔒";

  const s = StyleSheet.create({
    card: { borderRadius: 14, marginBottom: 10, overflow: "hidden", borderWidth: 1.5, borderColor: "#e5e7eb" },
    header: {
      backgroundColor: "#f3f4f6", paddingVertical: 10, paddingHorizontal: 16,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
    headerText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 },
    premiumBadge: {
      backgroundColor: "#d4a017", borderRadius: 6,
      paddingVertical: 3, paddingHorizontal: 8,
    },
    premiumBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff", textTransform: "uppercase", letterSpacing: 1 },
    body: { backgroundColor: "#fafafa", paddingVertical: 20, paddingHorizontal: 16, alignItems: "center" },
    lockIcon: { fontSize: 28, marginBottom: 10 },
    lockTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#374151", marginBottom: 6, textAlign: "center" },
    lockDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6b7280", lineHeight: 20, textAlign: "center", marginBottom: 16 },
    unlockBtn: {
      backgroundColor: "#d4a017", borderRadius: 12,
      paddingVertical: 12, paddingHorizontal: 24,
    },
    unlockBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  });

  const descriptions: Record<string, string> = {
    "Outreach Scripts": "Get the exact messages to send — adapted to the person, the path, and the variant that fits.",
    "Follow-Up Strategy": "Know exactly what to do after each conversation to keep momentum and sharpen your direction.",
  };

  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.headerText}>{icon}  {section.title}</Text>
        </View>
        <View style={s.premiumBadge}>
          <Text style={s.premiumBadgeText}>Premium</Text>
        </View>
      </View>
      <View style={s.body}>
        <Text style={s.lockIcon}>🔒</Text>
        <Text style={s.lockTitle}>{section.title}</Text>
        <Text style={s.lockDesc}>
          {descriptions[section.title] ?? "Unlock this section to access personalised guidance."}
        </Text>
        <TouchableOpacity style={s.unlockBtn} activeOpacity={0.85}>
          <Text style={s.unlockBtnText}>Unlock Full Coaching</Text>
        </TouchableOpacity>
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

      <ExecutionHeader
        roleShift={result.roleShift}
        behavioralObjective={result.behavioralObjective}
        tacticalTools={result.tacticalTools}
      />

      <BreakdownBlock reframe={result.reframe} breakdown={result.breakdown} />

      {result.sections
        .filter((s) => s.title === "State Set")
        .map((section, i) => (
          <SectionCard key={`pre-${i}`} section={section} problemType={result.problemType} strategy={result.strategy} />
        ))}

      {result.script && result.strategy && (
        <ScriptSection script={result.script} strategy={result.strategy} />
      )}

      {result.sections
        .filter((s) => s.title !== "State Set")
        .map((section, i) =>
          section.premium ? (
            <PremiumLockCard key={i} section={section} />
          ) : (
            <SectionCard
              key={i}
              section={section}
              problemType={result.problemType}
              strategy={result.strategy}
            />
          )
        )}

      <View style={s.divider} />

      <View style={s.nextBox}>
        <View style={s.nextIconWrap}><Text style={s.nextIcon}>⚡</Text></View>
        <View style={s.nextContent}>
          <Text style={s.nextLabel}>Your Next Steps</Text>
          <Text style={s.nextText}>{result.nextSteps.join("\n")}</Text>
        </View>
      </View>

      <TouchableOpacity style={s.resetBtn} onPress={onReset} activeOpacity={0.8}>
        <Text style={s.resetBtnText}>Start a New Flow</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
