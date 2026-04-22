import React, { createContext, useContext, useState } from "react";
import { useUser } from "@/context/UserContext";

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
  reframe: string;
  breakdown: string;
  trigger?: CoachingTrigger;
  identityAnchor?: string;
  script: CoachingScript | null;
  sections: CoachingSection[];
  nextSteps: string[];
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
  resetFlow: () => void;
  evaluateFlow: () => Promise<void>;
  submitFlow: (strategy: CoachingStrategy | null) => Promise<void>;
}

const CoachingContext = createContext<CoachingContextValue | null>(null);

// Flows that have hardcoded problem types — skip evaluate, go straight to generate
const SKIP_EVALUATE_FLOWS: FlowType[] = ["mindset", "speak_up", "executive_visibility"];

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

const VALID_STRATEGIES: CoachingStrategy[] = ["DIRECT_CONVERSATION", "INDIRECT_INFLUENCE", "STRATEGIC_CONTAINMENT"];
const VALID_PROBLEM_TYPES: ProblemType[] = ["VICTIM", "AVOIDING_CHALLENGER", "OVERWHELMED"];

function parseProblemType(v: unknown): ProblemType {
  const s = String(v ?? "").trim().toUpperCase() as ProblemType;
  // Normalise PASSENGER to VICTIM for UI compatibility
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

function safeParseResult(raw: unknown, problemType: ProblemType, chosenStrategy: CoachingStrategy | null): CoachingResult {
  const fallback: CoachingResult = {
    problemType,
    strategy: chosenStrategy,
    reframe: "Waiting for the right moment is the pattern. The moment is now.",
    breakdown: "The next move is clear. The question is whether you take it today or keep building the case for why the timing is not right. Every day you wait is still a decision — just not the one you intended to make.",
    script: chosenStrategy === "DIRECT_CONVERSATION" ? {
      opening: "I want to address something that is affecting my work. Is now a good time?",
      issue: "There is a specific pattern I need to name. Here is what I have observed.",
      impact: "The effect of this on my work and results is real and measurable.",
      ask: "What I need is a specific change, agreed on today. [Pause. Say nothing.]",
      pushback: "I hear you. This still needs to be resolved. What would need to happen to move this forward?",
    } : null,
    sections: [{ title: "What to Do Now", content: "1. Name the highest-leverage action available to you in the next 24 hours.\n2. Execute it before anything else today.\n3. Reassess tomorrow with new information, not the same story.", premium: false }],
    nextSteps: ["Identify the one action you have been avoiding. That is your first move. Do it before anything else today."],
  };

  if (typeof raw !== "object" || raw === null) return fallback;
  const obj = raw as Record<string, unknown>;

  const parsedProblemType = parseProblemType(obj.problemType ?? problemType);
  const rawStrategyStr = String(obj.strategy ?? "").trim().toUpperCase();
  const aiStrategy: CoachingStrategy | null = VALID_STRATEGIES.includes(rawStrategyStr as CoachingStrategy)
    ? (rawStrategyStr as CoachingStrategy) : null;
  const parsedStrategy: CoachingStrategy | null = chosenStrategy ?? aiStrategy;

  const reframe = str(obj.reframe, fallback.reframe);
  const breakdown = str(obj.breakdown, fallback.breakdown);

  let script: CoachingScript | null = null;
  if (parsedStrategy === "DIRECT_CONVERSATION" && typeof obj.script === "object" && obj.script !== null) {
    const s = obj.script as Record<string, unknown>;
    script = {
      opening: str(s.opening, "I want to address something directly."),
      issue: str(s.issue, "There is a behavior that needs to change."),
      impact: str(s.impact, "This is affecting my work and credibility."),
      ask: str(s.ask, "I need this resolved."),
      pushback: str(s.pushback, "I understand. This still needs to be addressed."),
    };
  }

  let sections: CoachingSection[] = fallback.sections;
  if (Array.isArray(obj.sections) && obj.sections.length > 0) {
    const parsed = obj.sections
      .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
      .map((s) => ({
        title: str(s.title, "Insight"),
        content: str(s.content, ""),
        premium: s.premium === true,
      }))
      .filter((s) => s.content.length > 0);
    if (parsed.length > 0) sections = parsed;
  }

  const nextSteps: string[] = Array.isArray(obj.nextSteps)
    ? obj.nextSteps.filter((s) => typeof s === "string" && s.trim()).map((s) => String(s).trim())
    : fallback.nextSteps;

  const roleShift = typeof obj.roleShift === "string" ? obj.roleShift.trim() : undefined;
  const behavioralObjective = typeof obj.behavioralObjective === "string" ? obj.behavioralObjective.trim() : undefined;
  const tacticalTools: string[] = Array.isArray(obj.tacticalTools)
    ? obj.tacticalTools.filter((t) => typeof t === "string" && t.trim()).map((t) => String(t).trim())
    : [];

  const VALID_MODES = ["Challenger", "Coach", "Strategist"] as const;
  type Mode = typeof VALID_MODES[number];
  const modeFromStrategy: Mode | undefined =
    parsedStrategy === "INDIRECT_INFLUENCE" || parsedStrategy === "STRATEGIC_CONTAINMENT"
      ? "Strategist"
      : parsedStrategy === "DIRECT_CONVERSATION"
      ? "Challenger"
      : undefined;
  const rawMode = String(obj.mode ?? "").trim() as Mode;
  const aiMode: Mode | undefined = VALID_MODES.includes(rawMode) ? rawMode : undefined;
  const mode: Mode | undefined = modeFromStrategy ?? aiMode;

  let trigger: CoachingTrigger | undefined;
  if (typeof obj.trigger === "object" && obj.trigger !== null) {
    const t = obj.trigger as Record<string, unknown>;
    trigger = {
      triggerName: str(t.triggerName, ""),
      energyShift: str(t.energyShift, ""),
      repetitionStatement: str(t.repetitionStatement, ""),
    };
    if (!trigger.triggerName && !trigger.energyShift && !trigger.repetitionStatement) trigger = undefined;
  }

  const identityAnchor = typeof obj.identityAnchor === "string" ? obj.identityAnchor.trim() : undefined;
  const closingQuestion = typeof obj.closingQuestion === "string" ? obj.closingQuestion.trim() : undefined;

  return { problemType: parsedProblemType, strategy: parsedStrategy, mode, roleShift, behavioralObjective, tacticalTools, reframe, breakdown, trigger, identityAnchor, script, sections, nextSteps, closingQuestion };
}

function getBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

export function CoachingProvider({ children }: { children: React.ReactNode }) {
  const { profile: userProfile } = useUser();
  const [activeFlow, setActiveFlowState] = useState<FlowType | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [recommendation, setRecommendation] = useState<StrategyRecommendation | null>(null);
  const [result, setResult] = useState<CoachingResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setActiveFlow = (flow: FlowType | null) => {
    setActiveFlowState(flow);
    setAnswers({});
    setRecommendation(null);
    setResult(null);
    setError(null);
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

    // Skip evaluate for flows with hardcoded problem types — go straight to generate
    if (SKIP_EVALUATE_FLOWS.includes(activeFlow)) {
      const syntheticProblemType: ProblemType = activeFlow === "mindset" ? "OVERWHELMED" : "AVOIDING_CHALLENGER";
      setRecommendation({
        problemType: syntheticProblemType,
        recommendedStrategy: "DIRECT_CONVERSATION",
        assessment: {
          DIRECT_CONVERSATION: "",
          INDIRECT_INFLUENCE: "",
          STRATEGIC_CONTAINMENT: "",
        },
        options: [
          { type: "DIRECT_CONVERSATION", label: "Challenge it directly" },
          { type: "INDIRECT_INFLUENCE", label: "Shift the dynamic through influence" },
          { type: "STRATEGIC_CONTAINMENT", label: "Hold the standard while managing risk" },
        ],
      });
      return;
    }

    setIsEvaluating(true);
    setError(null);
    try {
      const response = await fetch(`${getBase()}/api/coaching/evaluate`, {
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
    } catch {
      setError("Something went wrong. Please try again.");
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
      const response = await fetch(`${getBase()}/api/coaching/generate`, {
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
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CoachingContext.Provider value={{
      activeFlow, answers, recommendation, result,
      isEvaluating, isLoading, error,
      setActiveFlow, setAnswer, resetFlow, evaluateFlow, submitFlow,
    }}>
      {children}
    </CoachingContext.Provider>
  );
}

export function useCoaching() {
  const ctx = useContext(CoachingContext);
  if (!ctx) throw new Error("useCoaching must be used within CoachingProvider");
  return ctx;
}
