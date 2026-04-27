// ============================================================
// COMPLETE REPLACEMENT FILE
// artifacts/suxess-x/components/RefineAndExecutionLoop.tsx
// ============================================================

import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Platform, Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "@/context/UserContext";
import { useCoaching, safeParseResult } from "@/context/CoachingContext";

// ============================================================
// CONSTANTS
// ============================================================

function getAPIBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return "https://d2ed2806-9e05-4352-b2bf-9740ef4876cc-00-3tdolowv9g7xu.picard.replit.dev";
}

// ============================================================
// REFINE MY SITUATION
// ============================================================

export function RefineMySituation({ flowType, originalAnswers, problemType }: { flowType: string; originalAnswers: Record<string, string | string[]>; problemType?: string; }) {
  const [open, setOpen] = useState(false);
  const [update, setUpdate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const { profile } = useUser();
  const { setResult } = useCoaching();

  const starters = [
    { label: "What changed?", starter: "What changed is: " },
    { label: "What did they say?", starter: "They said: " },
    { label: "What did not work?", starter: "What did not work was: " },
    { label: "Go deeper.", starter: "I want to go deeper on: " },
  ];

  const submit = async () => {
    const text = update.trim();
    if (text.length < 5) { setError("Please add more detail."); return; }
    setLoading(true);
    setError(null);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const base = domain ? `https://${domain}` : "https://d2ed2806-9e05-4352-b2bf-9740ef4876cc-00-3tdolowv9g7xu.picard.replit.dev";
      const body = JSON.stringify({
        flowType,
        answers: { ...originalAnswers, refinement: text },
        problemType: problemType ?? "AVOIDING_CHALLENGER",
        strategy: null,
        userProfile: profile ?? null,
      });
      const res = await fetch(`${base}/api/coaching/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const raw = await res.text();
      if (!res.ok) { setError(`Server error ${res.status}. Try again.`); return; }
      const parsed = JSON.parse(raw);
      const safe = safeParseResult(parsed, problemType ?? "AVOIDING_CHALLENGER", null);
      console.log("SAFE RESULT KEYS:", Object.keys(safe));
      console.log("SAFE RESULT SECTIONS:", JSON.stringify(safe.sections));
      console.log("SAFE RESULT PROBLEMTYPE:", safe.problemType);
      try {
        setResult(safe as any);
        console.log("setResult called successfully");
      } catch (e: any) {
        console.error("setResult THREW:", e?.message);
      }
      setOpen(false);
      setUpdate("");
    } catch (e: any) {
      setError("Connection failed. Check your internet and try again.");
      console.error("Refine error:", e?.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{ marginTop: 12, padding: 16, backgroundColor: "rgba(124,58,237,0.1)", borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(124,58,237,0.3)", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
      >
        <View>
          <Text style={{ color: "#9f7aea", fontSize: 15, fontWeight: "700" }}>🔄 Refine my situation</Text>
          <Text style={{ color: "rgba(124,58,237,0.6)", fontSize: 12, marginTop: 2 }}>Something changed? Get adjusted coaching.</Text>
        </View>
        <Text style={{ color: "#9f7aea", fontSize: 22 }}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ marginTop: 12, backgroundColor: "#0a1628", borderRadius: 16, borderWidth: 1.5, borderColor: "rgba(124,58,237,0.3)", padding: 20 }}>
      <Text style={{ color: "#F7F7F2", fontSize: 20, fontWeight: "800", marginBottom: 6 }}>What changed?</Text>
      <Text style={{ color: "rgba(247,247,242,0.5)", fontSize: 13, marginBottom: 16 }}>Tap an option then add detail.</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {starters.map(opt => (
          <TouchableOpacity key={opt.label} onPress={() => { setUpdate(opt.starter); setTimeout(() => inputRef.current?.focus(), 100); }} style={{ backgroundColor: "rgba(124,58,237,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: "rgba(124,58,237,0.3)" }}>
            <Text style={{ color: "#9f7aea", fontSize: 13, fontWeight: "600" }}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        style={{ backgroundColor: "rgba(247,247,242,0.06)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(247,247,242,0.15)", padding: 14, fontSize: 14, color: "#F7F7F2", minHeight: 100, textAlignVertical: "top" }}
        placeholder="e.g. They said no and got defensive. What now?"
        placeholderTextColor="rgba(247,247,242,0.3)"
        value={update}
        onChangeText={t => { setUpdate(t); setError(null); }}
        multiline
      />
      {error ? <Text style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</Text> : null}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <TouchableOpacity onPress={() => { setOpen(false); setUpdate(""); setError(null); }} style={{ flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "rgba(247,247,242,0.15)", alignItems: "center" }}>
          <Text style={{ color: "rgba(247,247,242,0.4)", fontSize: 14 }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={submit} disabled={loading || update.trim().length < 5} style={{ flex: 2, padding: 14, borderRadius: 10, backgroundColor: loading || update.trim().length < 5 ? "rgba(124,58,237,0.3)" : "#7c3aed", alignItems: "center" }}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>Get adjusted coaching</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================
// PREMIUM LOCK CARD — used for locked sections
// ============================================================

interface PremiumLockProps {
  title: string;
  description: string;
}

export function PremiumLockCard({ title, description }: PremiumLockProps) {
  return (
    <TouchableOpacity
      style={pl.wrap}
      onPress={() => Linking.openURL("https://buy.stripe.com/aFa8wReBd99VgpR8HO5kk00")}
      activeOpacity={0.85}
    >
      <View style={pl.top}>
        <View style={pl.iconWrap}>
          <Text style={pl.icon}>🔐</Text>
        </View>
        <View style={pl.textWrap}>
          <Text style={pl.title}>{title}</Text>
          <Text style={pl.desc}>{description}</Text>
        </View>
        <View style={pl.badge}>
          <Text style={pl.badgeText}>Unlock</Text>
        </View>
      </View>
      <View style={pl.bottom}>
        <Text style={pl.bottomLeft}>Premium: $20/month or $6/week</Text>
        <Text style={pl.bottomRight}>Tap to unlock →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================
// EXECUTION LOOP
// ============================================================

export interface ExecutionData {
  sessionId: string;
  flowType: string;
  committed: boolean;
  commitTime: number;
  checkedIn: boolean;
  checkInTime?: number;
  followedThrough?: boolean;
  blockers?: string;
  outcome?: string;
  userGoal?: string;
}

interface ExecutionLoopProps {
  flowType: string;
  behavioralObjective: string;
  sessionId: string;
  userGoal?: string;
  onComplete?: (data: ExecutionData) => void;
}

export function ExecutionLoop({ flowType, behavioralObjective, sessionId, userGoal, onComplete }: ExecutionLoopProps) {
  const [stage, setStage] = useState<"commit" | "committed" | "checkin" | "blocker" | "outcome" | "done">("commit");
  const [blocker, setBlocker] = useState("");
  const [outcome, setOutcome] = useState("");

  const blockerOptions = [
    "I avoided it",
    "Did not have time",
    "Not sure what to say",
    "The moment did not come up",
    "I lost my nerve",
  ];

  const saveData = async (extra: Partial<ExecutionData>) => {
    const data: ExecutionData = {
      sessionId, flowType,
      committed: true, commitTime: Date.now() - 86400000,
      checkedIn: true, checkInTime: Date.now(),
      userGoal, ...extra,
    };
    try {
      const existing = await AsyncStorage.getItem("suxess_executions");
      const arr: ExecutionData[] = existing ? JSON.parse(existing) : [];
      const idx = arr.findIndex(e => e.sessionId === sessionId);
      if (idx >= 0) arr[idx] = data; else arr.unshift(data);
      await AsyncStorage.setItem("suxess_executions", JSON.stringify(arr.slice(0, 100)));
    } catch (e) { console.error("saveData error:", e); }
    onComplete?.(data);
  };

  if (stage === "done") {
    return (
      <View style={el.doneWrap}>
        <Text style={el.doneIcon}>✓</Text>
        <Text style={el.doneText}>Logged. Every pattern you name is one you can change.</Text>
      </View>
    );
  }

  if (stage === "committed") {
    return (
      <View style={el.committedWrap}>
        <Text style={el.committedIcon}>⚡</Text>
        <Text style={el.committedTitle}>Committed.</Text>
        <Text style={el.committedSub}>We will check in with you in 24 hours.</Text>
      </View>
    );
  }

  if (stage === "checkin") {
    return (
      <View style={el.wrap}>
        <Text style={el.headerLabel}>CHECK IN</Text>
        <Text style={el.headerTitle}>Did you follow through?</Text>
        <View style={el.objectiveCard}>
          <Text style={el.objectiveLabel}>YOU COMMITTED TO</Text>
          <Text style={el.objectiveText}>{behavioralObjective}</Text>
        </View>
        <View style={el.checkInBtns}>
          <TouchableOpacity style={el.yesBtn} onPress={() => setStage("outcome")}>
            <Text style={el.yesBtnText}>Yes, I did it</Text>
          </TouchableOpacity>
          <TouchableOpacity style={el.noBtn} onPress={() => setStage("blocker")}>
            <Text style={el.noBtnText}>Not yet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (stage === "blocker") {
    return (
      <View style={el.wrap}>
        <Text style={el.headerLabel}>WHAT GOT IN THE WAY</Text>
        <Text style={el.headerTitle}>Name it honestly.</Text>
        <View style={el.blockerOptions}>
          {blockerOptions.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[el.blockerBtn, blocker === opt && el.blockerBtnSelected]}
              onPress={() => setBlocker(opt)}
            >
              <Text style={[el.blockerText, blocker === opt && el.blockerTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={el.costWrap}>
          <Text style={el.costLabel}>THE CAPTAIN MOVE</Text>
          <Text style={el.costText}>Naming what blocked you is not failure. It is the first step to removing it. The Passenger avoids and explains. The Captain identifies the obstacle and acts on it before tomorrow.</Text>
        </View>
        <TouchableOpacity
          style={[el.commitBtn, !blocker && el.commitBtnDisabled]}
          onPress={async () => { await saveData({ followedThrough: false, blockers: blocker }); setStage("done"); }}
          disabled={!blocker}
        >
          <Text style={el.commitBtnText}>Log this and move forward</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (stage === "outcome") {
    return (
      <View style={el.wrap}>
        <Text style={el.headerLabel}>OUTCOME</Text>
        <Text style={el.headerTitle}>What happened?</Text>
        <Text style={el.headerSub}>One line. What was the result?</Text>
        <TextInput
          style={el.outcomeInput}
          placeholder="They listened. Got pushed back. It landed well. Not sure yet."
          placeholderTextColor="rgba(247,247,242,0.3)"
          value={outcome}
          onChangeText={setOutcome}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[el.commitBtn, !outcome.trim() && el.commitBtnDisabled]}
          onPress={async () => { await saveData({ followedThrough: true, outcome }); setStage("done"); }}
          disabled={!outcome.trim()}
        >
          <Text style={el.commitBtnText}>Log this outcome</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Default: commit stage
  return (
    <View style={el.wrap}>
      <Text style={el.headerLabel}>YOUR MOVE</Text>
      <Text style={el.headerTitle}>Commit before you close this.</Text>
      <View style={el.objectiveCard}>
        <Text style={el.objectiveText}>{behavioralObjective}</Text>
      </View>
      {userGoal && (
        <View style={el.goalRow}>
          <Text style={el.goalLabel}>THIS MOVES YOU TOWARD</Text>
          <Text style={el.goalText}>{userGoal}</Text>
        </View>
      )}
      <View style={el.costWrap}>
        <Text style={el.costLabel}>CAPTAIN VS PASSENGER</Text>
        <Text style={el.costText}>Right now you are in Passenger mode — waiting instead of acting. Every time you delay this specific move, you reinforce the pattern keeping you from your goal. The Captain does not wait to feel ready. They commit. Then act within 5 seconds.</Text>
      </View>
      <TouchableOpacity style={el.commitBtn} onPress={() => setStage("committed")}>
        <Text style={el.commitBtnText}>I commit to this today</Text>
      </TouchableOpacity>
      <TouchableOpacity style={el.skipBtn} onPress={() => setStage("done")}>
        <Text style={el.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================
// SESSION STORAGE
// ============================================================

export interface SessionRecord {
  sessionId: string;
  flowType: string;
  timestamp: number;
  answers: Record<string, string | string[]>;
  problemType: string;
  strategy: string | null;
  userProfile?: Record<string, string | undefined>;
}

export async function saveSession(record: SessionRecord): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem("suxess_sessions");
    const sessions: SessionRecord[] = existing ? JSON.parse(existing) : [];
    const idx = sessions.findIndex(s => s.sessionId === record.sessionId);
    if (idx >= 0) sessions[idx] = record; else sessions.unshift(record);
    await AsyncStorage.setItem("suxess_sessions", JSON.stringify(sessions.slice(0, 50)));
  } catch (e) { console.error("saveSession error:", e); }
}

export async function getSessionHistory(): Promise<SessionRecord[]> {
  try {
    const existing = await AsyncStorage.getItem("suxess_sessions");
    return existing ? JSON.parse(existing) : [];
  } catch { return []; }
}

// ============================================================
// STYLES
// ============================================================

const rs = StyleSheet.create({
  triggerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(124,58,237,0.08)", borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.25)", borderRadius: 14, padding: 16,
    marginTop: 12,
  },
  triggerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  triggerIcon: { fontSize: 22 },
  triggerTitle: { fontSize: 15, fontWeight: "700", color: "#7c3aed", fontFamily: "Inter_700Bold" },
  triggerSub: { fontSize: 12, color: "rgba(124,58,237,0.6)", marginTop: 2, fontFamily: "Inter_400Regular" },
  triggerArrow: { fontSize: 22, color: "#7c3aed", fontWeight: "700" },
  panel: {
    backgroundColor: "#0a1628", borderRadius: 16, borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.3)", padding: 20, marginTop: 12,
  },
  panelTitle: { fontSize: 20, fontWeight: "800", color: "#F7F7F2", marginBottom: 6, fontFamily: "Inter_700Bold" },
  panelSub: { fontSize: 13, color: "rgba(247,247,242,0.5)", marginBottom: 16, fontFamily: "Inter_400Regular" },
  quickBtns: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  quickBtn: {
    backgroundColor: "rgba(124,58,237,0.1)", borderWidth: 1,
    borderColor: "rgba(124,58,237,0.25)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9,
  },
  quickBtnActive: { backgroundColor: "rgba(124,58,237,0.25)", borderColor: "#7c3aed" },
  quickBtnText: { fontSize: 13, color: "#9f7aea", fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  quickBtnTextActive: { color: "#F7F7F2" },
  input: {
    backgroundColor: "rgba(247,247,242,0.06)", borderRadius: 12, borderWidth: 1,
    borderColor: "rgba(247,247,242,0.15)", padding: 14, fontSize: 14,
    color: "#F7F7F2", minHeight: 100, marginBottom: 8, fontFamily: "Inter_400Regular",
  },
  errorText: { fontSize: 13, color: "#f87171", marginBottom: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 10, borderWidth: 1,
    borderColor: "rgba(247,247,242,0.15)", alignItems: "center",
  },
  cancelText: { fontSize: 14, color: "rgba(247,247,242,0.4)", fontFamily: "Inter_600SemiBold" },
  refineBtn: { flex: 2, padding: 14, borderRadius: 10, backgroundColor: "#7c3aed", alignItems: "center" },
  refineBtnDisabled: { backgroundColor: "rgba(124,58,237,0.3)" },
  refineText: { fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
});

const pl = StyleSheet.create({
  wrap: {
    marginTop: 12, borderRadius: 16, borderWidth: 1.5,
    borderColor: "rgba(201,149,42,0.4)", backgroundColor: "rgba(201,149,42,0.06)",
    overflow: "hidden",
  },
  top: { padding: 20, flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "rgba(201,149,42,0.15)", alignItems: "center", justifyContent: "center",
  },
  icon: { fontSize: 24 },
  textWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700", color: "#C9952A", fontFamily: "Inter_700Bold", marginBottom: 3 },
  desc: { fontSize: 13, color: "rgba(247,247,242,0.55)", fontFamily: "Inter_400Regular", lineHeight: 18 },
  badge: {
    backgroundColor: "#C9952A", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  badgeText: { fontSize: 13, fontWeight: "700", color: "#0A1628", fontFamily: "Inter_700Bold" },
  bottom: {
    backgroundColor: "rgba(201,149,42,0.08)", paddingHorizontal: 20, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: "rgba(201,149,42,0.15)",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  bottomLeft: { fontSize: 13, color: "rgba(201,149,42,0.8)", fontFamily: "Inter_500Medium" },
  bottomRight: { fontSize: 13, color: "#C9952A", fontFamily: "Inter_700Bold" },
});

const el = StyleSheet.create({
  wrap: {
    marginTop: 16, backgroundColor: "#0a1628", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(0,212,170,0.2)", padding: 22,
  },
  headerLabel: {
    fontSize: 10, fontWeight: "700", letterSpacing: 1.5,
    color: "#00D4AA", marginBottom: 6, fontFamily: "Inter_700Bold",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#F7F7F2", fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 14, color: "rgba(247,247,242,0.55)", marginTop: 4, fontFamily: "Inter_400Regular" },
  objectiveCard: {
    backgroundColor: "rgba(0,212,170,0.08)", borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(0,212,170,0.2)", padding: 16, marginTop: 14, marginBottom: 14,
  },
  objectiveLabel: {
    fontSize: 9, fontWeight: "700", letterSpacing: 1.5,
    color: "rgba(247,247,242,0.4)", marginBottom: 6, fontFamily: "Inter_700Bold",
  },
  objectiveText: { fontSize: 15, fontWeight: "700", color: "#F7F7F2", lineHeight: 22, fontFamily: "Inter_700Bold" },
  goalRow: {
    backgroundColor: "rgba(245,166,35,0.08)", borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(245,166,35,0.2)", padding: 14, marginBottom: 14,
  },
  goalLabel: {
    fontSize: 9, fontWeight: "700", letterSpacing: 1.5,
    color: "#F5A623", marginBottom: 5, fontFamily: "Inter_700Bold",
  },
  goalText: { fontSize: 13, color: "rgba(247,247,242,0.75)", lineHeight: 20, fontFamily: "Inter_400Regular" },
  costWrap: {
    backgroundColor: "rgba(245,166,35,0.06)", borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(245,166,35,0.15)", padding: 14, marginBottom: 16,
  },
  costLabel: {
    fontSize: 9, fontWeight: "700", letterSpacing: 1.5,
    color: "#F5A623", marginBottom: 6, fontFamily: "Inter_700Bold",
  },
  costText: { fontSize: 13, color: "rgba(247,247,242,0.7)", lineHeight: 20, fontFamily: "Inter_400Regular" },
  commitBtn: {
    backgroundColor: "#00D4AA", borderRadius: 12,
    paddingVertical: 16, alignItems: "center", marginBottom: 10,
  },
  commitBtnDisabled: { backgroundColor: "rgba(0,212,170,0.3)" },
  commitBtnText: { fontSize: 15, fontWeight: "700", color: "#0a1628", fontFamily: "Inter_700Bold" },
  skipBtn: { alignItems: "center", paddingVertical: 8 },
  skipText: { fontSize: 13, color: "rgba(247,247,242,0.25)", fontFamily: "Inter_400Regular" },
  committedWrap: {
    marginTop: 16, backgroundColor: "#0a1628", borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(0,212,170,0.2)", padding: 20, alignItems: "center",
  },
  committedIcon: { fontSize: 28, marginBottom: 8 },
  committedTitle: { fontSize: 22, fontWeight: "800", color: "#00D4AA", fontFamily: "Inter_700Bold" },
  committedSub: { fontSize: 13, color: "rgba(247,247,242,0.45)", marginTop: 4, fontFamily: "Inter_400Regular" },
  checkInBtns: { flexDirection: "row", gap: 12, marginTop: 16 },
  yesBtn: { flex: 1, backgroundColor: "#00D4AA", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  yesBtnText: { fontSize: 15, fontWeight: "700", color: "#0a1628", fontFamily: "Inter_700Bold" },
  noBtn: {
    flex: 1, borderRadius: 12, borderWidth: 1,
    borderColor: "rgba(247,247,242,0.15)", paddingVertical: 16, alignItems: "center",
    backgroundColor: "rgba(247,247,242,0.04)",
  },
  noBtnText: { fontSize: 15, fontWeight: "600", color: "rgba(247,247,242,0.7)", fontFamily: "Inter_600SemiBold" },
  blockerOptions: { marginTop: 12, gap: 8, marginBottom: 16 },
  blockerBtn: {
    backgroundColor: "rgba(247,247,242,0.05)", borderWidth: 1,
    borderColor: "rgba(247,247,242,0.1)", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13,
  },
  blockerBtnSelected: { borderColor: "#F5A623", backgroundColor: "rgba(245,166,35,0.1)" },
  blockerText: { fontSize: 14, color: "rgba(247,247,242,0.6)", fontFamily: "Inter_500Medium" },
  blockerTextSelected: { color: "#F5A623", fontWeight: "700" },
  outcomeInput: {
    backgroundColor: "rgba(247,247,242,0.06)", borderRadius: 10, borderWidth: 1,
    borderColor: "rgba(247,247,242,0.12)", padding: 14, fontSize: 14, color: "#F7F7F2",
    minHeight: 90, marginBottom: 16, marginTop: 12, fontFamily: "Inter_400Regular",
  },
  doneWrap: {
    marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(0,212,170,0.06)", borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(0,212,170,0.15)", padding: 14,
  },
  doneIcon: { fontSize: 18, color: "#00D4AA" },
  doneText: { flex: 1, fontSize: 13, color: "rgba(0,212,170,0.9)", lineHeight: 19, fontFamily: "Inter_400Regular" },
});
