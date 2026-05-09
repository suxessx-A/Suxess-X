import React, { useState, useEffect, useCallback, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

// ============================================================
// TYPES
// ============================================================

type FlowType = "conversation" | "stuck" | "speak_up" | "executive_visibility" | "negotiate" | "mindset";
type Screen = "loading" | "onboarding" | "home" | "questions" | "strategy" | "thinking" | "result" | "error";
type Strategy = "DIRECT_CONVERSATION" | "INDIRECT_INFLUENCE" | "STRATEGIC_CONTAINMENT";
type ProblemType = "AVOIDING_CHALLENGER" | "VICTIM" | "OVERWHELMED";

interface UserProfile {
  name: string;
  email: string;
  industry: string;
  level: string;
  challenge: string;
  goal: string;
}

interface CoachingResult {
  problemType: ProblemType;
  strategy: Strategy | null;
  mode?: string;
  roleShift?: string;
  behavioralObjective?: string;
  reframe?: string;
  breakdown?: string;
  trigger?: { triggerName: string; energyShift: string; repetitionStatement: string };
  identityAnchor?: string;
  script?: { opening: string; issue: string; impact: string; ask: string; pushback?: string | null } | null;
  sections?: Array<{ title: string; content: string; premium?: boolean }>;
  nextSteps?: string[];
  closingQuestion?: string;
}

interface StrategyRecommendation {
  problemType: ProblemType;
  recommendedStrategy: Strategy;
  powerDiagnosis?: string;
  assessment: Record<Strategy, string>;
  options: Array<{ type: Strategy; label: string }>;
}

interface Question {
  id: string;
  label: string;
  sublabel?: string;
  type: "text" | "textarea" | "choice" | "multiselect";
  options?: string[];
}

// ============================================================
// CONSTANTS
// ============================================================

const C = {
  bg: "#0a0a14",
  card: "rgba(255,255,255,0.04)",
  cardHover: "rgba(255,255,255,0.07)",
  primary: "#7c3aed",
  primaryLight: "rgba(124,58,237,0.12)",
  primaryBorder: "rgba(124,58,237,0.25)",
  gold: "#d4a017",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.5)",
  dim: "rgba(255,255,255,0.3)",
  border: "rgba(255,255,255,0.1)",
};

const FLOWS = [
  { type: "conversation" as FlowType, title: "Tackle a Tough Conversation", icon: "💬", desc: "Address conflict, feedback, or a difficult dynamic head on" },
  { type: "stuck" as FlowType, title: "I Feel Stuck in My Career", icon: "🔄", desc: "Find your next move with clarity and a concrete plan" },
  { type: "speak_up" as FlowType, title: "Speak Up in Meetings", icon: "🎤", desc: "Stop going silent and own the room" },
  { type: "executive_visibility" as FlowType, title: "Make My Work Visible", icon: "👁", desc: "Get recognised at the executive level for what you deliver" },
  { type: "negotiate" as FlowType, title: "Negotiate Something Important", icon: "⚡", desc: "Ask for more — pay, scope, a role, or an offer" },
  { type: "mindset" as FlowType, title: "Reset My Mindset Quickly", icon: "🧠", desc: "Interrupt a Passenger pattern before it costs you momentum" },
];

const SKIP_EVALUATE: FlowType[] = ["mindset", "speak_up", "executive_visibility", "negotiate"];

