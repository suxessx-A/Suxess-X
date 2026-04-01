import React, { createContext, useContext, useState } from "react";

export type FlowType = "conversation" | "stuck" | "visibility" | "negotiate" | "mindset";
export type CoachingStrategy = "DIRECT_CONVERSATION" | "INDIRECT_INFLUENCE" | "STRATEGIC_CONTAINMENT";

export interface StrategyOption {
  type: CoachingStrategy;
  label: string;
}

export interface StrategyRecommendation {
  recommendedStrategy: CoachingStrategy;
  reason: string;
  options: StrategyOption[];
}

export interface CoachingScript {
  opening: string;
  issue: string;
  impact: string;
  ask: string;
  pushback: string;
}

export interface CoachingResult {
  strategy: CoachingStrategy;
  reframe: string;
  breakdown: string;
  script: CoachingScript | null;
  tactics: string[];
  nextSteps: string[];
}

interface CoachingContextValue {
  activeFlow: FlowType | null;
  answers: Record<string, string>;
  recommendation: StrategyRecommendation | null;
  result: CoachingResult | null;
  isEvaluating: boolean;
  isLoading: boolean;
  error: string | null;
  setActiveFlow: (flow: FlowType | null) => void;
  setAnswer: (key: string, value: string) => void;
  resetFlow: () => void;
  evaluateFlow: () => Promise<void>;
  submitFlow: (strategy: CoachingStrategy) => Promise<void>;
}

const CoachingContext = createContext<CoachingContextValue | null>(null);

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function safeParseRecommendation(raw: unknown): StrategyRecommendation {
  const defaultOptions: StrategyOption[] = [
    { type: "DIRECT_CONVERSATION", label: "Address it directly" },
    { type: "INDIRECT_INFLUENCE", label: "Shift perception and influence dynamics" },
    { type: "STRATEGIC_CONTAINMENT", label: "Protect your position and manage risk" },
  ];
  const fallback: StrategyRecommendation = {
    recommendedStrategy: "DIRECT_CONVERSATION",
    reason: "Based on your situation, a direct approach is most likely to move things forward.",
    options: defaultOptions,
  };
  if (typeof raw !== "object" || raw === null) return fallback;
  const obj = raw as Record<string, unknown>;
  const rawStrategy = String(obj.recommendedStrategy ?? "").trim().toUpperCase();
  const recommendedStrategy: CoachingStrategy =
    rawStrategy === "INDIRECT_INFLUENCE" ? "INDIRECT_INFLUENCE"
    : rawStrategy === "STRATEGIC_CONTAINMENT" ? "STRATEGIC_CONTAINMENT"
    : "DIRECT_CONVERSATION";
  const reason = str(obj.reason, fallback.reason);
  let options = defaultOptions;
  if (Array.isArray(obj.options) && obj.options.length === 3) {
    const parsed = obj.options.map((o: unknown) => {
      if (typeof o !== "object" || o === null) return null;
      const op = o as Record<string, unknown>;
      const t = String(op.type ?? "").trim().toUpperCase() as CoachingStrategy;
      const validTypes: CoachingStrategy[] = ["DIRECT_CONVERSATION", "INDIRECT_INFLUENCE", "STRATEGIC_CONTAINMENT"];
      if (!validTypes.includes(t)) return null;
      return { type: t, label: str(op.label, t) };
    });
    if (parsed.every(Boolean)) options = parsed as StrategyOption[];
  }
  return { recommendedStrategy, reason, options };
}

function safeParseResult(raw: unknown, chosenStrategy: CoachingStrategy): CoachingResult {
  const fallback: CoachingResult = {
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
    tactics: [
      "1. Write down exactly what you want to say — one paragraph, no hedging.",
      "2. Schedule the conversation within 48 hours.",
      "3. Say your opening line out loud before the meeting.",
    ],
    nextSteps: ["Take one concrete action today that moves this forward."],
  };
  if (typeof raw !== "object" || raw === null) return fallback;
  const obj = raw as Record<string, unknown>;
  const reframe = str(obj.reframe, fallback.reframe);
  const breakdown = str(obj.breakdown, fallback.breakdown);
  let script: CoachingScript | null = null;
  if (chosenStrategy === "DIRECT_CONVERSATION" && typeof obj.script === "object" && obj.script !== null) {
    const s = obj.script as Record<string, unknown>;
    script = {
      opening: str(s.opening, "I want to address something directly."),
      issue: str(s.issue, "There is a behavior that needs to change."),
      impact: str(s.impact, "This is affecting my work and credibility."),
      ask: str(s.ask, "I need this resolved."),
      pushback: str(s.pushback, "I understand. This still needs to be addressed."),
    };
  }
  const tactics: string[] = Array.isArray(obj.tactics)
    ? obj.tactics.filter((t) => typeof t === "string" && t.trim()).map((t) => String(t).trim())
    : fallback.tactics;
  const nextSteps: string[] = Array.isArray(obj.nextSteps)
    ? obj.nextSteps.filter((s) => typeof s === "string" && s.trim()).map((s) => String(s).trim())
    : typeof obj.nextSteps === "string" && (obj.nextSteps as string).trim()
    ? [(obj.nextSteps as string).trim()]
    : fallback.nextSteps;
  return { strategy: chosenStrategy, reframe, breakdown, script, tactics, nextSteps };
}

function getBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

export function CoachingProvider({ children }: { children: React.ReactNode }) {
  const [activeFlow, setActiveFlowState] = useState<FlowType | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
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

  const setAnswer = (key: string, value: string) => {
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
      if (!response.ok) throw new Error("Server error");
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

  const submitFlow = async (strategy: CoachingStrategy) => {
    if (!activeFlow) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getBase()}/api/coaching/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowType: activeFlow, answers, strategy }),
      });
      if (!response.ok) throw new Error("Server error");
      const text = await response.text();
      const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      let parsed: unknown;
      try { parsed = JSON.parse(stripped); } catch { parsed = null; }
      setResult(safeParseResult(parsed, strategy));
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
