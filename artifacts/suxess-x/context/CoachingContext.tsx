import React, { createContext, useContext, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "@/context/UserContext";

const TESTING_MODE = true;

const STRIPE_MONTHLY = "https://buy.stripe.com/aFa8wReBd99VgpR8HO5kk00";
const WAITLIST_URL   = "https://waitlist.amplify-x.co?source=momentum";

export type FlowType = "conversation" | "stuck" | "speak_up" | "executive_visibility" | "negotiate" | "mindset";
export type ProblemType = "VICTIM" | "AVOIDING_CHALLENGER" | "OVERWHELMED";
export type CoachingStrategy = "DIRECT_CONVERSATION" | "INDIRECT_INFLUENCE" | "STRATEGIC_CONTAINMENT";

export interface StrategyOption {
  type: CoachingStrategy;
  label: string;
}

export interface StrategyRecommendation {
  problemType: ProblemType;
  recommendedStrategy: CoachingStrategy;
  assessment: Record<CoachingStrategy, string>;
  options: StrategyOption[];
  powerDiagnosis?: string;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  outcomeGoal?: string;
  whenNotTo?: Record<CoachingStrategy, string>;
}

export interface CoachingScript {
  opening: string;
  issue: string;
  impact: string;
  ask: string;
  pushback: string;
}

export interface CoachingSection {
  title: string;
  content: string;
  premium?: boolean;
}

export interface CoachingTrigger {
  triggerName: string;
  energyShift: string;
  repetitionStatement: string;
}

export interface CoachingResult {
  problemType: ProblemType;
  strategy: CoachingStrategy | null;
  mode?: "Challenger" | "Coach" | "Strategist";
  roleShift?: string;
  behavioralObjective?: string;
  tacticalTools?: string[];
  reframe?: string;
  breakdown?: string;
  trigger?: CoachingTrigger;
  identityAnchor?: string;
  script?: CoachingScript | null;
  sections?: CoachingSection[];
  nextSteps?: string[];
  closingQuestion?: string;
}

interface CoachingContextValue {
  activeFlow: FlowType | null;
  answers: Record<string, string | string[]>;
  recommendation: StrategyRecommendation | null;
  result: CoachingResult | null;
  isEvaluating: boolean;
  isLoading: boolean;
  error: string | null;
  setActiveFlow: (flow: FlowType | null) => void;
  setAnswer: (key: string, value: string | string[]) => void;
  setResult: (result: CoachingResult | null) => void;
  resetFlow: () => void;
  evaluateFlow: () => Promise<void>;
  submitFlow: (strategy: CoachingStrategy | null) => Promise<void>;
}

const CoachingContext = createContext<CoachingContextValue | null>(null);

// Flows that have hardcoded problem types — skip evaluate, go straight to generate
const SKIP_EVALUATE_FLOWS: FlowType[] = ["mindset", "speak_up", "executive_visibility"];

// THIS IS THE CRITICAL FIX — getBase was missing from this file
function getBase(): string {
  if (typeof window !== "undefined" && window.location && window.location.origin && window.location.origin !== "null") {
    return window.location.origin;
  }
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

const VALID_STRATEGIES: CoachingStrategy[] = ["DIRECT_CONVERSATION", "INDIRECT_INFLUENCE", "STRATEGIC_CONTAINMENT"];
const VALID_PROBLEM_TYPES: ProblemType[] = ["VICTIM", "AVOIDING_CHALLENGER", "OVERWHELMED"];

function parseProblemType(v: unknown): ProblemType {
  const s = String(v ?? "").trim().toUpperCase() as ProblemType;
  if (s === ("PASSENGER" as unknown as ProblemType)) return "VICTIM";
  return VALID_PROBLEM_TYPES.includes(s) ? s : "AVOIDING_CHALLENGER";
}

function parseStrategy(v: unknown): CoachingStrategy {
  const s = String(v ?? "").trim().toUpperCase() as CoachingStrategy;
  return VALID_STRATEGIES.includes(s) ? s : "DIRECT_CONVERSATION";
}

function safeParseRecommendation(raw: unknown): StrategyRecommendation {
  const defaultAssessment: Record<CoachingStrategy, string> = {
    DIRECT_CONVERSATION: "Naming the issue directly gives you the clearest signal on how to move forward.",
    INDIRECT_INFLUENCE: "Shifting perception and building leverage is a higher-return move than direct confrontation here.",
    STRATEGIC_CONTAINMENT: "Protecting your position and managing risk is the priority before any direct action.",
  };
  const fallback: StrategyRecommendation = {
    problemType: "AVOIDING_CHALLENGER",
    recommendedStrategy: "DIRECT_CONVERSATION",
    assessment: defaultAssessment,
    options: [
      { type: "DIRECT_CONVERSATION", label: "Challenge it directly" },
      { type: "INDIRECT_INFLUENCE", label: "Shift the dynamic through influence" },
      { type: "STRATEGIC_CONTAINMENT", label: "Hold the standard while managing risk" },
    ],
  };
  if (typeof raw !== "object" || raw === null) return fallback;
  const obj = raw as Record<string, unknown>;

  const problemType = parseProblemType(obj.problemType);
  const recommendedStrategy = parseStrategy(obj.recommendedStrategy);

  let assessment = defaultAssessment;
  if (typeof obj.assessment === "object" && obj.assessment !== null) {
    const a = obj.assessment as Record<string, unknown>;
    assessment = {
      DIRECT_CONVERSATION: str(a.DIRECT_CONVERSATION, defaultAssessment.DIRECT_CONVERSATION),
      INDIRECT_INFLUENCE: str(a.INDIRECT_INFLUENCE, defaultAssessment.INDIRECT_INFLUENCE),
      STRATEGIC_CONTAINMENT: str(a.STRATEGIC_CONTAINMENT, defaultAssessment.STRATEGIC_CONTAINMENT),
    };
  }

  let options = fallback.options;
  if (Array.isArray(obj.options) && obj.options.length === 3) {
    const parsed = obj.options.map((o: unknown) => {
      if (typeof o !== "object" || o === null) return null;
      const op = o as Record<string, unknown>;
      const t = String(op.type ?? "").trim().toUpperCase() as CoachingStrategy;
      if (!VALID_STRATEGIES.includes(t)) return null;
      return { type: t, label: str(op.label, t) };
    });
    if (parsed.every(Boolean)) options = parsed as StrategyOption[];
  }

  const powerDiagnosis = typeof obj.powerDiagnosis === "string" ? obj.powerDiagnosis.trim() : undefined;
  const rawRisk = String(obj.riskLevel ?? "").trim().toUpperCase();
  const riskLevel: "LOW" | "MEDIUM" | "HIGH" | undefined = (["LOW", "MEDIUM", "HIGH"] as const).includes(rawRisk as "LOW" | "MEDIUM" | "HIGH")
    ? (rawRisk as "LOW" | "MEDIUM" | "HIGH") : undefined;
  const outcomeGoal = typeof obj.outcomeGoal === "string" ? obj.outcomeGoal.trim() : undefined;

  let whenNotTo: Record<CoachingStrategy, string> | undefined;
  if (typeof obj.whenNotTo === "object" && obj.whenNotTo !== null) {
    const w = obj.whenNotTo as Record<string, unknown>;
    whenNotTo = {
      DIRECT_CONVERSATION: str(w.DIRECT_CONVERSATION, ""),
      INDIRECT_INFLUENCE: str(w.INDIRECT_INFLUENCE, ""),
      STRATEGIC_CONTAINMENT: str(w.STRATEGIC_CONTAINMENT, ""),
    };
  }

  return { problemType, recommendedStrategy, assessment, options, powerDiagnosis, riskLevel, outcomeGoal, whenNotTo };
}

export function safeParseResult(raw: unknown, problemType: ProblemType, chosenStrategy: CoachingStrategy | null): CoachingResult {
  const fallback: CoachingResult = {
    problemType,
    strategy: chosenStrategy,
    reframe: "Waiting for the right moment is the pattern. The moment is now.",
    breakdown: "The next move is clear. The question is whether you take it today or keep building the case for why the timing is not right. Every day you wait is still a decision — just not the one you intended to make.",
    script: chosenStrategy === "DIRECT_CONVERSATION" ? {
      opening: "I want to address something that is affecting my work. Is now a good time?",
      issue: "There is a specific pattern I need to name. Here is what I have observed.",
      impact: "The effect of this on my work and results is real and measurable.",
      ask: "What I need is a specific change, agreed on today. Pause. Say nothing.",
      pushback: "I hear you. This still needs to be resolved. What would need to happen to move this forward?",
    } : null,
    sections: [{ title: "What to Do Now", content: "1. Name the highest-leverage action available to you in the next 24 hours.\n2. Execute it before anything else today.\n3. Reassess tomorrow with new information, not the same story.", premium: false }],
    nextSteps: ["Identify the one action you have been avoiding. That is your first move. Do it before anything else today."],
  };

  if (typeof raw !== "object" || raw === null) return fallback;
  const obj = raw as Record<string, unknown>;

  const problemTypeOut = parseProblemType(obj.problemType ?? problemType);
  const strategyOut = obj.strategy != null ? parseStrategy(obj.strategy) : chosenStrategy;

  function safeStr(v: unknown): string | undefined {
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  }

  function safeSections(v: unknown): CoachingSection[] {
    if (!Array.isArray(v)) return fallback.sections!;
    const parsed = v.map((s: unknown) => {
      if (typeof s !== "object" || s === null) return null;
      const sec = s as Record<string, unknown>;
      const title = safeStr(sec.title);
      const content = safeStr(sec.content);
      if (!title || !content) return null;
      return { title, content, premium: sec.premium === true };
    }).filter(Boolean) as CoachingSection[];
    return parsed.length > 0 ? parsed : fallback.sections!;
  }

  function safeNextSteps(v: unknown): string[] {
    if (!Array.isArray(v)) return fallback.nextSteps!;
    const parsed = v.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
    return parsed.length > 0 ? parsed : fallback.nextSteps!;
  }

  function safeTrigger(v: unknown): CoachingTrigger | undefined {
    if (typeof v !== "object" || v === null) return undefined;
    const t = v as Record<string, unknown>;
    const triggerName = safeStr(t.triggerName);
    const energyShift = safeStr(t.energyShift);
    const repetitionStatement = safeStr(t.repetitionStatement);
    if (!triggerName || !energyShift || !repetitionStatement) return undefined;
    return { triggerName, energyShift, repetitionStatement };
  }

  function safeScript(v: unknown): CoachingScript | null {
    if (v === null || v === undefined) return null;
    if (typeof v !== "object") return null;
    const s = v as Record<string, unknown>;
    return {
      opening: safeStr(s.opening) ?? "",
      issue: safeStr(s.issue) ?? "",
      impact: safeStr(s.impact) ?? "",
      ask: safeStr(s.ask) ?? "",
      pushback: safeStr(s.pushback) ?? "",
    };
  }

  return {
    problemType: problemTypeOut,
    strategy: strategyOut,
    mode: (obj.mode === "Challenger" || obj.mode === "Coach" || obj.mode === "Strategist") ? obj.mode : undefined,
    roleShift: safeStr(obj.roleShift),
    behavioralObjective: safeStr(obj.behavioralObjective),
    reframe: safeStr(obj.reframe) ?? fallback.reframe,
    breakdown: safeStr(obj.breakdown) ?? fallback.breakdown,
    trigger: safeTrigger(obj.trigger),
    identityAnchor: safeStr(obj.identityAnchor),
    script: safeScript(obj.script),
    sections: safeSections(obj.sections),
    nextSteps: safeNextSteps(obj.nextSteps),
    closingQuestion: safeStr(obj.closingQuestion),
  };
}

export function CoachingProvider({ children }: { children: React.ReactNode }) {
  const [activeFlow, setActiveFlowState] = useState<FlowType | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [recommendation, setRecommendation] = useState<StrategyRecommendation | null>(null);
  const [result, setResult] = useState<CoachingResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateModal, setGateModal] = useState<{ visible: boolean; message?: string }>({ visible: false });
  const { profile } = useUser();
  const userProfile = profile ? {
    name: profile.name,
    industry: profile.industry,
    level: profile.level,
    challenge: profile.challenge,
    goal: profile.goal,
  } : null;

  async function checkFlowAccess(flow: FlowType): Promise<boolean> {
    if (TESTING_MODE) return true;
    try {
      const premium = await AsyncStorage.getItem("suxess_premium");
      if (premium === "true") return true;

      const stored = await AsyncStorage.getItem("suxess_sessions");
      const sessions: { flowType: string }[] = stored ? JSON.parse(stored) : [];
      const usedFlows = [...new Set(sessions.map((s) => s.flowType))];

      const alreadyUsed = usedFlows.includes(flow);
      if (alreadyUsed) {
        setGateModal({
          visible: true,
          message: "You have already used this flow on the free tier. Upgrade to Premium for unlimited runs across all 6 flows.",
        });
        return false;
      }

      if (usedFlows.length >= 3) {
        setGateModal({
          visible: true,
          message: "You have completed your 3 free flows. Upgrade to Premium to access all 6 flows with unlimited runs.",
        });
        return false;
      }

      return true;
    } catch {
      return true;
    }
  }

  const setActiveFlow = (flow: FlowType | null) => {
    if (flow === null) {
      setActiveFlowState(null);
      setAnswers({});
      setRecommendation(null);
      setResult(null);
      setError(null);
      return;
    }
    checkFlowAccess(flow).then((allowed) => {
      if (allowed) {
        setActiveFlowState(flow);
        setAnswers({});
        setRecommendation(null);
        setResult(null);
        setError(null);
      }
    });
  };

  const setAnswer = (key: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const resetFlow = () => {
    setActiveFlowState(null);
    setAnswers({});
    setRecommendation(null);
    setResult(null);
    setError(null);
    setIsEvaluating(false);
    setIsLoading(false);
  };

  const evaluateFlow = async () => {
    if (!activeFlow) return;

    if (SKIP_EVALUATE_FLOWS.includes(activeFlow)) {
      const syntheticProblemType: ProblemType = activeFlow === "mindset" ? "OVERWHELMED" : "AVOIDING_CHALLENGER";
      setIsEvaluating(true);

      const assessmentByFlow: Record<string, Record<CoachingStrategy, string>> = {
        speak_up: {
          DIRECT_CONVERSATION: "Name your point clearly and claim your space in the room. The moment you have the answer is the moment to use it.",
          INDIRECT_INFLUENCE: "Build visibility through questions and positioning before the meeting so your perspective is expected, not a surprise.",
          STRATEGIC_CONTAINMENT: "Document your contributions and create a paper trail that speaks for you when the room does not.",
        },
        executive_visibility: {
          DIRECT_CONVERSATION: "Make your results visible directly to the people who need to see them. Name the impact, connect it to the business, and put it in front of the right audience.",
          INDIRECT_INFLUENCE: "Reposition yourself through the language others use about you. Shift from being seen as an executor to being seen as a strategist through how you frame your work.",
          STRATEGIC_CONTAINMENT: "Protect your positioning by ensuring your contributions are attributed correctly before others claim the narrative.",
        },
      };

      const flowAssessment = assessmentByFlow[activeFlow] ?? {
        DIRECT_CONVERSATION: "Naming the issue directly gives you the clearest signal on how to move forward.",
        INDIRECT_INFLUENCE: "Shifting perception and building leverage is a higher-return move than direct confrontation here.",
        STRATEGIC_CONTAINMENT: "Protecting your position and managing risk is the priority before any direct action.",
      };

      setRecommendation({
        problemType: syntheticProblemType,
        recommendedStrategy: "DIRECT_CONVERSATION",
        assessment: flowAssessment,
        options: [
          { type: "DIRECT_CONVERSATION", label: "Challenge it directly" },
          { type: "INDIRECT_INFLUENCE", label: "Shift the dynamic through influence" },
          { type: "STRATEGIC_CONTAINMENT", label: "Hold the standard while managing risk" },
        ],
      });
      setIsEvaluating(false);
      return;
    }

    setIsEvaluating(true);
    setError(null);
    try {
      const base = getBase();
      console.log("evaluateFlow calling:", `${base}/api/coaching/evaluate`);
      const response = await fetch(`${base}/api/coaching/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowType: activeFlow, answers }),
      });
      if (!response.ok) throw new Error(`Server error ${response.status}`);
      const text = await response.text();
      const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      let parsed: unknown;
      try { parsed = JSON.parse(stripped); } catch { parsed = null; }
      setRecommendation(safeParseRecommendation(parsed));
    } catch (err) {
      console.error("evaluateFlow error:", err);
      setError("Something went wrong analysing your situation. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const submitFlow = async (strategy: CoachingStrategy | null) => {
    if (!activeFlow) return;
    const problemType = recommendation?.problemType ?? "AVOIDING_CHALLENGER";
    setIsLoading(true);
    setError(null);
    try {
      const base = getBase();
      console.log("submitFlow calling:", `${base}/api/coaching/generate`);
      const response = await fetch(`${base}/api/coaching/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowType: activeFlow, answers, problemType, strategy, userProfile }),
      });
      if (!response.ok) throw new Error(`Server error ${response.status}`);
      const text = await response.text();
      const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      let parsed: unknown;
      try { parsed = JSON.parse(stripped); } catch { parsed = null; }
      setResult(safeParseResult(parsed, problemType, strategy));
    } catch (err) {
      console.error("submitFlow error:", err);
      setError("Something went wrong generating your coaching. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const gm = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 40 },
    eyebrow: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#C9952A", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 },
    title: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#1a1a2e", lineHeight: 26, marginBottom: 20 },
    btnPrimary: { backgroundColor: "#00D4AA", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 10 },
    btnPrimaryText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#0A1628" },
    btnWaitlist: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 10, borderWidth: 1.5, borderColor: "#7c3aed" },
    btnWaitlistText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#7c3aed" },
    dismiss: { alignItems: "center", paddingVertical: 8 },
    dismissText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#9ca3af" },
  });

  return (
    <CoachingContext.Provider value={{
      activeFlow, answers, recommendation, result,
      isEvaluating, isLoading, error,
      setActiveFlow, setAnswer, setResult, resetFlow, evaluateFlow, submitFlow,
    }}>
      {children}
      <Modal
        visible={gateModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setGateModal({ visible: false })}
      >
        <View style={gm.overlay}>
          <View style={gm.sheet}>
            <Text style={gm.eyebrow}>Premium Required</Text>
            <Text style={gm.title}>{gateModal.visible ? gateModal.message : ""}</Text>
            <TouchableOpacity style={gm.btnPrimary} activeOpacity={0.85} onPress={() => Linking.openURL(STRIPE_MONTHLY)}>
              <Text style={gm.btnPrimaryText}>Unlock Premium — $20/month</Text>
            </TouchableOpacity>
            <TouchableOpacity style={gm.btnWaitlist} activeOpacity={0.85} onPress={() => Linking.openURL(WAITLIST_URL)}>
              <Text style={gm.btnWaitlistText}>Join Premium Plus Waitlist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={gm.dismiss} onPress={() => setGateModal({ visible: false })}>
              <Text style={gm.dismissText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </CoachingContext.Provider>
  );
}

export function useCoaching() {
  const ctx = useContext(CoachingContext);
  if (!ctx) throw new Error("useCoaching must be used within CoachingProvider");
  return ctx;
}
