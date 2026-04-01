import React, { createContext, useContext, useState } from "react";

export type FlowType = "conversation" | "stuck" | "visibility" | "negotiate" | "mindset";

export interface CoachingResult {
  headline: string;
  sections: { title: string; content: string }[];
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
      if (!response.ok) throw new Error("Failed to get coaching response");
      const data = await response.json() as CoachingResult;
      setResult(data);
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
