import React, { createContext, useContext, useState } from "react";

export type FlowType = "conversation" | "stuck" | "visibility" | "negotiate" | "mindset";

export interface CoachingSection {
  title: string;
  content: string;
}

export interface CoachingResult {
  headline: string;
  sections: CoachingSection[];
  affirmation: string;
  nextStep: string;
}

interface CoachingContextValue {
  activeFlow: FlowType | null;
  answers: Record<string, string>;
  result: CoachingResult | null;
  isLoading: boolean;
  error: string | null;
  setActiveFlow: (flow: FlowType | null) => void;
  setAnswer: (key: string, value: string) => void;
  resetFlow: () => void;
  submitFlow: () => Promise<void>;
}

const CoachingContext = createContext<CoachingContextValue | null>(null);

function safeParseCoachingResult(raw: unknown): CoachingResult {
  if (typeof raw !== "object" || raw === null) {
    return {
      headline: "Your Coaching Insight",
      sections: [{ title: "Coaching", content: String(raw) }],
      affirmation: "You have what it takes to move through this.",
      nextStep: "Take one concrete step toward your goal today.",
    };
  }

  const obj = raw as Record<string, unknown>;

  const headline = typeof obj.headline === "string" && obj.headline.trim()
    ? obj.headline.trim()
    : "Your Coaching Insight";

  const affirmation = typeof obj.affirmation === "string" && obj.affirmation.trim()
    ? obj.affirmation.trim()
    : "You have what it takes to move through this.";

  const nextStep = typeof obj.nextStep === "string" && obj.nextStep.trim()
    ? obj.nextStep.trim()
    : "Take one concrete step toward your goal today.";

  let sections: CoachingSection[] = [];
  if (Array.isArray(obj.sections)) {
    sections = obj.sections
      .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
      .map((s) => ({
        title: typeof s.title === "string" ? s.title.trim() : "Insight",
        content: typeof s.content === "string" ? s.content.trim() : "",
      }))
      .filter((s) => s.content.length > 0);
  }

  if (sections.length === 0) {
    sections = [{ title: "Coaching", content: "Please try again for a full coaching response." }];
  }

  return { headline, sections, affirmation, nextStep };
}

export function CoachingProvider({ children }: { children: React.ReactNode }) {
  const [activeFlow, setActiveFlowState] = useState<FlowType | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CoachingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setActiveFlow = (flow: FlowType | null) => {
    setActiveFlowState(flow);
    setAnswers({});
    setResult(null);
    setError(null);
  };

  const setAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const resetFlow = () => {
    setActiveFlowState(null);
    setAnswers({});
    setResult(null);
    setError(null);
    setIsLoading(false);
  };

  const submitFlow = async () => {
    if (!activeFlow) return;
    setIsLoading(true);
    setError(null);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const base = domain ? `https://${domain}` : "";
      const response = await fetch(`${base}/api/coaching/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowType: activeFlow, answers }),
      });
      if (!response.ok) {
        throw new Error("Server returned an error");
      }
      const text = await response.text();
      const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      let parsed: unknown;
      try {
        parsed = JSON.parse(stripped);
      } catch {
        parsed = { headline: "Your Coaching Insight", sections: [{ title: "Coaching", content: stripped }], affirmation: "You have what it takes.", nextStep: "Take one concrete step today." };
      }
      setResult(safeParseCoachingResult(parsed));
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CoachingContext.Provider
      value={{
        activeFlow,
        answers,
        result,
        isLoading,
        error,
        setActiveFlow,
        setAnswer,
        resetFlow,
        submitFlow,
      }}
    >
      {children}
    </CoachingContext.Provider>
  );
}

export function useCoaching() {
  const ctx = useContext(CoachingContext);
  if (!ctx) throw new Error("useCoaching must be used within CoachingProvider");
  return ctx;
}
