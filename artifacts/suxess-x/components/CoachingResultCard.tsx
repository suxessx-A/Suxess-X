import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { CoachingResult, CoachingScript, CoachingSection, CoachingStrategy, CoachingTrigger, ProblemType } from "@/context/CoachingContext";
import { useUser } from "@/context/UserContext";
import { ExecutionLoop, saveSession } from "@/components/RefineAndExecutionLoop";

interface CoachingResultCardProps {
  result: CoachingResult;
  onReset: () => void;
  ctaButton?: { label: string; onPress: () => void };
  flowType?: string;
  answers?: Record<string, string | string[]>;
  onRefined?: (result: CoachingResult) => void;
}

type ThemeConfig = { color: string; bg: string; border: string };

const STRATEGY_THEME: Record<CoachingStrategy, ThemeConfig & { label: string; icon: string; eyebrow: string }> = {
  DIRECT_CONVERSATION:   { label: "Challenge It Directly", eyebrow: "Challenger Mode",  icon: "⚡", color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe" },
  INDIRECT_INFLUENCE:    { label: "Shift the Dynamic",     eyebrow: "Coach Mode",       icon: "♟", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  STRATEGIC_CONTAINMENT: { label: "Hold the Standard",     eyebrow: "Strategist Mode",  icon: "🛡", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
};

const PROBLEM_TYPE_THEME: Record<ProblemType, ThemeConfig & { label: string; icon: string; eyebrow: string }> = {
  VICTIM:              { label: "Creator Activation",  eyebrow: "Role Shift",   icon: "🔥", color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe" },
  AVOIDING_CHALLENGER: { label: "Challenger Mode",     eyebrow: "Role Shift",   icon: "⚡", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  OVERWHELMED:         { label: "Momentum Reset",      eyebrow: "Role Shift",   icon: "🚀", color: "#059669", bg: "#f0fdf4", border: "#a7f3d0" },
};

const SECTION_ICONS: Record<string, string> = {
  "Strategic Positioning": "🎯",
  "Influence Moves": "🔗",
  "Visibility Actions": "👁",
  "Standard Definition": "📌",
  "Control Moves": "🛡",
  "Timing Decision": "⏱",
  "Script Variations": "💬",
  "Standard Setter": "✅",
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
  "Internal Alignment": "🧭",
  "Lead the Conversation": "💬",
  "Handle Pushback": "🛡",
  "Alternative Path": "🔀",
  "Your Value Case": "📊",
  "Lead with Contribution": "🎯",
  "Bridge to Compensation": "🔗",
  "If They Resist": "🛡",
  "Before You Respond": "📋",
  "Counter the Offer": "💬",
  "Handle 'We're at the Top'": "⚡",
  "What Else Is On the Table": "🔑",
  "Positioning": "🎯",
  "Opening + Market Reference": "📢",
  "Lock a Timeline": "📅",
  "Internal Clarity": "🧭",
  "Before You Walk In": "✏️",
  "Get In Early": "🎯",
  "The Two-Sentence Rule": "💡",
  "Your Lines": "🎤",
  "Task → Impact": "🔄",
  "Executive Frames": "📐",
  "The Principle": "⚡",
  "Interrupt": "⚡",
  "Direct": "🎯",
  "Power Questions": "🔍",
  // Negotiate (rebuilt: compensation and resource branches)
  "Your Target and Your Walk-Away": "🎯",
  "Your Ask and Your Walk-Away": "🎯",
  "Open With the Number, Then Stop": "📢",
  "Make the Business Case": "📊",
  "When They Push Back": "🛡",
  "The Wider Package": "🔑",
  "If the Answer Is Not Yet": "📅",
  // Stuck (Captain mode rebuild)
  "Get Clear on What You Want": "🔍",
  "Where You Are on the Clock": "⏱",
  "Map the Path and the Gaps": "🗺",
  "Work Every Channel": "🔗",
};

const MODE_CONFIG = {
  Challenger: { color: "#7c3aed", bg: "#f5f3ff", label: "Challenger Mode" },
  Coach:      { color: "#0369a1", bg: "#e0f2fe", label: "Coach Mode" },
  Strategist: { color: "#b45309", bg: "#fef3c7", label: "Strategist Mode" },
};

// ── Typography constants ─────────────────────────────────────────────────────
const T = {
  eyebrow: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase" as const, letterSpacing: 1.5 },
  cardTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#1a1a2e", lineHeight: 25 },
  body: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#1a1a2e", lineHeight: 24 },
  bodySmall: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(26,26,46,0.6)", lineHeight: 20 },
  sectionHeader: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff", textTransform: "uppercase" as const, letterSpacing: 1 },
  quote: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1a1a2e", lineHeight: 23 },
};

function HeaderBadge({ result }: { result: CoachingResult }) {
  const theme = result.strategy
    ? STRATEGY_THEME[result.strategy]
    : PROBLEM_TYPE_THEME[result.problemType];
  const modeConfig = result.mode ? MODE_CONFIG[result.mode] : null;

  const s = StyleSheet.create({
    wrap: { borderRadius: 14, borderWidth: 1.5, borderColor: theme.border, backgroundColor: theme.bg, padding: 16, marginBottom: 14 },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.color, alignItems: "center", justifyContent: "center" },
    icon: { fontSize: 18, color: "#fff" },
    textWrap: { flex: 1 },
    eyebrow: { ...T.eyebrow, color: theme.color, marginBottom: 2 },
    label: { ...T.cardTitle },
    modePill: { marginTop: 10, alignSelf: "flex-start", borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1 },
    modeText: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 1 },
  });

  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <View style={s.iconWrap}><Text style={s.icon}>{theme.icon}</Text></View>
        <View style={s.textWrap}>
          <Text style={s.eyebrow}>{theme.eyebrow}</Text>
          <Text style={s.label}>{theme.label}</Text>
        </View>
      </View>
      {modeConfig ? (
        <View style={[s.modePill, { backgroundColor: modeConfig.bg, borderColor: modeConfig.color }]}>
          <Text style={[s.modeText, { color: modeConfig.color }]}>{modeConfig.label}</Text>
        </View>
      ) : null}
    </View>
  );
}

function TriggerCard({ trigger }: { trigger: CoachingTrigger }) {
  const s = StyleSheet.create({
    card: { borderRadius: 14, marginBottom: 10, overflow: "hidden" },
    header: { backgroundColor: "#92400e", paddingVertical: 10, paddingHorizontal: 16 },
    headerText: { ...T.sectionHeader },
    body: { backgroundColor: "#fffbeb", paddingTop: 14, paddingBottom: 16, paddingHorizontal: 16 },
    triggerLabelRow: { marginBottom: 4 },
    triggerLabel: { ...T.eyebrow, color: "#78350f" },
    triggerValue: { ...T.body, fontSize: 14, color: "#1a1a2e", marginBottom: 14 },
    energyLabel: { ...T.eyebrow, color: "#78350f", marginBottom: 4 },
    energyText: { ...T.body, fontSize: 14, color: "#1a1a2e", lineHeight: 22, marginBottom: 14 },
    affirmationBox: { backgroundColor: "#1a1a2e", borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16 },
    affirmationLabel: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#d4a017", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, textAlign: "center" },
    affirmationText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff", lineHeight: 27, textAlign: "center" },
    affirmationSub: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 8 },
  });

  return (
    <View style={s.card}>
      <View style={s.header}><Text style={s.headerText}>⚡  Energy Reset</Text></View>
      <View style={s.body}>
        <View style={s.triggerLabelRow}>
          <Text style={s.triggerLabel}>Trigger</Text>
        </View>
        <Text style={s.triggerValue}>{trigger.triggerName}</Text>
        <Text style={s.energyLabel}>Reset First</Text>
        <Text style={s.energyText}>{trigger.energyShift}</Text>
        <View style={s.affirmationBox}>
          <Text style={s.affirmationLabel}>Say 8× aloud</Text>
          <Text style={s.affirmationText}>"{trigger.repetitionStatement}"</Text>
          <Text style={s.affirmationSub}>Aloud. Before you move.</Text>
        </View>
      </View>
    </View>
  );
}

function IdentityAnchorCard({ anchor }: { anchor: string }) {
  const s = StyleSheet.create({
    card: {
      borderRadius: 14, marginBottom: 10,
      backgroundColor: "#1a1a2e", padding: 16,
      flexDirection: "row", alignItems: "flex-start", gap: 12,
    },
    iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#d4a017", alignItems: "center", justifyContent: "center" },
    iconText: { fontSize: 16 },
    textWrap: { flex: 1 },
    label: { ...T.eyebrow, color: "#d4a017", marginBottom: 6 },
    text: { ...T.body, color: "#fff" },
  });

  return (
    <View style={s.card}>
      <View style={s.iconWrap}><Text style={s.iconText}>🧠</Text></View>
      <View style={s.textWrap}>
        <Text style={s.label}>Identity Anchor</Text>
        <Text style={s.text}>{anchor}</Text>
      </View>
    </View>
  );
}

function ClosingQuestionCard({ question }: { question: string }) {
  const s = StyleSheet.create({
    card: { borderRadius: 14, marginTop: 4, marginBottom: 24, borderWidth: 2, borderColor: "#7c3aed", backgroundColor: "#faf5ff", padding: 18 },
    label: { ...T.eyebrow, color: "#7c3aed", marginBottom: 10 },
    text: { ...T.cardTitle, fontSize: 16, lineHeight: 25 },
  });

  return (
    <View style={s.card}>
      <Text style={s.label}>Before You Move</Text>
      <Text style={s.text}>{question}</Text>
    </View>
  );
}

// Parse a roleShift into its two halves. The prompts instruct the model to use
// the "→" separator, but we accept the common fallbacks a model might emit.
// Symbol separators (→, ->, em/en dash) are tried first; the words "to"/"vs"
// are a last resort because they can legitimately appear inside a phrase (e.g.
// "waiting to be chosen"). Returns ["", ""] when no separator is found, so the
// caller renders nothing rather than dumping the whole string into "from".
function splitRoleShift(roleShift?: string): [string, string] {
  if (!roleShift) return ["", ""];
  const symbolSep = roleShift.match(/\s*(→|->|—|–)\s*/);
  const sep = symbolSep ?? roleShift.match(/\s+(?:to|vs\.?)\s+/i);
  if (!sep || sep.index === undefined) return ["", ""];
  const from = roleShift.slice(0, sep.index).trim();
  const to = roleShift.slice(sep.index + sep[0].length).trim();
  if (!from || !to) return ["", ""];
  return [from, to];
}

function ExecutionHeader({ roleShift, behavioralObjective }: {
  roleShift?: string;
  behavioralObjective?: string;
  tacticalTools?: string[];
}) {
  const [from, to] = splitRoleShift(roleShift);
  const hasRoleShift = !!(from && to);

  if (!hasRoleShift && !behavioralObjective) return null;

  const s = StyleSheet.create({
    card: { borderRadius: 14, borderWidth: 1.5, borderColor: "#1a1a2e", backgroundColor: "#1a1a2e", marginBottom: 10, overflow: "hidden" },
    shiftLabel: { ...T.eyebrow, color: "rgba(255,255,255,0.5)", paddingHorizontal: 16, paddingTop: 14, marginBottom: 10 },
    shiftRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
    fromBox: { flex: 1, backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 8, padding: 10 },
    fromLabel: { fontSize: 9, fontFamily: "Inter_700Bold", color: "rgba(239,68,68,0.7)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
    fromText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.8)", lineHeight: 18 },
    arrow: { fontSize: 20, color: "#d4a017", fontFamily: "Inter_700Bold" },
    toBox: { flex: 1, backgroundColor: "rgba(124,58,237,0.2)", borderRadius: 8, padding: 10 },
    toLabel: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
    toText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff", lineHeight: 18 },
    divider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginHorizontal: 16 },
    objectiveWrap: { paddingVertical: 12, paddingHorizontal: 16 },
    objectiveLabel: { ...T.eyebrow, color: "#d4a017", marginBottom: 5 },
    objectiveText: { ...T.body, color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 20 },
  });

  return (
    <View style={s.card}>
      {hasRoleShift ? (
        <>
          <Text style={s.shiftLabel}>Role Shift</Text>
          <View style={s.shiftRow}>
            <View style={s.fromBox}>
              <Text style={s.fromLabel}>From</Text>
              <Text style={s.fromText}>{from}</Text>
            </View>
            <Text style={s.arrow}>→</Text>
            <View style={s.toBox}>
              <Text style={s.toLabel}>To</Text>
              <Text style={s.toText}>{to}</Text>
            </View>
          </View>
        </>
      ) : null}

      {behavioralObjective ? (
        <>
          {hasRoleShift ? <View style={s.divider} /> : null}
          <View style={s.objectiveWrap}>
            <Text style={s.objectiveLabel}>Objective</Text>
            <Text style={s.objectiveText}>{behavioralObjective}</Text>
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
    headerText: { ...T.sectionHeader },
    body: { backgroundColor: "#f9fafb", paddingVertical: 14, paddingHorizontal: 16 },
    reframe: { ...T.cardTitle, fontSize: 17, lineHeight: 25 },
    breakdown: { ...T.body, color: "#4b5563", marginTop: 10 },
  });
  return (
    <View style={s.card}>
      <View style={s.header}><Text style={s.headerText}>Diagnosis</Text></View>
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
    headerText: { ...T.sectionHeader },
    headerSub: { fontSize: 9, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.8 },
    body: { backgroundColor: "#f0f9ff", paddingTop: 14, paddingBottom: 14, paddingHorizontal: 16 },
    row: { marginBottom: 16 },
    rowLast: { marginBottom: 0 },
    stepRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
    stepBadge: { backgroundColor: cfg.color, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    stepBadgeText: { fontSize: 8, fontFamily: "Inter_700Bold", color: "#fff", textTransform: "uppercase", letterSpacing: 0.8 },
    label: { ...T.eyebrow, color: cfg.color },
    pauseRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, marginBottom: 16, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fef3c7", borderRadius: 8, borderWidth: 1, borderColor: "#fde68a" },
    pauseIcon: { fontSize: 14 },
    pauseText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#92400e", flex: 1 },
    pushStepBadge: { backgroundColor: "#dc2626", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    pushLabel: { ...T.eyebrow, color: "#dc2626" },
    quote: { ...T.quote, borderLeftWidth: 3, borderLeftColor: cfg.color, paddingLeft: 12, paddingVertical: 4 },
    pushQuote: { ...T.quote, borderLeftWidth: 3, borderLeftColor: "#dc2626", paddingLeft: 12, paddingVertical: 4 },
    divider: { height: 1, backgroundColor: "#bfdbfe", marginBottom: 16 },
  });

  const steps = [
    { step: "Step 2", label: "Open the Conversation", text: script.opening },
    { step: "Step 3", label: "Build Agreement", text: script.issue },
    { step: "Step 4", label: "State the Impact", text: script.impact },
    { step: "Step 4", label: "Make the Ask", text: script.ask, showPause: true },
    ...(script.pushback
      ? [{ step: "Step 5", label: "Handle the Response", text: script.pushback, isPushback: true }]
      : []),
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
    headerText: { ...T.sectionHeader },
    body: { backgroundColor: baseTheme.bg, paddingVertical: 14, paddingHorizontal: 16 },
    content: { ...T.body },
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

export function CoachingResultCard({ result: initialResult, onReset, ctaButton, flowType, answers }: CoachingResultCardProps) {
  const [result, setResult] = useState<CoachingResult>(initialResult);
  const colors = useColors();
  const { profile } = useUser();
  const sessionId = useRef(`session_${Date.now()}`).current;

  useEffect(() => {
    saveSession({
      sessionId,
      flowType: flowType ?? "unknown",
      timestamp: Date.now(),
      answers: answers ?? {},
      problemType: result.problemType,
      strategy: result.strategy,
      userProfile: profile ?? undefined,
    });
  }, []);

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
    nextLabel: { ...T.eyebrow, color: "#92400e", marginBottom: 6 },
    nextText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#78350f", lineHeight: 22 },
    resetBtn: { borderWidth: 2, borderColor: colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginBottom: 36 },
    resetBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.primary },
    ctaBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: "center", marginBottom: 12 },
    ctaBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#ffffff", letterSpacing: 0.3 },
    ctaSecondary: { alignItems: "center", paddingVertical: 12, marginBottom: 24 },
    ctaSecondaryText: { ...T.bodySmall },
  });

  return (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      <HeaderBadge result={result} />

      <ExecutionHeader
        roleShift={result.roleShift}
        behavioralObjective={result.behavioralObjective}
        tacticalTools={result.tacticalTools}
      />

      <BreakdownBlock reframe={result.reframe ?? ""} breakdown={result.breakdown ?? ""} />

      {result.trigger ? <TriggerCard trigger={result.trigger} /> : null}

      {(result.sections ?? [])
        .filter((s) => s.title === "State Set" || s.title === "Internal Clarity")
        .map((section, i) => (
          <SectionCard key={`pre-${i}`} section={section} problemType={result.problemType} strategy={result.strategy} />
        ))}

      {result.script && result.strategy && (
        <ScriptSection script={result.script} strategy={result.strategy} />
      )}

      {/* v1.2 login-only: every section renders for the signed-in user.
          The legacy "premium" flag on a section is now informational only
          (the backend still marks deeper sections as premium); the gate has
          moved up to the home subscription-inactive view. */}
      {(result.sections ?? [])
        .filter((sec) => sec.title !== "State Set" && sec.title !== "Internal Clarity")
        .map((section, i) => (
          <SectionCard
            key={`sec-${i}`}
            section={section}
            problemType={result.problemType}
            strategy={result.strategy}
          />
        ))}

      {result.identityAnchor ? <IdentityAnchorCard anchor={result.identityAnchor} /> : null}

      <View style={s.divider} />

      <View style={s.nextBox}>
        <View style={s.nextIconWrap}><Text style={s.nextIcon}>⚡</Text></View>
        <View style={s.nextContent}>
          <Text style={s.nextLabel}>Act Now</Text>
          <Text style={s.nextText}>{result.nextSteps?.join("\n") ?? ""}</Text>
        </View>
      </View>

      {result.closingQuestion ? <ClosingQuestionCard question={result.closingQuestion} /> : null}

      <ExecutionLoop
        flowType={flowType ?? "unknown"}
        behavioralObjective={result.behavioralObjective ?? result.nextSteps?.[0] ?? "Take your next step."}
        sessionId={sessionId}
        userGoal={profile?.goal}
      />

      {ctaButton ? (
        <>
          <TouchableOpacity style={s.ctaBtn} onPress={ctaButton.onPress} activeOpacity={0.85}>
            <Text style={s.ctaBtnText}>{ctaButton.label}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ctaSecondary} onPress={onReset} activeOpacity={0.7}>
            <Text style={s.ctaSecondaryText}>Back to Home</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={s.resetBtn} onPress={onReset} activeOpacity={0.8}>
          <Text style={s.resetBtnText}>Start a New Flow</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
