import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser, UserProfile } from "@/context/UserContext";

const INDUSTRIES = [
  "Mining and Resources",
  "Heavy Industry and Infrastructure",
  "Corporate and Executive",
  "STEM and Technical",
  "Other",
];

const LEVELS = [
  "Senior Leader or Executive",
  "Manager or Team Lead",
  "Senior Professional",
  "Professional",
];

const CHALLENGES = [
  "Getting recognised for my work",
  "Navigating difficult people or relationships",
  "Moving into a bigger or more senior role",
  "Asking for what I deserve — pay, promotion, scope",
  "Managing my confidence under pressure",
];

interface StepProps {
  onNext: (value: string) => void;
  onBack?: () => void;
}

function Step1Name({ onNext }: StepProps) {
  const [name, setName] = useState("");
  return (
    <View style={s.stepWrap}>
      <Text style={s.stepLabel}>Let's start</Text>
      <Text style={s.stepTitle}>What should I call you?</Text>
      <TextInput
        style={s.textInput}
        placeholder="Your first name"
        placeholderTextColor="rgba(255,255,255,0.3)"
        value={name}
        onChangeText={setName}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => name.trim() && onNext(name.trim())}
      />
      <TouchableOpacity
        style={[s.nextBtn, !name.trim() && s.nextBtnDisabled]}
        onPress={() => name.trim() && onNext(name.trim())}
        disabled={!name.trim()}
      >
        <Text style={s.nextBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

function Step2Industry({ onNext, onBack }: StepProps) {
  const [selected, setSelected] = useState("");
  return (
    <View style={s.stepWrap}>
      <Text style={s.stepLabel}>Step 2 of 5</Text>
      <Text style={s.stepTitle}>What is your industry?</Text>
      {INDUSTRIES.map((item) => (
        <TouchableOpacity
          key={item}
          style={[s.optionBtn, selected === item && s.optionBtnSelected]}
          onPress={() => setSelected(item)}
        >
          <Text style={[s.optionText, selected === item && s.optionTextSelected]}>{item}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[s.nextBtn, !selected && s.nextBtnDisabled]}
        onPress={() => selected && onNext(selected)}
        disabled={!selected}
      >
        <Text style={s.nextBtnText}>Continue</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.backBtn} onPress={onBack}>
        <Text style={s.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

function Step3Level({ onNext, onBack }: StepProps) {
  const [selected, setSelected] = useState("");
  return (
    <View style={s.stepWrap}>
      <Text style={s.stepLabel}>Step 3 of 5</Text>
      <Text style={s.stepTitle}>What is your level?</Text>
      {LEVELS.map((item) => (
        <TouchableOpacity
          key={item}
          style={[s.optionBtn, selected === item && s.optionBtnSelected]}
          onPress={() => setSelected(item)}
        >
          <Text style={[s.optionText, selected === item && s.optionTextSelected]}>{item}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[s.nextBtn, !selected && s.nextBtnDisabled]}
        onPress={() => selected && onNext(selected)}
        disabled={!selected}
      >
        <Text style={s.nextBtnText}>Continue</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.backBtn} onPress={onBack}>
        <Text style={s.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

function Step4Challenge({ onNext, onBack }: StepProps) {
  const [selected, setSelected] = useState("");
  return (
    <View style={s.stepWrap}>
      <Text style={s.stepLabel}>Step 4 of 5</Text>
      <Text style={s.stepTitle}>What is your biggest challenge right now?</Text>
      {CHALLENGES.map((item) => (
        <TouchableOpacity
          key={item}
          style={[s.optionBtn, selected === item && s.optionBtnSelected]}
          onPress={() => setSelected(item)}
        >
          <Text style={[s.optionText, selected === item && s.optionTextSelected]}>{item}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[s.nextBtn, !selected && s.nextBtnDisabled]}
        onPress={() => selected && onNext(selected)}
        disabled={!selected}
      >
        <Text style={s.nextBtnText}>Continue</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.backBtn} onPress={onBack}>
        <Text style={s.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

function Step5Goal({ onNext, onBack }: StepProps) {
  const [goal, setGoal] = useState("");
  return (
    <View style={s.stepWrap}>
      <Text style={s.stepLabel}>Step 5 of 5</Text>
      <Text style={s.stepTitle}>What does success look like for you in the next 6 months?</Text>
      <Text style={s.stepSub}>Be specific — this shapes everything that follows.</Text>
      <TextInput
        style={[s.textInput, s.textInputMulti]}
        placeholder="e.g. I want to be seen as a strategic leader and have the salary conversation I have been avoiding"
        placeholderTextColor="rgba(255,255,255,0.3)"
        value={goal}
        onChangeText={setGoal}
        multiline
        numberOfLines={4}
      />
      <TouchableOpacity
        style={[s.nextBtn, !goal.trim() && s.nextBtnDisabled]}
        onPress={() => goal.trim() && onNext(goal.trim())}
        disabled={!goal.trim()}
      >
        <Text style={s.nextBtnText}>Start my coaching</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.backBtn} onPress={onBack}>
        <Text style={s.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { saveProfile } = useUser();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<UserProfile>>({});

  const topInset = Platform.OS === "web" ? 0 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleNext = (key: keyof UserProfile, value: string) => {
    const updated = { ...data, [key]: value };
    setData(updated);
    if (step < 5) {
      setStep(step + 1);
    } else {
      saveProfile(updated as UserProfile);
    }
  };

  const progress = (step / 5) * 100;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[s.container, { paddingTop: topInset }]}
        contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <Text style={s.brand}>SUXESS X</Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {step === 1 && <Step1Name onNext={(v) => handleNext("name", v)} />}
        {step === 2 && <Step2Industry onNext={(v) => handleNext("industry", v)} onBack={() => setStep(1)} />}
        {step === 3 && <Step3Level onNext={(v) => handleNext("level", v)} onBack={() => setStep(2)} />}
        {step === 4 && <Step4Challenge onNext={(v) => handleNext("challenge", v)} onBack={() => setStep(3)} />}
        {step === 5 && <Step5Goal onNext={(v) => handleNext("goal", v)} onBack={() => setStep(4)} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a14" },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  brand: { fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 16, fontFamily: "Inter_600SemiBold" },
  progressBar: { height: 3, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: "#7c3aed", borderRadius: 2 },
  stepWrap: { paddingHorizontal: 24, paddingTop: 32 },
  stepLabel: { fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#7c3aed", marginBottom: 10, fontFamily: "Inter_600SemiBold" },
  stepTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff", lineHeight: 32, marginBottom: 8 },
  stepSub: { fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 22, marginBottom: 20, fontFamily: "Inter_400Regular" },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: "#fff", fontFamily: "Inter_400Regular",
    marginBottom: 20, marginTop: 12,
  },
  textInputMulti: { height: 120, textAlignVertical: "top" },
  optionBtn: {
    backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 18, paddingVertical: 16, marginBottom: 10,
  },
  optionBtnSelected: { borderColor: "#7c3aed", backgroundColor: "rgba(124,58,237,0.12)" },
  optionText: { fontSize: 15, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_500Medium" },
  optionTextSelected: { color: "#fff", fontFamily: "Inter_600SemiBold" },
  nextBtn: {
    backgroundColor: "#7c3aed", borderRadius: 12,
    paddingVertical: 17, alignItems: "center", marginTop: 8, marginBottom: 12,
  },
  nextBtnDisabled: { backgroundColor: "rgba(124,58,237,0.3)" },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  backBtn: { alignItems: "center", paddingVertical: 10 },
  backBtnText: { fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "Inter_500Medium" },
});
