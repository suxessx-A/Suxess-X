// ============================================================
// PASTE THIS FILE AS: artifacts/suxess-x/components/RefineAndExecutionLoop.tsx
// ============================================================

import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Platform,
} from "react-native";
import { useUser } from "@/context/UserContext";

const API_BASE = "https://d2ed2806-9e05-4352-b2bf-9740ef4876cc-00-3tdolowv9g7xu.picard.replit.dev";

// ============================================================
// REFINE MY SITUATION
// ============================================================

interface RefineProps {
  flowType: string;
  originalAnswers: Record<string, string | string[]>;
  onRefined: (newResult: Record<string, unknown>) => void;
  userGoal?: string;
}

export function RefineMySituation({ flowType, originalAnswers, onRefined, userGoal }: RefineProps) {
  const [open, setOpen] = useState(false);
  const [update, setUpdate] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { profile } = useUser();

  const refineOptions = [
    "What changed?",
    "What did they say?",
    "What did not work?",
    "I need to go deeper on this.",
  ];

  const handleRefine = async (prompt?: string) => {
    const text = prompt ?? update.trim();
    if (!text) return;
    setLoading(true);
    try {
      const updatedAnswers = {
        ...originalAnswers,
        refinement: text,
        refinement_context: "User is refining after attempting the action or receiving a response.",
      };
      const res = await fetch(`${API_BASE}/api/coaching/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowType,
          answers: updatedAnswers,
          problemType: "AVOIDING_CHALLENGER",
          strategy: null,
          userProfile: profile,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      onRefined(data);
      setDone(true);
      setOpen(false);
    } catch (e) {
      console.error("Refine error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (done) return null;

  return (
    <View style={rs.wrap}>
      {!open ? (
        <TouchableOpacity style={rs.triggerBtn} onPress={() => setOpen(true)}>
          <Text style={rs.triggerIcon}>🔄</Text>
          <View style={rs.triggerText}>
            <Text style={rs.triggerTitle}>Refine my situation</Text>
            <Text style={rs.triggerSub}>Something changed? Get adjusted coaching.</Text>
          </View>
          <Text style={rs.triggerArrow}>›</Text>
        </TouchableOpacity>
      ) : (
        <View style={rs.panel}>
          <Text style={rs.panelTitle}>What changed?</Text>
          <Text style={rs.panelSub}>Tell me what happened and I will adjust your coaching.</Text>
          <View style={rs.quickBtns}>
            {refineOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={rs.quickBtn}
                onPress={() => handleRefine(opt)}
                disabled={loading}
              >
                <Text style={rs.quickBtnText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={rs.orText}>or describe what happened</Text>
          <TextInput
            style={rs.input}
            placeholder="They said no. They got defensive. I froze. What now?"
            placeholderTextColor="rgba(0,0,0,0.3)"
            value={update}
            onChangeText={setUpdate}
            multiline
            numberOfLines={3}
          />
          <View style={rs.actions}>
            <TouchableOpacity style={rs.cancelBtn} onPress={() => setOpen(false)}>
              <Text style={rs.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[rs.refineBtn, !update.trim() && rs.refineBtnDisabled]}
              onPress={() => handleRefine()}
              disabled={loading || !update.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={rs.refineText}>Get adjusted coaching</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================
// EXECUTION LOOP
// ============================================================

interface ExecutionLoopProps {
  flowType: string;
  behavioralObjective: string;
  sessionId: string;
  userGoal?: string;
  onComplete?: (data: ExecutionData) => void;
}

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

export function ExecutionLoop({ flowType, behavioralObjective, sessionId, userGoal, onComplete }: ExecutionLoopProps) {
  const [committed, setCommitted] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [followedThrough, setFollowedThrough] = useState<boolean | null>(null);
  const [blocker, setBlocker] = useState("");
  const [outcome, setOutcome] = useState("");
  const [done, setDone] = useState(false);

  const blockerOptions = [
    "I avoided it",
    "Did not have time",
    "Not sure what to say",
    "The moment did not come up",
    "I lost my nerve",
  ];

  const handleCommit = () => {
    setCommitted(true);
    const data: ExecutionData = {
      sessionId,
      flowType,
      committed: true,
      commitTime: Date.now(),
      checkedIn: false,
      userGoal,
    };
    saveExecutionData(data);
    scheduleCheckIn();
  };

  const scheduleCheckIn = () => {
    // In production this triggers a push notification at 24hrs
    // For now we show the check-in option immediately for testing
    setTimeout(() => setCheckInOpen(true), Platform.OS === "web" ? 3000 : 86400000);
  };

  const handleCheckIn = (followed: boolean) => {
    setFollowedThrough(followed);
  };

  const handleComplete = () => {
    const data: ExecutionData = {
      sessionId,
      flowType,
      committed: true,
      commitTime: Date.now() - 86400000,
      checkedIn: true,
      checkInTime: Date.now(),
      followedThrough: followedThrough ?? false,
      blockers: blocker,
      outcome,
      userGoal,
    };
    saveExecutionData(data);
    onComplete?.(data);
    setDone(true);
  };

  if (done) {
    return (
      <View style={el.doneWrap}>
        <Text style={el.doneIcon}>✓</Text>
        <Text style={el.doneText}>
          {followedThrough
            ? "Logged. Your patterns are building."
            : "Logged. Knowing what blocked you is the first step to removing it."}
        </Text>
      </View>
    );
  }

  if (!committed) {
    return (
      <View style={el.wrap}>
        <View style={el.header}>
          <Text style={el.headerLabel}>YOUR MOVE</Text>
          <Text style={el.headerTitle}>Commit to this before you close the app.</Text>
        </View>
        <View style={el.objectiveCard}>
          <Text style={el.objectiveText}>{behavioralObjective}</Text>
        </View>
        {userGoal && (
          <View style={el.goalRow}>
            <Text style={el.goalLabel}>YOUR 6-MONTH GOAL</Text>
            <Text style={el.goalText}>{userGoal}</Text>
          </View>
        )}
        <Text style={el.costText}>
          Every moment you delay this costs more than you think. The Captain commits. The Passenger waits.
        </Text>
        <TouchableOpacity style={el.commitBtn} onPress={handleCommit}>
          <Text style={el.commitBtnText}>I commit to this today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={el.skipBtn} onPress={() => setDone(true)}>
          <Text style={el.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (checkInOpen && followedThrough === null) {
    return (
      <View style={el.wrap}>
        <View style={el.header}>
          <Text style={el.headerLabel}>CHECK IN</Text>
          <Text style={el.headerTitle}>Did you follow through?</Text>
        </View>
        <View style={el.objectiveCard}>
          <Text style={el.objectiveLabel}>You committed to:</Text>
          <Text style={el.objectiveText}>{behavioralObjective}</Text>
        </View>
        <View style={el.checkInBtns}>
          <TouchableOpacity style={el.yesBtn} onPress={() => handleCheckIn(true)}>
            <Text style={el.yesBtnText}>Yes, I did it</Text>
          </TouchableOpacity>
          <TouchableOpacity style={el.noBtn} onPress={() => handleCheckIn(false)}>
            <Text style={el.noBtnText}>Not yet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (followedThrough === false) {
    return (
      <View style={el.wrap}>
        <Text style={el.headerTitle}>What got in the way?</Text>
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
          <Text style={el.costLabel}>THE COST OF NOT ACTING</Text>
          <Text style={el.costText}>
            Every time you delay this specific action, you reinforce the pattern that keeps you from where you said you want to be in 6 months.
          </Text>
        </View>
        <TouchableOpacity
          style={[el.commitBtn, !blocker && el.commitBtnDisabled]}
          onPress={handleComplete}
          disabled={!blocker}
        >
          <Text style={el.commitBtnText}>Log this and move forward</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (followedThrough === true) {
    return (
      <View style={el.wrap}>
        <Text style={el.headerTitle}>What happened?</Text>
        <Text style={el.headerSub}>One line. What was the outcome?</Text>
        <TextInput
          style={el.outcomeInput}
          placeholder="They listened. Got pushed back. Landed well. Not sure yet."
          placeholderTextColor="rgba(0,0,0,0.3)"
          value={outcome}
          onChangeText={setOutcome}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={[el.commitBtn, !outcome.trim() && el.commitBtnDisabled]}
          onPress={handleComplete}
          disabled={!outcome.trim()}
        >
          <Text style={el.commitBtnText}>Log this outcome</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (committed && !checkInOpen) {
    return (
      <View style={el.committedWrap}>
        <Text style={el.committedIcon}>⚡</Text>
        <Text style={el.committedTitle}>Committed.</Text>
        <Text style={el.committedSub}>We will check in with you in 24 hours.</Text>
      </View>
    );
  }

  return null;
}

// ============================================================
// DATA COLLECTION FOR PEER PAIRING AND COACH ESCALATION
// ============================================================

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SessionRecord {
  sessionId: string;
  flowType: string;
  timestamp: number;
  answers: Record<string, string | string[]>;
  problemType: string;
  strategy: string | null;
  executionData?: ExecutionData;
  userProfile?: {
    name?: string;
    industry?: string;
    level?: string;
    challenge?: string;
    goal?: string;
    timezone?: string;
  };
}

export async function saveSession(record: SessionRecord): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem("suxess_sessions");
    const sessions: SessionRecord[] = existing ? JSON.parse(existing) : [];
    sessions.unshift(record);
    // Keep last 50 sessions
    const trimmed = sessions.slice(0, 50);
    await AsyncStorage.setItem("suxess_sessions", JSON.stringify(trimmed));
  } catch (e) {
    console.error("saveSession error:", e);
  }
}

export async function saveExecutionData(data: ExecutionData): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem("suxess_executions");
    const executions: ExecutionData[] = existing ? JSON.parse(existing) : [];
    // Update or insert
    const idx = executions.findIndex(e => e.sessionId === data.sessionId);
    if (idx >= 0) executions[idx] = data;
    else executions.unshift(data);
    await AsyncStorage.setItem("suxess_executions", JSON.stringify(executions.slice(0, 100)));
  } catch (e) {
    console.error("saveExecutionData error:", e);
  }
}

export async function getSessionHistory(): Promise<SessionRecord[]> {
  try {
    const existing = await AsyncStorage.getItem("suxess_sessions");
    return existing ? JSON.parse(existing) : [];
  } catch {
    return [];
  }
}

export async function getPeerPairingData(): Promise<{
  flowTypes: string[];
  followThroughRate: number;
  primaryChallenge: string;
  timezone: string;
  sessionsCompleted: number;
}> {
  try {
    const sessions = await getSessionHistory();
    const executions: ExecutionData[] = JSON.parse(
      await AsyncStorage.getItem("suxess_executions") ?? "[]"
    );
    const flowTypes = [...new Set(sessions.map(s => s.flowType))];
    const completed = executions.filter(e => e.followedThrough === true).length;
    const total = executions.filter(e => e.checkedIn).length;
    const followThroughRate = total > 0 ? completed / total : 0;
    const profile = sessions[0]?.userProfile;
    return {
      flowTypes,
      followThroughRate,
      primaryChallenge: profile?.challenge ?? "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      sessionsCompleted: sessions.length,
    };
  } catch {
    return { flowTypes: [], followThroughRate: 0, primaryChallenge: "", timezone: "", sessionsCompleted: 0 };
  }
}

// ============================================================
// STYLES
// ============================================================

const rs = StyleSheet.create({
  wrap: { marginTop: 16, marginHorizontal: 16, marginBottom: 8 },
  triggerBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(124,58,237,0.06)", borderWidth: 1, borderColor: "rgba(124,58,237,0.15)", borderRadius: 12, padding: 16, gap: 12 },
  triggerIcon: { fontSize: 20 },
  triggerText: { flex: 1 },
  triggerTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a2e", fontFamily: "Inter_700Bold" },
  triggerSub: { fontSize: 12, color: "rgba(0,0,0,0.45)", marginTop: 2, fontFamily: "Inter_400Regular" },
  triggerArrow: { fontSize: 20, color: "#7c3aed", fontWeight: "700" },
  panel: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "rgba(124,58,237,0.2)", padding: 20 },
  panelTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a2e", marginBottom: 6, fontFamily: "Inter_700Bold" },
  panelSub: { fontSize: 14, color: "rgba(0,0,0,0.5)", marginBottom: 16, fontFamily: "Inter_400Regular" },
  quickBtns: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  quickBtn: { backgroundColor: "rgba(124,58,237,0.08)", borderWidth: 1, borderColor: "rgba(124,58,237,0.2)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  quickBtnText: { fontSize: 13, color: "#7c3aed", fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  orText: { fontSize: 12, color: "rgba(0,0,0,0.35)", marginBottom: 10, fontFamily: "Inter_400Regular" },
  input: { backgroundColor: "rgba(0,0,0,0.04)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.1)", padding: 14, fontSize: 14, color: "#1a1a2e", minHeight: 90, textAlignVertical: "top", fontFamily: "Inter_400Regular", marginBottom: 14 },
  actions: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.1)", alignItems: "center" },
  cancelText: { fontSize: 14, color: "rgba(0,0,0,0.4)", fontFamily: "Inter_600SemiBold" },
  refineBtn: { flex: 2, padding: 14, borderRadius: 10, backgroundColor: "#7c3aed", alignItems: "center" },
  refineBtnDisabled: { backgroundColor: "rgba(124,58,237,0.3)" },
  refineText: { fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
});

const el = StyleSheet.create({
  wrap: { marginTop: 20, marginHorizontal: 16, backgroundColor: "#0a1628", borderRadius: 16, padding: 22, marginBottom: 12 },
  header: { marginBottom: 16 },
  headerLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: "#00D4AA", marginBottom: 6, fontFamily: "Inter_700Bold" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#F7F7F2", fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 14, color: "rgba(247,247,242,0.55)", marginTop: 4, fontFamily: "Inter_400Regular" },
  objectiveCard: { backgroundColor: "rgba(0,212,170,0.08)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(0,212,170,0.2)", padding: 16, marginBottom: 14 },
  objectiveLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: "rgba(247,247,242,0.4)", marginBottom: 6, fontFamily: "Inter_700Bold" },
  objectiveText: { fontSize: 15, fontWeight: "700", color: "#F7F7F2", lineHeight: 22, fontFamily: "Inter_700Bold" },
  goalRow: { backgroundColor: "rgba(245,166,35,0.08)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(245,166,35,0.2)", padding: 14, marginBottom: 14 },
  goalLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 1.5, color: "#F5A623", marginBottom: 5, fontFamily: "Inter_700Bold" },
  goalText: { fontSize: 13, color: "rgba(247,247,242,0.75)", lineHeight: 20, fontFamily: "Inter_400Regular" },
  costWrap: { backgroundColor: "rgba(245,166,35,0.06)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(245,166,35,0.15)", padding: 14, marginBottom: 16 },
  costLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 1.5, color: "#F5A623", marginBottom: 6, fontFamily: "Inter_700Bold" },
  costText: { fontSize: 13, color: "rgba(247,247,242,0.6)", lineHeight: 20, fontFamily: "Inter_400Regular", marginBottom: 0 },
  commitBtn: { backgroundColor: "#00D4AA", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginBottom: 10 },
  commitBtnDisabled: { backgroundColor: "rgba(0,212,170,0.3)" },
  commitBtnText: { fontSize: 15, fontWeight: "700", color: "#0a1628", fontFamily: "Inter_700Bold" },
  skipBtn: { alignItems: "center", paddingVertical: 8 },
  skipText: { fontSize: 13, color: "rgba(247,247,242,0.3)", fontFamily: "Inter_400Regular" },
  committedWrap: { marginTop: 16, marginHorizontal: 16, backgroundColor: "#0a1628", borderRadius: 14, padding: 20, alignItems: "center", marginBottom: 12 },
  committedIcon: { fontSize: 28, marginBottom: 8 },
  committedTitle: { fontSize: 20, fontWeight: "800", color: "#00D4AA", fontFamily: "Inter_700Bold" },
  committedSub: { fontSize: 13, color: "rgba(247,247,242,0.45)", marginTop: 4, fontFamily: "Inter_400Regular" },
  checkInBtns: { flexDirection: "row", gap: 12, marginTop: 16 },
  yesBtn: { flex: 1, backgroundColor: "#00D4AA", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  yesBtnText: { fontSize: 15, fontWeight: "700", color: "#0a1628", fontFamily: "Inter_700Bold" },
  noBtn: { flex: 1, backgroundColor: "rgba(247,247,242,0.06)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(247,247,242,0.15)", paddingVertical: 16, alignItems: "center" },
  noBtnText: { fontSize: 15, fontWeight: "600", color: "rgba(247,247,242,0.7)", fontFamily: "Inter_600SemiBold" },
  blockerOptions: { marginTop: 12, gap: 8, marginBottom: 16 },
  blockerBtn: { backgroundColor: "rgba(247,247,242,0.05)", borderWidth: 1, borderColor: "rgba(247,247,242,0.1)", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13 },
  blockerBtnSelected: { borderColor: "#F5A623", backgroundColor: "rgba(245,166,35,0.1)" },
  blockerText: { fontSize: 14, color: "rgba(247,247,242,0.6)", fontFamily: "Inter_500Medium" },
  blockerTextSelected: { color: "#F5A623", fontWeight: "700" },
  outcomeInput: { backgroundColor: "rgba(247,247,242,0.06)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(247,247,242,0.12)", padding: 14, fontSize: 14, color: "#F7F7F2", minHeight: 90, textAlignVertical: "top", fontFamily: "Inter_400Regular", marginBottom: 16, marginTop: 12 },
  doneWrap: { marginTop: 12, marginHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(0,212,170,0.06)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(0,212,170,0.15)", padding: 14, marginBottom: 8 },
  doneIcon: { fontSize: 18, color: "#00D4AA" },
  doneText: { flex: 1, fontSize: 13, color: "rgba(0,212,170,0.9)", lineHeight: 19, fontFamily: "Inter_400Regular" },
});