const FLOW_QUESTIONS: Record<FlowType, Question[]> = {
  conversation: [
    { id: "who", label: "Who is this conversation with?", type: "text" },
    { id: "topic", label: "What does it need to address?", sublabel: "Be specific — the more precise, the better the coaching.", type: "textarea" },
    { id: "feeling", label: "How are you feeling going into it?", type: "choice", options: ["Anxious", "Frustrated", "Resigned", "Avoidant", "Determined but unsure how"] },
    { id: "goal", label: "What does a successful conversation look like?", type: "textarea" },
  ],
  stuck: [
    { id: "root_cause", label: "What do you believe is holding you back most?", type: "choice", options: ["I am not clear on what I want", "I know what I want but do not know how to get there", "Something or someone is in the way"] },
    { id: "strengths", label: "What strengths do you bring? Select all that apply.", type: "multiselect", options: ["Strategic thinking", "Building relationships", "Getting things done", "Creative problem solving", "Leading teams", "Technical expertise", "Communication", "Resilience"] },
    { id: "wants", label: "What do you want more of at work? Select all that apply.", type: "multiselect", options: ["Recognition", "Autonomy", "Influence", "Creativity", "Leadership", "Technical depth", "Income", "Flexibility", "Meaning"] },
    { id: "directions", label: "What directions are calling to you? Select all that apply.", type: "multiselect", options: ["A bigger role in my organisation", "A new organisation", "A career pivot", "My own business", "Deeper expertise in my field", "Portfolio career or consulting"] },
    { id: "success", label: "What does success look like for you in 3 years?", sublabel: "Be specific. This shapes everything.", type: "textarea" },
  ],
  speak_up: [
    { id: "meeting_type", label: "What type of meeting do you struggle most in?", type: "choice", options: ["Executive or senior leadership meetings", "Cross-functional team meetings", "Large all-hands or town halls", "One-on-ones with my manager", "Client or stakeholder meetings"] },
    { id: "blocker", label: "What holds you back in the moment?", type: "choice", options: ["I do not feel confident enough in my view", "I worry about being judged or dismissed", "Others talk over me or I lose the window", "I have something to say but wait too long", "I edit my point out before I speak it"] },
    { id: "pattern", label: "What happens when you stay quiet?", sublabel: "What does it cost you — in that room and after?", type: "textarea" },
    { id: "cost", label: "What has staying quiet cost you so far?", type: "textarea" },
  ],
  executive_visibility: [
    { id: "challenge", label: "What is your main visibility challenge?", type: "choice", options: ["My work is not seen by senior leaders", "I do not know how to communicate my impact", "My contributions get attributed to others", "I am working hard but not getting recognised", "I avoid self-promotion — it does not feel natural"] },
    { id: "audience", label: "Who do you most need to be visible to?", type: "text" },
    { id: "medium", label: "How do you currently share your work?", type: "choice", options: ["Mostly in meetings when asked", "Written updates and reports", "One-on-ones with my manager", "I do not have a regular format", "Multiple channels — formal and informal"] },
    { id: "gap", label: "What is your biggest gap in how you position your work?", type: "choice", options: ["I describe tasks and effort, not outcomes", "I do not connect my work to business impact", "I undersell what I have actually delivered", "I communicate reactively, not proactively", "I struggle to own credit for results"] },
  ],
  negotiate: [
    { id: "situation_type", label: "What is your situation?", type: "choice", options: ["I believe I am underpaid", "My role has grown", "I have received a job offer"] },
    { id: "what", label: "What specifically are you negotiating for?", sublabel: "e.g. salary, title, scope, bonus, equity", type: "text" },
    { id: "timing", label: "Where are you in the process?", type: "choice", options: ["I have not started the conversation yet", "I have raised it and am waiting", "They gave me a number — I need to respond", "We are mid-negotiation"] },
    { id: "target", label: "What is your target outcome?", sublabel: "Name a specific number or outcome.", type: "text" },
    { id: "leverage", label: "What leverage do you have?", sublabel: "Market data, competing offers, expanded scope, results?", type: "textarea" },
    { id: "fear", label: "What worries you most?", type: "choice", options: ["They will say no and it will affect how they see me", "I will ask for too much and lose the offer", "I do not have enough leverage", "I will not handle pushback well", "I will back down when challenged"] },
  ],
  mindset: [
    { id: "feeling", label: "What is weighing on you right now?", sublabel: "What happened, or what are you feeling?", type: "textarea" },
    { id: "trigger", label: "What triggered this?", type: "text" },
    { id: "pattern", label: "What is your mind doing with it?", type: "choice", options: ["Comparing myself to others and coming up short", "Doubting whether I am good enough", "Feeling like this is happening to me and I have no control", "Spinning — doing everything and getting nowhere"] },
  ],
};

const STRATEGY_CFG: Record<Strategy, { label: string; icon: string; color: string; desc: string }> = {
  DIRECT_CONVERSATION: { label: "Challenge It Directly", icon: "⚡", color: "#7c3aed", desc: "Name the issue, have the conversation, shift the dynamic head on." },
  INDIRECT_INFLUENCE: { label: "Shift the Dynamic", icon: "♟", color: "#0369a1", desc: "Influence the outcome through positioning, relationships, and framing." },
  STRATEGIC_CONTAINMENT: { label: "Hold the Standard", icon: "🛡", color: "#b45309", desc: "Protect your position and manage risk while maintaining standards." },
};

const SECTION_ICONS: Record<string, string> = {
  "Strategic Positioning": "🎯", "Influence Moves": "🔗", "Visibility Actions": "👁",
  "Standard Definition": "📌", "Control Moves": "🛡", "Timing Decision": "⏱",
  "Clarity Map": "🔍", "Direction Options": "🗺", "Outreach Scripts": "✉",
  "Follow-Up Strategy": "📋", "Ownership Shift": "🔥", "External Move": "⚡",
  "Direction Lock": "🎯", "Momentum Loop": "🔄", "Internal Clarity": "🧭",
  "Handle Pushback": "🛡", "Discipline": "⚡", "Before You Walk In": "✏️",
  "Get In Early": "🎯", "The Two-Sentence Rule": "💡", "Your Lines": "🎤",
  "Task to Impact": "🔄", "Executive Frames": "📐", "The Standard": "⚡",
  "Your Value Case": "📊", "Lead with Contribution": "🎯", "Bridge to Compensation": "🔗",
  "If They Resist": "🛡", "Positioning": "🎯", "Opening and Market Reference": "📢",
  "Lock a Timeline": "📅", "Before You Respond": "📋", "Counter the Offer": "💬",
  "What Else Is On the Table": "🔑", "Interrupt": "⚡", "Direct": "🎯", "Power Questions": "🔍",
};

const INDUSTRIES = ["Mining and Resources", "Heavy Industry and Infrastructure", "Corporate and Executive", "STEM and Technical", "Other"];
const LEVELS = ["Senior Leader or Executive", "Manager or Team Lead", "Senior Professional", "Professional"];
const CHALLENGES = ["Getting recognised for my work", "Navigating difficult people or relationships", "Moving into a bigger or more senior role", "Asking for what I deserve: pay, promotion, scope", "Managing my confidence under pressure"];

