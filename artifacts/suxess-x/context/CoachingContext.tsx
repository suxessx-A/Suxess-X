import React, { createContext, useContext, useState } from "react";

export type FlowType = "conversation" | "stuck" | "visibility" | "negotiate" | "mindset";
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

export interface CoachingResult {
  problemType: ProblemType;
  strategy: CoachingStrategy | null;
  reframe: string;
  breakdown: string;
  script: CoachingScript | null;
  sections: CoachingSection[];
  nextSteps: string[];
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

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

const VALID_STRATEGIES: CoachingStrategy[] = ["DIRECT_CONVERSATION", "INDIRECT_INFLUENCE", "STRATEGIC_CONTAINMENT"];
const VALID_PROBLEM_TYPES: ProblemType[] = ["VICTIM", "AVOIDING_CHALLENGER", "OVERWHELMED"];

function parseProblemType(v: unknown): ProblemType {
  const s = String(v ?? "").trim().toUpperCase() as ProblemType;
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

  return { problemType, recommendedStrategy, assessment, options };
}

function safeParseResult(raw: unknown, problemType: ProblemType, chosenStrategy: CoachingStrategy | null): CoachingResult {
  const fallback: CoachingResult = {
    problemType,
    strategy: chosenStrategy,
    reframe: "The situation is clearer than it feels.",
    breakdown: "You know what needs to happen. The question is timing and approach.",
    script: chosenStrategy === "DIRECT_CONVERSATION" ? {
      opening: "I want to talk about something that has been affecting my work.",
      issue: "There is a pattern I need to address directly.",
      impact: "This is affecting my ability to deliver and my standing on this team.",
      ask: "I need this to change, and I want to agree on how.",
      pushback: "I hear you. And this still needs to be resolved.",
    } : null,
    sections: [{ title: "What to Do", content: "1. Identify your highest-leverage action.\n2. Execute it before end of day.\n3. Reassess tomorrow morning." }],
    nextSteps: ["Take one concrete action today that moves this forward."],
  };

  if (typeof raw !== "object" || raw === null) return fallback;
  const obj = raw as Record<string, unknown>;

  const parsedProblemType = parseProblemType(obj.problemType ?? problemType);
  const rawStrategyStr = String(obj.strategy ?? "").trim().toUpperCase();
  const parsedStrategy: CoachingStrategy | null = VALID_STRATEGIES.includes(rawStrategyStr as CoachingStrategy)
    ? (rawStrategyStr as CoachingStrategy)
    : null;

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

  return { problemType: parsedProblemType, strategy: parsedStrategy, reframe, breakdown, script, sections, nextSteps };
}

function getBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

export function CoachingProvider({ children }: { children: React.ReactNode }) {
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
        body: JSON.stringify({ flowType: activeFlow, answers, problemType, strategy }),
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