// ============================================================
// ERROR BOUNDARY
// ============================================================

interface EBState { hasError: boolean }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError(): EBState { return { hasError: true }; }
  componentDidCatch(e: Error, info: React.ErrorInfo) { console.error("ErrorBoundary:", e, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 400, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ color: C.text, fontFamily: "Inter, sans-serif", marginBottom: 12 }}>Something went wrong</h2>
            <p style={{ color: C.muted, fontFamily: "Inter, sans-serif", marginBottom: 24, lineHeight: 1.6 }}>Please refresh the page to try again.</p>
            <button onClick={() => window.location.reload()} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 12, padding: "14px 28px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// SHARED COMPONENTS
// ============================================================

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <div style={{ width: 32, height: 32, border: `3px solid rgba(124,58,237,0.2)`, borderTopColor: C.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

function PrimaryBtn({ label, onPress, disabled, fullWidth }: { label: string; onPress: () => void; disabled?: boolean; fullWidth?: boolean }) {
  return (
    <button onClick={onPress} disabled={disabled} style={{ width: fullWidth ? "100%" : "auto", background: disabled ? "rgba(124,58,237,0.3)" : C.primary, color: "#fff", border: "none", borderRadius: 12, padding: "16px 24px", fontSize: 16, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif", letterSpacing: 0.3 }}>
      {label}
    </button>
  );
}

function BackBtn({ onPress }: { onPress: () => void }) {
  return (
    <button onClick={onPress} style={{ background: "none", border: "none", color: C.muted, fontFamily: "Inter, sans-serif", fontSize: 14, cursor: "pointer", padding: "8px 0", marginTop: 8 }}>
      ← Back
    </button>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div style={{ background: "#7f1d1d", color: "#fca5a5", padding: "12px 20px", fontFamily: "Inter, sans-serif", fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{message}</span>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", fontSize: 18, padding: "0 0 0 12px" }}>×</button>
    </div>
  );
}

// ============================================================
// ONBOARDING
// ============================================================

function OnboardingScreen({ onComplete }: { onComplete: (p: UserProfile) => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<UserProfile>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("");

  const progress = (step / 6) * 100;
  const emailValid = email.includes("@") && email.includes(".");

  const advance = (key: keyof UserProfile, value: string) => {
    const updated = { ...data, [key]: value };
    setData(updated);
    if (step < 6) setStep(step + 1);
    else onComplete(updated as UserProfile);
  };

  const optBtn = (label: string, onPress: () => void) => (
    <button key={label} onClick={onPress} style={{ width: "100%", textAlign: "left", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 10, cursor: "pointer", color: "rgba(255,255,255,0.7)", fontFamily: "Inter, sans-serif", fontSize: 15 }}>
      {label}
    </button>
  );

  const inputStyle: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 12, border: `1px solid rgba(255,255,255,0.12)`, padding: "14px 16px", fontSize: 16, color: "#fff", fontFamily: "Inter, sans-serif", marginBottom: 20, boxSizing: "border-box", outline: "none" };
  const eyebrow = (text: string) => <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.primary, fontWeight: 700, fontFamily: "Inter, sans-serif", marginBottom: 10 }}>{text}</p>;
  const title = (text: string) => <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "Inter, sans-serif", lineHeight: 1.3, marginBottom: 8 }}>{text}</h2>;
  const sub = (text: string) => <p style={{ fontSize: 14, color: C.muted, fontFamily: "Inter, sans-serif", lineHeight: 1.6, marginBottom: 20 }}>{text}</p>;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 20px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <p style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", fontWeight: 600, marginBottom: 16 }}>AMPLIFY X</p>
        <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: 32 }}>
          <div style={{ height: 3, width: `${progress}%`, background: C.primary, borderRadius: 2, transition: "width 0.3s ease" }} />
        </div>

        {step === 1 && (
          <div>
            {eyebrow("Let's start")}
            {title("What should I call you?")}
            <input autoFocus style={inputStyle} placeholder="Your first name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && name.trim() && advance("name", name.trim())} />
            <PrimaryBtn label="Continue" onPress={() => advance("name", name.trim())} disabled={!name.trim()} fullWidth />
          </div>
        )}
        {step === 2 && (
          <div>
            {eyebrow("Step 2 of 6")}
            {title("What is your email address?")}
            {sub("Used to save your progress and send your weekly summary.")}
            <input autoFocus type="email" style={inputStyle} placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && emailValid && advance("email", email.trim())} />
            <PrimaryBtn label="Continue" onPress={() => advance("email", email.trim())} disabled={!emailValid} fullWidth />
            <div style={{ textAlign: "center" }}><BackBtn onPress={() => setStep(1)} /></div>
          </div>
        )}
        {step === 3 && (
          <div>
            {eyebrow("Step 3 of 6")}
            {title("What is your industry?")}
            {INDUSTRIES.map(i => optBtn(i, () => advance("industry", i)))}
            <BackBtn onPress={() => setStep(2)} />
          </div>
        )}
        {step === 4 && (
          <div>
            {eyebrow("Step 4 of 6")}
            {title("What is your level?")}
            {LEVELS.map(l => optBtn(l, () => advance("level", l)))}
            <BackBtn onPress={() => setStep(3)} />
          </div>
        )}
        {step === 5 && (
          <div>
            {eyebrow("Step 5 of 6")}
            {title("What is your biggest challenge right now?")}
            {CHALLENGES.map(c => optBtn(c, () => advance("challenge", c)))}
            <BackBtn onPress={() => setStep(4)} />
          </div>
        )}
        {step === 6 && (
          <div>
            {eyebrow("Step 6 of 6")}
            {title("What does success look like for you in the next 6 months?")}
            {sub("Be specific. This shapes everything that follows.")}
            <textarea autoFocus style={{ ...inputStyle, height: 120, resize: "none", lineHeight: 1.6 } as React.CSSProperties} placeholder="e.g. I want to be seen as a strategic leader and have the salary conversation I have been avoiding" value={goal} onChange={e => setGoal(e.target.value)} />
            <PrimaryBtn label="Start my coaching" onPress={() => advance("goal", goal.trim())} disabled={!goal.trim()} fullWidth />
            <div style={{ textAlign: "center" }}><BackBtn onPress={() => setStep(5)} /></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// HOME
// ============================================================

function HomeScreen({ profile, onSelectFlow, onReset }: { profile: UserProfile; onSelectFlow: (f: FlowType) => void; onReset: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 20px 60px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", fontWeight: 600, margin: 0 }}>AMPLIFY X</p>
          <button onClick={onReset} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Reset profile</button>
        </div>
        <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.gold, fontWeight: 700, fontFamily: "Inter, sans-serif", marginBottom: 8 }}>Welcome back</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, fontFamily: "Inter, sans-serif", lineHeight: 1.25, marginBottom: 8 }}>Good to have you, {profile.name}.</h1>
        <p style={{ fontSize: 15, color: C.muted, fontFamily: "Inter, sans-serif", lineHeight: 1.6, marginBottom: 32 }}>What do you need to move on today?</p>
        {FLOWS.map(flow => (
          <button key={flow.type} onClick={() => onSelectFlow(flow.type)} style={{ width: "100%", textAlign: "left", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px", marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 16 }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>{flow.icon}</span>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "Inter, sans-serif", margin: "0 0 4px 0" }}>{flow.title}</p>
              <p style={{ fontSize: 13, color: C.muted, fontFamily: "Inter, sans-serif", margin: 0, lineHeight: 1.5 }}>{flow.desc}</p>
            </div>
          </button>
        ))}
        <p style={{ fontSize: 12, color: C.dim, fontFamily: "Inter, sans-serif", textAlign: "center", marginTop: 24 }}>Amplify X — AI executive coaching for professional women</p>
      </div>
    </div>
  );
}

// ============================================================
// QUESTIONS
// ============================================================

function QuestionsScreen({ flow, onComplete, onBack }: { flow: FlowType; onComplete: (a: Record<string, string | string[]>) => void; onBack: () => void }) {
  const questions = FLOW_QUESTIONS[flow];
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const flowInfo = FLOWS.find(f => f.type === flow)!;
  const q = questions[qIndex];
  const total = questions.length;
  const progress = ((qIndex + 1) / total) * 100;
  const cur = answers[q.id];
  const isAnswered = q.type === "multiselect" ? Array.isArray(cur) && (cur as string[]).length > 0 : typeof cur === "string" && cur.trim().length > 0;

  const chooseOption = (val: string) => {
    const updated = { ...answers, [q.id]: val };
    setAnswers(updated);
    setTimeout(() => {
      if (qIndex < total - 1) setQIndex(qIndex + 1);
      else onComplete(updated);
    }, 180);
  };

  const toggleMulti = (opt: string) => {
    const current = (answers[q.id] as string[] | undefined) ?? [];
    const next = current.includes(opt) ? current.filter(x => x !== opt) : [...current, opt];
    setAnswers(prev => ({ ...prev, [q.id]: next }));
  };

  const handleNext = () => {
    if (!isAnswered) return;
    if (qIndex < total - 1) setQIndex(qIndex + 1);
    else onComplete(answers);
  };

  const optBtn = (label: string, selected: boolean, onPress: () => void) => (
    <button key={label} onClick={onPress} style={{ width: "100%", textAlign: "left", background: selected ? C.primaryLight : "rgba(255,255,255,0.04)", border: `1px solid ${selected ? C.primary : C.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 10, cursor: "pointer", color: selected ? C.text : "rgba(255,255,255,0.7)", fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: selected ? 600 : 400 }}>
      {q.type === "multiselect" && <span style={{ marginRight: 10, color: selected ? C.primary : C.dim }}>{selected ? "✓" : "○"}</span>}
      {label}
    </button>
  );

  const inputStyle: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 12, border: `1px solid rgba(255,255,255,0.12)`, padding: "14px 16px", fontSize: 16, color: "#fff", fontFamily: "Inter, sans-serif", marginBottom: 20, boxSizing: "border-box", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 20px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={qIndex === 0 ? onBack : () => setQIndex(qIndex - 1)} style={{ background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer", padding: 0, lineHeight: 1 }}>←</button>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", margin: "0 0 8px 0" }}>{flowInfo.title}</p>
            <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
              <div style={{ height: 3, width: `${progress}%`, background: C.primary, borderRadius: 2, transition: "width 0.3s" }} />
            </div>
          </div>
        </div>

        <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.primary, fontWeight: 700, fontFamily: "Inter, sans-serif", marginBottom: 10 }}>{qIndex + 1} / {total}</p>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "Inter, sans-serif", lineHeight: 1.35, marginBottom: q.sublabel ? 8 : 20 }}>{q.label}</h2>
        {q.sublabel && <p style={{ fontSize: 14, color: C.muted, fontFamily: "Inter, sans-serif", lineHeight: 1.6, marginBottom: 20 }}>{q.sublabel}</p>}

        {q.type === "text" && (
          <>
            <input autoFocus style={inputStyle} placeholder="Type your answer..." value={(answers[q.id] as string) ?? ""} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} onKeyDown={e => e.key === "Enter" && isAnswered && handleNext()} />
            <PrimaryBtn label="Continue" onPress={handleNext} disabled={!isAnswered} fullWidth />
          </>
        )}
        {q.type === "textarea" && (
          <>
            <textarea autoFocus style={{ ...inputStyle, height: 120, resize: "none", lineHeight: 1.6 } as React.CSSProperties} placeholder="Type your answer..." value={(answers[q.id] as string) ?? ""} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} />
            <PrimaryBtn label={qIndex === total - 1 ? "Get my coaching" : "Continue"} onPress={handleNext} disabled={!isAnswered} fullWidth />
          </>
        )}
        {q.type === "choice" && q.options?.map(opt => optBtn(opt, answers[q.id] === opt, () => chooseOption(opt)))}
        {q.type === "multiselect" && (
          <>
            {q.options?.map(opt => optBtn(opt, ((answers[q.id] as string[]) ?? []).includes(opt), () => toggleMulti(opt)))}
            <div style={{ marginTop: 8 }}>
              <PrimaryBtn label={qIndex === total - 1 ? "Get my coaching" : "Continue"} onPress={handleNext} disabled={!isAnswered} fullWidth />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// STRATEGY
// ============================================================

function StrategyScreen({ recommendation, onSelect, onBack }: { recommendation: StrategyRecommendation; onSelect: (s: Strategy) => void; onBack: () => void }) {
  const strategies: Strategy[] = ["DIRECT_CONVERSATION", "INDIRECT_INFLUENCE", "STRATEGIC_CONTAINMENT"];
  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 20px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontFamily: "Inter, sans-serif", fontSize: 14, cursor: "pointer", padding: "0 0 24px 0" }}>← Back</button>
        <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.primary, fontWeight: 700, fontFamily: "Inter, sans-serif", marginBottom: 10 }}>Your Diagnosis</p>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: "Inter, sans-serif", lineHeight: 1.35, marginBottom: 8 }}>Choose your approach</h2>
        {recommendation.powerDiagnosis && <p style={{ fontSize: 14, color: C.muted, fontFamily: "Inter, sans-serif", lineHeight: 1.6, marginBottom: 24 }}>{recommendation.powerDiagnosis}</p>}
        {strategies.map(s => {
          const cfg = STRATEGY_CFG[s];
          const isRec = s === recommendation.recommendedStrategy;
          return (
            <button key={s} onClick={() => onSelect(s)} style={{ width: "100%", textAlign: "left", background: isRec ? C.primaryLight : "rgba(255,255,255,0.04)", border: `${isRec ? 2 : 1}px solid ${isRec ? cfg.color : C.border}`, borderRadius: 16, padding: "18px", marginBottom: 12, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "Inter, sans-serif" }}>{cfg.label}</span>
                {isRec && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: cfg.color, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>Recommended</span>}
              </div>
              {recommendation.assessment[s] && <p style={{ fontSize: 13, color: C.muted, fontFamily: "Inter, sans-serif", lineHeight: 1.5, margin: 0 }}>{recommendation.assessment[s]}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// THINKING
// ============================================================

function ThinkingScreen() {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>⚡</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "Inter, sans-serif", marginBottom: 8 }}>Analysing your situation{"...".slice(0, dot)}</h2>
        <p style={{ fontSize: 14, color: C.muted, fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}>Building your personalised coaching plan.</p>
        <Spinner />
      </div>
    </div>
  );
}

// ============================================================
// RESULT
// ============================================================

function ResultScreen({ result, onReset }: { result: CoachingResult; onReset: () => void }) {
  const stratColor = result.strategy ? STRATEGY_CFG[result.strategy]?.color ?? C.primary : C.primary;
  const sectionHeader = (color: string, label: string) => (
    <div style={{ background: color, padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>{label}</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 20px 60px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <p style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", fontWeight: 600, margin: 0 }}>AMPLIFY X</p>
          <button onClick={onReset} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontFamily: "Inter, sans-serif", fontSize: 13, cursor: "pointer", padding: "6px 14px" }}>Back to home</button>
        </div>

        {/* Role Shift */}
        {result.roleShift && (
          <div style={{margin:'12px 0',padding:'16px',background:'#1a1a2e',borderRadius:'14px',border:'1px solid rgba(124,58,237,0.2)'}}>
            <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.4)',marginBottom:'10px'}}>ROLE SHIFT</div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              {(() => {
                const parts = result.roleShift.split(/\s*[→\-–—]+\s*/);
                const from = parts[0]?.trim();
                const to = parts[1]?.trim();
                return (<>
                  {from && <div style={{flex:1,background:'rgba(239,68,68,0.1)',borderRadius:'8px',padding:'10px'}}>
                    <div style={{fontSize:'9px',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'rgba(239,68,68,0.7)',marginBottom:'3px'}}>FROM</div>
                    <div style={{fontSize:'13px',fontWeight:600,color:'rgba(255,255,255,0.85)',lineHeight:'1.4'}}>{from}</div>
                  </div>}
                  {to && <div style={{fontSize:'20px',color:'#d4a017',fontWeight:700}}>→</div>}
                  {to && <div style={{flex:1,background:'rgba(124,58,237,0.15)',borderRadius:'8px',padding:'10px'}}>
                    <div style={{fontSize:'9px',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'#a78bfa',marginBottom:'3px'}}>TO</div>
                    <div style={{fontSize:'13px',fontWeight:700,color:'#fff',lineHeight:'1.4'}}>{to}</div>
                  </div>}
                </>);
              })()}
            </div>
          </div>
        )}

        {/* Behavioral Objective */}
        {result.behavioralObjective && (
          <div style={{ borderRadius: 14, background: stratColor, padding: 18, marginBottom: 12 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "Inter, sans-serif", marginBottom: 8 }}>Your Move</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", fontFamily: "Inter, sans-serif", lineHeight: 1.5, margin: 0 }}>{result.behavioralObjective}</p>
          </div>
        )}

        {/* Reframe */}
        {result.reframe && (
          <div style={{ borderRadius: 14, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", padding: 18, marginBottom: 12 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "Inter, sans-serif", marginBottom: 10 }}>Reframe</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "Inter, sans-serif", lineHeight: 1.5, margin: 0 }}>"{result.reframe}"</p>
          </div>
        )}

        {/* Breakdown */}
        {result.breakdown && (
          <div style={{ borderRadius: 14, marginBottom: 12, overflow: "hidden" }}>
            {sectionHeader("#374151", "Diagnosis")}
            <div style={{ background: "#f9fafb", padding: "14px 16px", fontSize: 15, color: "#1a1a2e", lineHeight: 1.7, fontFamily: "Inter, sans-serif", whiteSpace: "pre-wrap" }}>{result.breakdown}</div>
          </div>
        )}

        {/* Trigger */}
        {result.trigger && (
          <div style={{ borderRadius: 14, marginBottom: 12, overflow: "hidden" }}>
            {sectionHeader("#92400e", "⚡  Energy Reset")}
            <div style={{ background: "#fffbeb", padding: "14px 16px" }}>
              <div style={{marginBottom:'12px'}}>
                <div style={{fontSize:'9px',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'#78350f',marginBottom:'4px'}}>TRIGGER</div>
                <div style={{fontSize:'14px',color:'#1a1a2e',lineHeight:'1.6'}}>{result.trigger.triggerName}</div>
              </div>
              <div style={{marginBottom:'14px'}}>
                <div style={{fontSize:'9px',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'#78350f',marginBottom:'4px'}}>RESET FIRST</div>
                <div style={{fontSize:'14px',color:'#1a1a2e',lineHeight:'1.6'}}>{result.trigger.energyShift}</div>
              </div>
              <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 16, textAlign: "center" }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "Inter, sans-serif", marginBottom: 8 }}>Say 8× aloud</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>"{result.trigger.repetitionStatement}"</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", marginTop: 8 }}>Aloud. Before you move.</p>
              </div>
            </div>
          </div>
        )}

        {/* Identity Anchor */}
        {result.identityAnchor && (
          <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 16, marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>🧠</div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "Inter, sans-serif", marginBottom: 6 }}>Identity Anchor</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: "Inter, sans-serif", lineHeight: 1.5, margin: 0 }}>{result.identityAnchor}</p>
            </div>
          </div>
        )}

        {/* Script */}
        {result.script && (
          <div style={{ borderRadius: 14, marginBottom: 12, overflow: "hidden" }}>
            <div style={{ background: stratColor, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Inter, sans-serif" }}>💬  Challenger Script</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "Inter, sans-serif" }}>5-step execution</span>
            </div>
            <div style={{ background: "#f0f9ff", padding: "14px 16px" }}>
              {[
                { step: "Step 1", label: "Set the Frame", text: result.script.opening },
                { step: "Step 2", label: "Name the Issue", text: result.script.issue },
                { step: "Step 3", label: "State the Impact", text: result.script.impact },
                { step: "Step 4", label: "Make the Ask", text: result.script.ask, pause: true },
                ...(result.script.pushback ? [{ step: "Step 5", label: "Handle Pushback", text: result.script.pushback, isPushback: true }] : []),
              ].map((line, i) => (
                <div key={i} style={{ marginBottom: i < 3 ? 16 : 0 }}>
                  {line.isPushback && <div style={{ height: 1, background: "#bfdbfe", marginBottom: 16 }} />}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ background: line.isPushback ? "#dc2626" : stratColor, borderRadius: 4, padding: "2px 6px", fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: 0.8 }}>{line.step}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: line.isPushback ? "#dc2626" : stratColor, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>{line.label}</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e", fontFamily: "Inter, sans-serif", lineHeight: 1.55, borderLeft: `3px solid ${line.isPushback ? "#dc2626" : stratColor}`, paddingLeft: 12, paddingTop: 4, paddingBottom: 4, margin: "0 0 8px 0" }}>"{line.text}"</p>
                  {line.pause && (
                    <div style={{ background: "#fef3c7", borderRadius: 8, border: "1px solid #fde68a", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                      <span style={{ fontSize: 14 }}>⏸</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#92400e", fontFamily: "Inter, sans-serif" }}>Pause 3–5 seconds. Say nothing. Let them respond first.</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sections (free) */}
        {result.sections?.filter(s => !s.premium).map((section, i) => {
          const icon = SECTION_ICONS[section.title] ?? "▸";
          return (
            <div key={i} style={{ borderRadius: 14, marginBottom: 12, overflow: "hidden" }}>
              {sectionHeader(stratColor, `${icon}  ${section.title}`)}
              <div style={{ background: "rgba(255,255,255,0.97)", padding: "14px 16px", fontSize: 15, color: "#1a1a2e", lineHeight: 1.7, fontFamily: "Inter, sans-serif", whiteSpace: "pre-wrap" }}>{section.content}</div>
            </div>
          );
        })}

        {/* Premium lock */}
        {result.sections?.some(s => s.premium) && (
          <div style={{borderRadius:'10px',border:'1.5px solid #00D4AA',background:'rgba(0,212,170,0.06)',padding:'14px 18px',textAlign:'center',cursor:'pointer',marginBottom:'10px'}} onClick={()=>window.open('https://buy.stripe.com/aFa8wReBd99VgpR8HO5kk00','_blank')}>
            <div style={{fontSize:'12px',fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#00D4AA',marginBottom:'4px'}}>UNLOCK PREMIUM</div>
            <div style={{fontSize:'11px',color:'rgba(26,26,46,0.55)'}}>Less than a coffee a week &nbsp;·&nbsp; $20/month</div>
          </div>
        )}

        {/* Next Steps */}
        {result.nextSteps && result.nextSteps.length > 0 && (
          <div style={{ background: "#fffbeb", borderRadius: 14, border: "1px solid #fde68a", padding: 18, marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "Inter, sans-serif", marginBottom: 12 }}>Your Next Steps</p>
            {result.nextSteps.map((step, i) => (
              <p key={i} style={{ fontSize: 14, fontWeight: 600, color: "#78350f", fontFamily: "Inter, sans-serif", lineHeight: 1.6, marginBottom: i < result.nextSteps!.length - 1 ? 8 : 0, whiteSpace: "pre-wrap" }}>{step}</p>
            ))}
          </div>
        )}

        {/* Closing Question */}
        {result.closingQuestion && (
          <div style={{ borderRadius: 14, border: `2px solid ${C.primary}`, background: "#faf5ff", padding: 18, marginBottom: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "Inter, sans-serif", marginBottom: 10 }}>Before You Move</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1a1a2e", fontFamily: "Inter, sans-serif", lineHeight: 1.6, margin: 0 }}>{result.closingQuestion}</p>
          </div>
        )}

        {/* Premium Plus */}
        <div style={{marginTop:'24px'}}>
          <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#7c3aed',textAlign:'center',marginBottom:'6px'}}>PREMIUM PLUS — COMING SOON</div>
          <div style={{fontSize:'18px',fontWeight:800,color:'#1a1a2e',textAlign:'center',marginBottom:'16px'}}>Go further. Move faster.</div>
          {[
            {icon:'👥',title:'Peer Accountability',desc:"Get paired with someone working on the same challenges. Both of you see each other's commitments and follow-through."},
            {icon:'🎯',title:'Coach Escalation',desc:'Book a session with a vetted coach who already knows your history and patterns. No briefing required.'},
            {icon:'💬',title:'Personalised AI Coach',desc:'A coach built on your session history and patterns. It already knows who you are and what keeps getting in the way.'},
          ].map((item,i)=>(
            <div key={i} style={{borderRadius:'12px',border:'1px solid rgba(124,58,237,0.2)',background:'rgba(124,58,237,0.04)',padding:'18px',marginBottom:'10px',cursor:'pointer'}} onClick={()=>window.open('https://waitlist.amplify-x.co?source=momentum','_blank')}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
                <span style={{fontSize:'22px'}}>{item.icon}</span>
                <div>
                  <div style={{fontSize:'9px',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'#7c3aed',marginBottom:'2px'}}>PREMIUM PLUS</div>
                  <div style={{fontSize:'16px',fontWeight:700,color:'#1a1a2e'}}>{item.title}</div>
                </div>
              </div>
              <div style={{fontSize:'13px',color:'rgba(26,26,46,0.55)',lineHeight:'1.6',marginBottom:'10px'}}>{item.desc}</div>
              <div style={{fontSize:'12px',fontWeight:700,color:'#7c3aed'}}>Join the waitlist →</div>
            </div>
          ))}
        </div>

        <button onClick={onReset} style={{ width: "100%", border: `2px solid ${C.primary}`, borderRadius: 16, padding: 16, fontSize: 15, fontWeight: 600, color: C.primary, background: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", marginBottom: 12 }}>
          Start another flow
        </button>
        <a href="https://waitlist.amplify-x.co" target="_blank" rel="noopener noreferrer"
          style={{ display: "block", textAlign: "center", color: C.muted, fontFamily: "Inter, sans-serif", fontSize: 14, textDecoration: "none", padding: 12, marginBottom: 24 }}>
          Join the waitlist for the full mobile experience →
        </a>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [screen, setScreen] = useState<Screen>("loading");
  const [selectedFlow, setSelectedFlow] = useState<FlowType | null>(null);
  const [flowAnswers, setFlowAnswers] = useState<Record<string, string | string[]>>({});
  const [recommendation, setRecommendation] = useState<StrategyRecommendation | null>(null);
  const [result, setResult] = useState<CoachingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("amplify_profile");
      if (stored) { setProfile(JSON.parse(stored)); setScreen("home"); }
      else setScreen("onboarding");
    } catch { setScreen("onboarding"); }
  }, []);

  const saveProfile = useCallback((p: UserProfile) => {
    localStorage.setItem("amplify_profile", JSON.stringify(p));
    setProfile(p);
    setScreen("home");
  }, []);

  const resetProfile = useCallback(() => {
    localStorage.removeItem("amplify_profile");
    setProfile(null);
    setScreen("onboarding");
  }, []);

  const handleSelectFlow = useCallback((flow: FlowType) => {
    setSelectedFlow(flow);
    setFlowAnswers({});
    setRecommendation(null);
    setResult(null);
    setError(null);
    setScreen("questions");
  }, []);

  const runGenerate = async (flow: FlowType, answers: Record<string, string | string[]>, strategy: Strategy | null, problemType: string) => {
    try {
      const res = await fetch("/api/coaching/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowType: flow, answers, problemType, strategy, userProfile: profile ?? undefined }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}. Please try again.`);
      const data = await res.json();
      setResult(data);
      setScreen("result");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Connection failed. Check your internet and try again.";
      setError(msg);
      setScreen(recommendation ? "strategy" : "questions");
    }
  };

  const handleQuestionsComplete = useCallback(async (answers: Record<string, string | string[]>) => {
    setFlowAnswers(answers);
    setError(null);
    const skipEval = SKIP_EVALUATE.includes(selectedFlow!);
    if (skipEval) {
      setScreen("thinking");
      const defaultPT = selectedFlow === "mindset" ? "OVERWHELMED" : "AVOIDING_CHALLENGER";
      await runGenerate(selectedFlow!, answers, null, defaultPT);
    } else {
      setScreen("thinking");
      try {
        const res = await fetch("/api/coaching/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flowType: selectedFlow, answers }),
        });
        if (!res.ok) throw new Error(`Server error ${res.status}. Please try again.`);
        const data = await res.json();
        setRecommendation(data);
        setScreen("strategy");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Connection failed. Check your internet and try again.";
        setError(msg);
        setScreen("questions");
      }
    }
  }, [selectedFlow, profile]);

  const handleStrategySelect = useCallback(async (strategy: Strategy) => {
    setScreen("thinking");
    const pt = recommendation?.problemType ?? "AVOIDING_CHALLENGER";
    await runGenerate(selectedFlow!, flowAnswers, strategy, pt);
  }, [selectedFlow, flowAnswers, recommendation, profile]);

  const handleReset = useCallback(() => {
    setSelectedFlow(null);
    setFlowAnswers({});
    setRecommendation(null);
    setResult(null);
    setError(null);
    setScreen("home");
  }, []);

  if (screen === "loading") return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner />
    </div>
  );

  if (screen === "onboarding") return <OnboardingScreen onComplete={saveProfile} />;
  if (screen === "home") return <HomeScreen profile={profile!} onSelectFlow={handleSelectFlow} onReset={resetProfile} />;

  if (screen === "questions") return (
    <>
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      <QuestionsScreen flow={selectedFlow!} onComplete={handleQuestionsComplete} onBack={handleReset} />
    </>
  );

  if (screen === "strategy" && recommendation) return (
    <>
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      <StrategyScreen recommendation={recommendation} onSelect={handleStrategySelect} onBack={() => setScreen("questions")} />
    </>
  );

  if (screen === "thinking") return <ThinkingScreen />;
  if (screen === "result" && result) return <ResultScreen result={result} onReset={handleReset} />;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: C.muted, fontFamily: "Inter, sans-serif" }}>Something went wrong.</p>
        <button onClick={handleReset} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", cursor: "pointer", fontFamily: "Inter, sans-serif", marginTop: 16 }}>Back to home</button>
      </div>
    </div>
  );
}

// ============================================================
// MOUNT
// ============================================================

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
