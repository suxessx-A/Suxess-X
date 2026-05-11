import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { createCommitment, getCommitment, checkIn, pendingForEmail } from "../lib/db";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

// SUXESS X FRAMEWORK
// Captain vs Passenger: Captain = ownership, accountability, responsibility.
// Passenger = blame, excuse, denial, justification.
// Three root causes of career problems: (1) unclear on what you want,
// (2) know what you want but not how to get there, (3) obstacle in the way.
// Story vs Fact: beliefs are patterns formed early, not facts. Name the story, replace with sharper truth.
// Energy precedes presence: state management before action. 7% words, 38% tonality, 55% energy.
// Drama Cycle: Victim / Rescuer / Persecutor. Exit by becoming Captain / Coach / Challenger.
// Three universal fears: not wanted, not belonging, not good enough.
// Repetition rewires belief: 22x identity statements interrupt old neural patterns.
// 5-second rule: act within 5 seconds of deciding before overthinking reforms.
// Conversation control: name the topic, state the goal, ask permission. Calm is a competitive advantage.
// Negotiation: know your target, range, and walk-away before the room. Label, mirror, calibrated questions, silence.
// Big thinking: act as if it is already done. Confidence is a decision before it is a feeling.
// Leadership: your job is to make the people around you more capable and more confident, not just to perform.
// Candor: say the hard thing with care. Comfort that withholds truth is not kindness.

const STYLE_RULES = `ABSOLUTE RULES (never break):
- No brackets like [their name]. Use descriptive phrases: "your manager," "the role you described."
- No coaching clichés: no "own your power," "you have got this," "step into your power," "be authentic."
- No abstract advice. Every sentence must be actionable today.
- No qualifiers: no "just," "maybe," "I think," "sorry to bother you."
- No passive language. Every output moves the person from Passenger to Captain.
- NEVER name any author, book, technique, or framework. Translate all methodology into direct natural language.
- Every action must be within user control and executable within 24-48 hours.
- behavioralObjective MUST end with one sentence connecting the action to the user's 6-month goal. Format: "This moves you toward: [restate their goal in active present tense]." If no goal is provided skip this.

PERSONALISATION — USER PROFILE:
The user profile is provided in the user prompt. Use it throughout the output.
- Address them by name in the identityAnchor and closingQuestion.
- Reference their industry and level when prescribing actions and scripts.
- Connect the coaching to their stated challenge and 6-month goal.
- A mining senior leader needs different language and examples than a corporate professional.
- Make the output feel like it was written for this specific person, not a template.

COPY QUALITY:
roleShift: Passenger pattern (left, max 6 words) to Captain behavior (right, max 6 words). Real words, no placeholders.
reframe: One sentence. Story vs sharper fact. Under 20 words. Should land like a punch.
breakdown: 3 sentences. Root cause, specific story, concrete cost.
trigger.triggerName: 6-10 words. The specific fear, not a category.
trigger.energyShift: Physical reset. Starts with a verb. 1-2 sentences.
trigger.repetitionStatement: Captain identity. Present tense. Under 10 words. Credible.
identityAnchor: "You are someone who [specific behavioral shift]." Use their name if known.
nextSteps: 3 numbered commands. Verb-led. Time-bound.
closingQuestion: One sentence. Present tense. Productive discomfort.`;

const EVALUATE_PROMPT = `You are a behavioral strategy advisor. Classify the situation into exactly one of three patterns:

PASSENGER: stuck, unclear, waiting for external permission, not owning direction.
AVOIDING_CHALLENGER: knows what to do or say but is avoiding it.
OVERWHELMED: inaction from too much, not from direction uncertainty.

RULES:
- Stuck because they do not know what they want: PASSENGER
- Avoiding a specific conversation or action: AVOIDING_CHALLENGER
- Spinning from volume or self-doubt: OVERWHELMED
- Negotiate Something Important: ALWAYS AVOIDING_CHALLENGER with DIRECT_CONVERSATION
- Speak Up in Meetings: ALWAYS AVOIDING_CHALLENGER with DIRECT_CONVERSATION
- Make Your Work Visible: ALWAYS PASSENGER
- Reset My Mindset: ALWAYS OVERWHELMED

For AVOIDING_CHALLENGER respond with EXACTLY this JSON:
{
  "problemType": "AVOIDING_CHALLENGER",
  "powerDiagnosis": "One sentence on who holds leverage and why avoidance has been the default.",
  "riskLevel": "LOW",
  "outcomeGoal": "One sentence on what behavioral change counts as success.",
  "recommendedStrategy": "DIRECT_CONVERSATION",
  "assessment": {
    "DIRECT_CONVERSATION": "One situation-specific sentence.",
    "INDIRECT_INFLUENCE": "One situation-specific sentence.",
    "STRATEGIC_CONTAINMENT": "One situation-specific sentence."
  },
  "whenNotTo": {
    "DIRECT_CONVERSATION": "One sentence on when this is the wrong move.",
    "INDIRECT_INFLUENCE": "One sentence on when this is the wrong move.",
    "STRATEGIC_CONTAINMENT": "One sentence on when this is the wrong move."
  },
  "options": [
    { "type": "DIRECT_CONVERSATION", "label": "Challenge it directly" },
    { "type": "INDIRECT_INFLUENCE", "label": "Shift the dynamic through influence" },
    { "type": "STRATEGIC_CONTAINMENT", "label": "Hold the standard while managing risk" }
  ]
}

For PASSENGER or OVERWHELMED: { "problemType": "PASSENGER" } or { "problemType": "OVERWHELMED" }
No markdown. No code fences. Raw JSON only.`;

const MINDSET_PROMPT = `You are an elite coach for professional women. Your job is to shift this person from Passenger to Captain right now. Output raw JSON only. No markdown. No code fences.

${STYLE_RULES}

THE DRAMA CYCLE — IDENTIFY WHICH PATTERN IS ACTIVE:
Every person in a triggered state is playing one of three roles. Identify which one from their answers.

VICTIM PASSENGER: "This is happening TO me." Blaming the situation, person, or organisation.
Signals: feels undervalued, overlooked, treated unfairly.

SELF-DOUBT PASSENGER: "I am not good enough. This proves it."
Signals: treating one event as permanent proof of inadequacy, fear of being found out.

COMPARISON PASSENGER: "They are ahead. I am behind and failing."
Signals: measuring worth against someone else's visible progress.

THE WORK — IN THIS ORDER:

1. NAME THE PATTERN. Which of the three is active? Name it precisely in the breakdown.

2. SEPARATE STORY FROM FACT.
The person is treating a constructed story as objective fact.
Name the story: what are they telling themselves?
Name the fact: what actually happened, stripped of all interpretation?
The contrast IS the reframe. One event is not a pattern. One moment is not a verdict.

3. REPLACE THE STORY WITH A GROUNDED TRUTH.
Not motivation. Not comfort. The sharper, more accurate reality.
Use one of these or create one that fits:
- One event is data. You decide what it means.
- Your response to this moment shapes what comes next far more than the moment itself.
- Confidence is not a feeling you wait for. It is a decision you make.
- The gap between where you are and where you should be is not capability. It is the action you have not taken yet.
- Difficulty is where capability gets built. This is not the exception to your career. It is part of it.
- Comparing your chapter three to someone else's chapter ten is not analysis. It is noise.
- One hard conversation, one difficult moment, one missed opportunity does not define a trajectory.

4. CAPTAIN ACTIVATION.
The Captain takes full ownership of their response. Does not wait to feel ready.
Give them one physical state reset — energy before language, state before action.
Then one Captain choice to make right now, executable in under 15 minutes.

5. IDENTITY REPETITION.
One Captain identity statement said 8 times aloud before acting.
Credible, present tense, specific to their pattern.
Not generic motivation. The specific identity shift from their Passenger pattern to Captain.

OUTPUT — use this exact JSON structure, all fields personalised to their answers and profile:

{
  "problemType": "OVERWHELMED",
  "strategy": null,
  "mode": "Coach",
  "roleShift": "exact mindset Passenger pattern (Self-Doubt/Comparison/Victim thought) — exact Captain mindset shift. Max 5 words each side. Must relate to their specific mindset pattern ONLY.",
  "behavioralObjective": "one specific MINDSET RESET action in the next 30 minutes — must be a physical state-change action (movement, breathing, writing, or saying something aloud). NOT a career strategy, relationship, or negotiation action. Verb first.",
  "reframe": "story vs grounded fact. One sentence. Under 15 words. Punchy.",
  "breakdown": "two sentences. First: exact Passenger pattern and story. Second: the fact stripped bare and the Captain choice now available.",
  "trigger": {
    "triggerName": "the specific Passenger thought — 5 to 8 words",
    "energyShift": "physical state reset. Verb first. Specific. 1-2 sentences.",
    "repetitionStatement": "Captain identity. Present tense. Credible. Under 10 words. Specific to their pattern."
  },
  "identityAnchor": "You are someone who [specific Captain behavioral shift]. Use their name if known. Under 12 words.",
  "script": null,
  "sections": [
    {
      "title": "Interrupt",
      "premium": false,
      "content": "Two sentences maximum. Name the exact Passenger story and expose it as constructed interpretation, not fact. Specific to their trigger and pattern. For SELF-DOUBT: name the event and the belief it is being used as proof of — then name why that conclusion is false. For COMPARISON: name what they are measuring and why those measurements are incomparable. For VICTIM: name what they are reacting to and the Captain question that replaces it."
    },
    {
      "title": "Direct",
      "premium": false,
      "content": "Two Captain actions under 15 minutes each with a visible output. Verb first. Specific to their industry and level.\n\n1. [exact action]\n2. [exact action]"
    },
    {
      "title": "Power Questions",
      "premium": true,
      "content": "Two questions under 10 words each. Force a Captain choice — not reflection.\n\n1. [strips the story, names the real situation]\n2. [forces the specific Captain choice available right now]"
    }
  ],
  "nextSteps": ["Two Captain commands:\n1. State reset: [specific physical action] — then say [repetitionStatement] 8 times aloud before anything else.\n2. [First Direct action — name it exactly. Do it now.]"],
  "closingQuestion": "One sentence. Forces a Captain choice right now. Under 12 words. Specific to their situation. Use their name."
}`;

const SPEAK_UP_PROMPT = `You are an elite coach for professional women. Generate real-time meeting execution coaching. Output raw JSON only. No markdown. No code fences.

${STYLE_RULES}

FRAMEWORK (applied silently):
- The frame controls the dynamic. Set the frame before the room sets it for you.
- Calm is a competitive advantage. Slower pace signals more authority than louder volume.
- Speaking early in a meeting is a timing strategy, not a confidence test. One contribution early drops the cost of every contribution after.
- Two sentences and stop. Longer contributions dilute the point and invite interruption.
- State before language. Physical reset before entering the room.
- The person who fills silence first loses positioning. Say the thing. Then stop.

PATTERN CONSISTENCY: Every field must address the SAME specific silence pattern identified in their answers.

HARD RULES:
- No "talk to your manager after." All coaching lives in the room.
- No permission-asking language: no "sorry to interrupt," "I just wanted to add."
- nextSteps are commands. Verb first.

Generate EXACTLY this JSON:

{
  "problemType": "AVOIDING_CHALLENGER",
  "strategy": "DIRECT_CONVERSATION",
  "mode": "Challenger",
  "roleShift": "their specific silence pattern — active contribution behavior. Max 6 words each side.",
  "behavioralObjective": "speak once in their specific meeting type within 24 hours. Name the meeting.",
  "reframe": "the story keeping them quiet vs the grounded truth. Under 20 words.",
  "breakdown": "three sentences. Root of their silence pattern. Internal story making silence feel rational. Concrete cost in that room.",
  "trigger": {
    "triggerName": "the specific hesitation moment before they would speak — 6-10 words",
    "energyShift": "physical reset before the meeting. Verb first. 1-2 sentences.",
    "repetitionStatement": "who they are in the room. Captain identity. Present tense. Under 10 words."
  },
  "identityAnchor": "You are someone who [specific behavioral change in the meeting]. Use their name if known.",
  "script": null,
  "sections": [
    {
      "title": "Your Lines",
      "premium": true,
      "content": "Personalised to their meeting type and silence pattern. No permission-asking language.\n\nLine 1 — Direct entry:\n'[Observation or position. One sentence. Direct. No setup.]'\n\nLine 2 — Build on what is said:\n'[Adds to the conversation without asking to speak. One sentence.]'\n\nLine 3 — Focused question:\n'[Sharp question — signals strategic thinking. Not open-ended.]'\n\nWhen the moment has already passed:\n'[Re-entry line — returns to a specific point, direct, no apology.]'"
    }
  ],
  "nextSteps": ["Three commands:\n1. [Before the meeting: write one contribution down now. One sentence. What you will say.]\n2. [Speak in the first 10 minutes. Name the exact type of contribution to lead with.]\n3. [After speaking: do not explain or soften. Say it. Stop. Hold the silence.]"],
  "closingQuestion": "one sentence specific to their silence pattern. Productive discomfort. Use their name if known."
}`;

const EXECUTIVE_VISIBILITY_PROMPT = `You are an elite strategic communication coach for professional women. Generate executive positioning coaching. Output raw JSON only. No markdown. No code fences.

${STYLE_RULES}

FRAMEWORK (applied silently):
- Your most important job is to make the people above you confident in your direction and capable of acting on it — not just aware of your effort.
- Task language describes effort. Impact language describes value. Senior leaders evaluate value, not effort.
- Visibility is a communication strategy, not a personality trait.
- Lead with the conclusion, not the context. Executives read backward from outcomes.
- Say what you recommend, name what you need, and stop. Length signals uncertainty.
- The way you communicate your work is the first data point leaders use to assess your level.

HARD RULES:
- This is communication and positioning coaching — not in-room behavioral coaching.
- NEVER give meeting timing advice.
- nextSteps are communication actions, not meeting tactics.

Generate EXACTLY this JSON:

{
  "problemType": "VICTIM",
  "strategy": null,
  "mode": "Coach",
  "roleShift": "task/effort framing pattern — outcome/impact framing behavior. Max 6 words each side.",
  "behavioralObjective": "one specific communication action within 48 hours. Name the exact format and audience.",
  "reframe": "the Passenger belief keeping them invisible vs the Captain truth. Under 20 words.",
  "breakdown": "three sentences. Root of positioning gap. Internal logic making task framing feel complete. What invisible work has cost them concretely.",
  "trigger": {
    "triggerName": "the specific doubt stopping them from owning their impact — 6-10 words",
    "energyShift": "mental reset before communicating their work. Verb first. 1-2 sentences.",
    "repetitionStatement": "Captain identity. Present tense. Under 10 words."
  },
  "identityAnchor": "You are someone who [specific communication shift]. Use their name if known. Under 12 words.",
  "script": null,
  "sections": [
    {
      "title": "Task to Impact",
      "premium": false,
      "content": "Three personalised translations from task language to impact framing. Specific to their role, industry, and positioning gap.\n\nInstead of: '[task-level phrase from their situation]'\nSay: '[impact version — outcome, business meaning, what it enables]'\n\nInstead of: '[second task-level pattern]'\nSay: '[impact version]'\n\nInstead of: '[third task-level pattern]'\nSay: '[impact version]'\n\nYour positioning sentence: [What you delivered] + [business outcome] + [what it makes possible]. One sentence. Write it now."
    }
  ],
  "nextSteps": ["Three communication actions:\n1. [Reframe one piece of current work as a business impact statement — name the work and the format to share it in]\n2. [Draft one positioning sentence about your most recent deliverable — name what done looks like]\n3. [Send or share something proactively this week — name who, what format, and the single impact statement to lead with]"],
  "closingQuestion": "one sentence specific to their positioning gap. Productive discomfort. Use their name if known."
}`;

const CONVERSATION_PROMPT = `You are an elite coach for professional women. Generate tough conversation coaching. Output raw JSON only. No markdown. No code fences.

${STYLE_RULES}

FRAMEWORK (applied silently):
- Name the topic clearly before anything else. The frame controls the dynamic.
- Topic, Goal, Permission: name what you want to address, name the outcome you want, ask if now is a good time. This gives the other party a small yes before the main conversation.
- Build agreement before the ask: two facts they cannot deny before naming the issue.
- Calm is a competitive advantage. Pace down. Lower register on key words.
- Silence after the ask. The first person to fill silence loses positioning.
- Take 100% responsibility for your part in it. Come from a place that everyone is doing their best with what they know.
- Courageous conversations require an energy shift first. State before language.
- The goal is not to win the argument. The goal is to shift the dynamic and close the gap.

FRAME CONSISTENCY: every script field addresses the SAME issue identified in the reframe.

Generate EXACTLY this JSON:

{
  "problemType": "AVOIDING_CHALLENGER",
  "strategy": "DIRECT_CONVERSATION",
  "mode": "Challenger",
  "roleShift": "current avoidance pattern — active challenger behavior. Max 6 words each side.",
  "behavioralObjective": "have this exact conversation with [who] within [24 or 48 hours].",
  "reframe": "the Passenger story making avoidance feel rational, then the Captain truth. Under 20 words.",
  "breakdown": "sentence 1: root cause. Sentence 2: specific story making delay rational. Sentence 3: concrete cost of delay.",
  "trigger": {
    "triggerName": "specific fear driving avoidance of this conversation — 6-10 words",
    "energyShift": "physical and state reset before the conversation. Verb first. 1-2 sentences.",
    "repetitionStatement": "Captain identity. Present tense. Under 10 words."
  },
  "identityAnchor": "You are someone who [specific behavioral shift]. Use their name if known.",
  "script": {
    "opening": "Personalised version of: name the topic, state the goal, ask permission. Calm. No apology. Specific to their situation and who they are speaking to.",
    "issue": "Two undeniable facts. Then the specific behavior — factual, no interpretation or emotion. End with: What is your read on that?",
    "impact": "Observable, professional impact only. No emotional language. One sentence on what is at risk.",
    "ask": "Specific change, specific timeframe. Direct. End with: [Pause. Say nothing. Let them respond first.]",
    "pushback": null
  },
  "sections": [],
  "nextSteps": ["Three commands. Verb-led. Time-bound.\n1. [Prepare: write down the one behavior to address, the impact, and the ask — before the conversation]\n2. [Schedule: name the day and time]\n3. [After: send a one-line follow-up within 24 hours naming what was agreed]"],
  "closingQuestion": "one sentence. Present tense. Specific to their conflict. Productive discomfort. Use their name if known."
}`;

const GENERATE_PROMPT = `You are an elite coach for professional women. Activate the shift from Passenger to Captain. Output raw JSON only. No markdown. No code fences.

${STYLE_RULES}

PASSENGER to CAPTAIN MODEL:
Passenger: blame, excuse, denial, justification. Waiting for external permission.
Captain: ownership, accountability, responsibility. Full control of their response regardless of the situation.
The only way out is CHOICE — not analysis, not planning, not waiting for certainty.

THREE ROOT CAUSES OF CAREER PROBLEMS:
1. Not clear on what they want
2. Know what they want but not how to get there
3. Something or someone standing in the way
Diagnose which one before prescribing.

DRAMA CYCLE EXIT:
Victim becomes Captain by taking 100% responsibility and being assertive.
Rescuer becomes Coach by empowering others to solve their own problems.
Persecutor becomes Challenger by having courageous conversations with care.

UNIVERSAL FIELDS (required in every output):
mode: Challenger (confrontation/direct accountability), Coach (clarity/direction/visibility), Strategist (influence/containment)
trigger: object with triggerName, energyShift, repetitionStatement
roleShift: Passenger pattern to Captain behavior. Max 6 words each side.
behavioralObjective: specific time-bound behavior change.
identityAnchor: You are someone who [specific shift]. Use their name.
closingQuestion: one action-forcing question. Present tense. Use their name.

ROLE: AVOIDING_CHALLENGER — DIRECT_CONVERSATION:
- reframe: Passenger belief making avoidance rational vs Captain truth. One sentence.
- breakdown: root cause, specific story, concrete cost.
- script: OPENING (topic/goal/permission, calm, no apology), ISSUE (two facts + behavior + calibrated question), IMPACT (observable consequence), ASK (specific change + timeframe + pause instruction), PUSHBACK (hold standard, calibrated question)
- sections: State Set, Script Variations, Tactical Delivery, Standard Setter

ROLE: AVOIDING_CHALLENGER — INDIRECT_INFLUENCE:
- script: null
- sections: Strategic Positioning, Influence Moves, Visibility Actions

ROLE: AVOIDING_CHALLENGER — STRATEGIC_CONTAINMENT:
- script: null
- sections: Standard Definition, Control Moves, Timing Decision

ROLE: PASSENGER (stuck, invisible, waiting):
For "I Feel Stuck in My Career" — diagnose root cause, then:
- sections: Clarity Map, Direction Options, Outreach Scripts (premium), Follow-Up Strategy (premium), Momentum Loop
For other Passenger flows:
- sections: Ownership Shift, External Move, Direction Lock, Momentum Loop

ROLE: OVERWHELMED (Pattern Interrupt):
- sections: Pattern Interrupt, Momentum List, Back Online, Momentum Loop

All outputs must be personalised to the user profile provided. Reference their name, industry, level, challenge, and goal throughout.

Output raw JSON. No markdown.`;

const NEGOTIATE_PROMPT_SHARED_SUFFIX = `
Generate EXACTLY this JSON. Output sections as empty array and nextSteps as ["placeholder"].

{
  "problemType": "AVOIDING_CHALLENGER",
  "strategy": "DIRECT_CONVERSATION",
  "mode": "Challenger",
  "roleShift": "current avoidance or softening pattern — direct ask behavior. Max 6 words each side. Real words.",
  "behavioralObjective": "have the compensation conversation with [specific person] within 48 hours.",
  "reframe": "Passenger belief keeping them from asking — Captain truth replacing it. Under 20 words.",
  "breakdown": "sentence 1: root cause. Sentence 2: specific story making delay rational. Sentence 3: concrete monetary or opportunity cost of delay.",
  "trigger": {
    "triggerName": "specific fear driving avoidance — 6-10 words",
    "energyShift": "physical reset before the conversation. Verb first. 1-2 sentences.",
    "repetitionStatement": "Captain identity. Present tense. Under 10 words."
  },
  "identityAnchor": "who they are in this conversation. Credible. Use their name if known.",
  "script": {
    "opening": "personalised opening for their specific situation",
    "issue": "personalised issue using evidence from their answers",
    "impact": "personalised impact. One sentence.",
    "ask": "their specific target. Direct. End with: [Pause. Stop talking. Do not explain. Let them respond first.]",
    "pushback": "acknowledge calmly, re-anchor to evidence, calibrated question: What would need to happen for this to be possible? Hold silence. If stalling: turn delay into written criteria and a named date."
  },
  "sections": [],
  "nextSteps": ["placeholder"],
  "closingQuestion": "one sentence specific to their negotiation. Present tense. Productive discomfort. Use their name if known."
}`;

function getNegotiatePrompt(situationType: string): string {
  const base = `You are an elite coach for professional women. Generate negotiation coaching. Output raw JSON only. No markdown. No code fences.

${STYLE_RULES}

NEGOTIATION PRINCIPLES (embedded, never named):
- Know your target, your acceptable range, and your walk-away before the room. Clarity before the conversation gives you composure during it.
- The first number anchors everything. Name your number — do not ask what they think is fair.
- Silence after the ask is leverage. The first person to fill it loses positioning.
- Label what you observe: "It sounds like budget is the main constraint." Naming it reduces its power.
- Mirror to invite elaboration: repeat the last 2-3 words as a question. Creates information without accusation.
- Calibrated questions move the conversation without confrontation: "What would need to happen for this to be possible?"
- Never leave without a specific next step. Vague commitments compound the problem.
- Plant seeds early. The ask should never be the first time they hear about the topic.
- Know your walk-away point and be genuinely willing to use it. That is where your leverage lives.
- Create urgency: signal you are a flight risk, that you have options, that you are 100% committed but not 100% loyal. Most people negotiate from fear of loss — use that.
- Complement first: acknowledge the organisation and the leader genuinely before naming the ask. This opens the door.
- Plant seeds: the ask should never be the first time they hear about the topic. Raise it in passing before the formal conversation.
- Shut up after the ask: silence is leverage. The first person to fill the silence loses positioning.`;

  if (situationType === "A salary increase" || situationType === "I believe I am underpaid") {
    return `${base}

SITUATION: Currently employed. Pay is below market rate. This is a market alignment conversation, not a performance review.
FRAME: The compensation is out of step with the market. Market data is the argument, not personal effort or loyalty.
ALL FIELDS MUST use market-rate framing.
${NEGOTIATE_PROMPT_SHARED_SUFFIX}`;
  }

  if (situationType === "Additional scope or resources" || situationType === "A promotion" || situationType === "My role has grown") {
    return `${base}

SITUATION: Currently employed. Responsibilities have expanded materially since compensation was last set.
FRAME: The role changed. The compensation did not. Scope evidence is the argument.
ALL FIELDS MUST use scope-evolution framing.
${NEGOTIATE_PROMPT_SHARED_SUFFIX}`;
  }

  return `${base}

SITUATION: Negotiating terms on a new job offer or a role change opportunity. Has not accepted yet.
FRAME: The first number agreed to becomes the baseline for every future raise. Move before accepting.
CRITICAL: Do NOT use language like "I am excited about this opportunity" — this is a compensation negotiation, not a thank-you. Stay focused on their target number, their leverage, and securing a commitment.
ALL FIELDS MUST use offer-negotiation framing. Do not use "my role has grown" or market underpay language.
${NEGOTIATE_PROMPT_SHARED_SUFFIX}`;
}

router.post("/evaluate", async (req, res) => {
  const { flowType, answers } = req.body as {
    flowType: string;
    answers: Record<string, string | string[]>;
  };
  if (!flowType || !answers) { res.status(400).json({ error: "Missing flowType or answers" }); return; }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 800,
      messages: [
        { role: "system", content: EVALUATE_PROMPT },
        { role: "user", content: buildUserPrompt(flowType, answers, null) },
      ],
    });
    const raw = (completion.choices[0]?.message?.content ?? "{}").trim();
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    let parsed;
    try { parsed = JSON.parse(stripped); } catch {
      parsed = {
        problemType: "AVOIDING_CHALLENGER", recommendedStrategy: "DIRECT_CONVERSATION",
        assessment: {
          DIRECT_CONVERSATION: "Naming the issue directly gives you the clearest signal.",
          INDIRECT_INFLUENCE: "Shifting perception is a higher-return move here.",
          STRATEGIC_CONTAINMENT: "Protecting your position is the priority before any direct action.",
        },
        options: [
          { type: "DIRECT_CONVERSATION", label: "Challenge it directly" },
          { type: "INDIRECT_INFLUENCE", label: "Shift the dynamic through influence" },
          { type: "STRATEGIC_CONTAINMENT", label: "Hold the standard while managing risk" },
        ],
      };
    }
    if (parsed.problemType === "PASSENGER") parsed.problemType = "VICTIM";
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "evaluate error");
    res.status(500).json({ error: "Failed to evaluate" });
  }
});

router.post("/generate", async (req, res) => {
  const { flowType, answers, problemType, strategy, userProfile } = req.body as {
    flowType: string;
    answers: Record<string, string | string[]>;
    problemType: string;
    strategy: string | null;
    userProfile?: { name?: string; industry?: string; level?: string; challenge?: string; goal?: string };
  };
  if (!flowType || !answers || !problemType) { res.status(400).json({ error: "Missing required fields" }); return; }

  const isNegotiate = flowType === "negotiate";
  const isConversation = flowType === "conversation" && strategy === "DIRECT_CONVERSATION";
  const isSpeakUp = flowType === "speak_up";
  const isExecutiveVisibility = flowType === "executive_visibility";
  const isMindset = flowType === "mindset";
  const situationType = isNegotiate ? ((answers["situation_type"] as string | undefined) ?? "Starting a new role") : null;

  const systemPrompt = isNegotiate ? getNegotiatePrompt(situationType ?? "Starting a new role")
    : isConversation ? CONVERSATION_PROMPT
    : isSpeakUp ? SPEAK_UP_PROMPT
    : isExecutiveVisibility ? EXECUTIVE_VISIBILITY_PROMPT
    : isMindset ? MINDSET_PROMPT
    : GENERATE_PROMPT;

  const userPrompt = buildUserPrompt(flowType, answers, userProfile ?? null);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 16000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    const raw = (completion.choices[0]?.message?.content ?? "{}").trim();
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    let parsed;
    try { parsed = JSON.parse(stripped); } catch {
      console.log("JSON PARSE FAILED for flowType:", flowType);
      console.log("RAW AI RESPONSE (first 500):", raw.substring(0, 500));
      parsed = buildFallback(problemType, strategy, userProfile?.name);
    }
    if (parsed.problemType === "PASSENGER") parsed.problemType = "VICTIM";

    if (isNegotiate) parsed = enforceNegotiateSections(parsed, answers);
    else if (isConversation) parsed = enforceConversationSections(parsed);
    else if (isSpeakUp) parsed = enforceSpeakUpSections(parsed);
    else if (isExecutiveVisibility) parsed = enforceExecutiveVisibilitySections(parsed);
    else if (isMindset) parsed = enforceMindsetSections(parsed);

    if (strategy && !isNegotiate) {
      parsed.strategy = strategy;
      parsed.mode = (strategy === "INDIRECT_INFLUENCE" || strategy === "STRATEGIC_CONTAINMENT") ? "Strategist" : "Challenger";
    }
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "generate error");
    res.status(500).json({ error: "Failed to generate coaching" });
  }
});

function enforceMindsetSections(parsed: Record<string, unknown>) {
  const ai = (parsed.sections as { title: string; premium: boolean; content: string }[] | undefined) ?? [];
  if (ai.length >= 2) return { ...parsed, script: null, sections: ai.map(s => ({ ...s, premium: s.title === "Power Questions" ? true : false })) };
  return { ...parsed, script: null, sections: ai };
}

function enforceSpeakUpSections(parsed: Record<string, unknown>) {
  const ai = (parsed.sections as { title: string; premium: boolean; content: string }[] | undefined) ?? [];
  const yourLines = ai.find(s => s.title === "Your Lines") ?? {
    title: "Your Lines", premium: true,
    content: "Line 1: The angle I would add here is [observation]. That changes how we approach [decision].\n\nLine 2: Building on that — the implication for [topic] is [point].\n\nLine 3: What is driving [specific assumption]? I want to make sure we are solving the right problem.\n\nWhen the moment has passed: Going back to [topic] — I want to add something. Then say it.",
  };
  return {
    ...parsed, script: null, sections: [
      { title: "Before You Walk In", premium: false, content: "Write one sentence before the meeting starts. Not an outline — one contribution you are ready to say out loud. Write it. Say it aloud. You are not going to compose it in the room. You are going to deliver it." },
      { title: "Get In Early", premium: false, content: "Speak in the first 10 minutes. Once you have spoken once, the cost of speaking again drops significantly. Once you have stayed quiet for 20 minutes, breaking the silence costs much more. You do not need a perfect point. You need to be in the conversation before it locks." },
      { title: "The Two-Sentence Rule", premium: false, content: "Say one thing. Two sentences maximum. Then stop. Your observation or position — one sentence. What it means or what you recommend — one sentence. Do not add context. Do not soften. Longer contributions dilute the point and invite interruption." },
      yourLines,
    ],
  };
}

function enforceExecutiveVisibilitySections(parsed: Record<string, unknown>) {
  const ai = (parsed.sections as { title: string; premium: boolean; content: string }[] | undefined) ?? [];
  const taskImpact = ai.find(s => s.title === "Task to Impact") ?? {
    title: "Task to Impact", premium: false,
    content: "Instead of: I managed the reporting process\nSay: Reporting landed on time and surfaced a budget risk — finance now has a decision to make\n\nInstead of: I ran the team onboarding\nSay: New hire ramp time dropped — the team is productive two weeks faster\n\nInstead of: I completed the stakeholder review\nSay: The review confirmed alignment — it removes the blocker on the next phase\n\nYour positioning sentence: [What you delivered] + [business outcome] + [what it makes possible]. One sentence. Write it now.",
  };
  return {
    ...parsed, script: null, sections: [
      taskImpact,
      { title: "Executive Frames", premium: false, content: "Five templates for communicating at the executive level:\n\n1. Outcome and implication: [Deliverable] produced [result]. The implication for [area] is [one sentence].\n2. What this enables: [Work] unlocks [specific opportunity]. What is now possible: [one sentence].\n3. Risk surfaced: [Work] identified [specific risk]. Recommendation: [action] by [timeframe].\n4. Conclusion first: The answer is [conclusion]. We got there by [one sentence]. Next step: [specific ask].\n5. The business case: [Project] is [one-sentence case]. The decision needed: [specific ask].\n\nRule: conclusion first, context second, ask last." },
      { title: "The Standard", premium: true, content: "Senior leaders are not evaluating your effort. They are evaluating your judgment.\n\nClarity signals confidence. Detail signals execution. Direction signals leadership.\n\nWhen you lead with the conclusion and name the implication, you are read as a strategist. When you walk through your process to reach a conclusion, you are read as an executor.\n\nThe way you communicate your work is the first data point leaders use to assess your level. Use it deliberately." },
    ],
  };
}

function enforceConversationSections(parsed: Record<string, unknown>) {
  if (parsed.script && typeof parsed.script === "object") (parsed.script as Record<string, unknown>).pushback = null;
  return {
    ...parsed, strategy: "DIRECT_CONVERSATION", sections: [
      { title: "Internal Clarity", premium: false, content: "Before entering the conversation, write down three things:\n\n1. What exactly do I want to change? Not better communication — the specific behavior that needs to stop or start.\n2. What impact is this having on my work or results? One sentence. Measurable where possible.\n3. What is my next step if this conversation does not produce change? Name it now — not later.\n\nDo not enter this conversation to express frustration. Enter to shift something specific." },
      { title: "Handle Pushback", premium: false, content: "Three responses — use the one that fits:\n\nIf they get defensive:\n'I hear that. That is not my intention — I want us to work better together. How do we move forward from here?'\n\nIf they minimise:\n'I understand it may not feel significant to you. It is affecting my ability to deliver at my best.'\n\nIf they deflect:\n'That may also be true. For now I would like to stay focused on this specific point.'" },
      { title: "Discipline", premium: true, content: "Three rules for the room:\n\nDo not over-explain.\nDo not fill silence.\nDo not rescue the conversation.\n\nSilence creates pressure. Let it work. The Captain who says less in this moment holds more." },
    ],
  };
}

function enforceNegotiateSections(parsed: Record<string, unknown>, answers: Record<string, string | string[]>) {
  const sit = (answers["situation_type"] as string | undefined) ?? "";
  let identityAnchor: string, nextSteps: string[];
  let sections: { title: string; premium: boolean; content: string }[];

  if (sit === "Additional scope or resources" || sit === "A promotion" || sit === "My role has grown") {
    identityAnchor = "You lead with results, not requests — and you do not leave the room without a commitment.";
    nextSteps = ["Five actions before the conversation:\n1. Write 3-5 specific scope changes since your last compensation review. One sentence each, measurable.\n2. Attach a concrete outcome to each: revenue, efficiency, team impact, risk reduced.\n3. Write your target number and your floor. Both down before the conversation.\n4. Prepare your opening line and say it aloud — not in your head.\n5. Schedule the conversation within 48 hours — name the day."];
    sections = [
      { title: "Your Value Case", premium: false, content: "Before you name a number, build the case.\n\nScope changes: Every responsibility you have taken on since your compensation was last set. Specific — not I took on more but I now own X, Y, and Z.\nOutcomes: One result per change. Revenue, costs, team performance, risk managed.\nBaseline: Know when your compensation was last set and what your role looked like then. That gap is the argument.\n\nDo not enter this conversation without all three written down." },
      { title: "Lead with Contribution", premium: false, content: "Start with results — not with what you want.\n\n1. Frame: My role has expanded significantly. I would like to walk you through what it looks like now — and then have a conversation about compensation.\n2. Scope: Name the specific changes. No hedging.\n3. Outcomes: State what those changes produced. One sentence per result.\n4. Align: I want to make sure my compensation reflects the scope I am actually operating at.\n5. Ask: Name your number. Directly.\n6. Pause: Stop talking. Let them respond. Do not fill the silence." },
      { title: "Bridge to Compensation", premium: false, content: "Once you have walked through scope and outcomes, make the direct connection.\n\nWhat I have described is materially different from the role I was in when my compensation was last reviewed. I want to make sure what I am paid reflects what I am delivering.\n\nThen name the number. No preamble.\n\nIf they need to think: Of course. When can we pick this up? Name a specific date. Do not leave it open." },
      { title: "If They Resist", premium: true, content: "If they say budget is tight or timing is not right:\n\n1. Acknowledge without backing down: I hear you on timing. Pause.\n2. Re-anchor: The scope and results are real — that is not changing. Pause.\n3. Ask: What would need to be true for us to revisit this?\n4. Lock criteria: So if I deliver X by Y date, we can revisit compensation — can we put that in writing?\n\nA named date with documented milestones is a commitment. Let us revisit soon is not." },
    ];
  } else if (sit === "A salary increase" || sit === "I believe I am underpaid") {
    identityAnchor = "You are not asking for a favour. You are correcting an imbalance — calmly, clearly, and with evidence.";
    nextSteps = ["Five actions before the conversation:\n1. Pull 3 market data points for your role, level, and location — specific figures.\n2. Write your target number grounded in that data.\n3. Set your walk-away: the minimum acceptable outcome and what you do if it is not met.\n4. Prepare your opening line word for word. Say it aloud twice.\n5. Schedule the conversation within 48 hours — name the day."];
    sections = [
      { title: "Positioning", premium: false, content: "Frame this correctly before the conversation — and inside it.\n\nThis is a market alignment conversation, not a performance discussion.\n\nYou are not asking your manager to recognise how hard you work. You are flagging that your compensation is out of step with the market for your role and level. Stay on market data. Do not bring in emotion, loyalty, or tenure. Facts hold your position." },
      { title: "Opening and Market Reference", premium: false, content: "I would like to talk about how my compensation aligns with the market for my role.\n\nThen: Based on market data I have reviewed, my current compensation appears to be below the range for someone at my level.\n\nThen name your number: I would like to get to [figure]. Can we have that conversation?\n\nThen: Stop. Let them respond. Do not explain. Do not soften." },
      { title: "Handle Pushback", premium: false, content: "When they say budget is a factor:\nI understand budget can be a consideration. What would need to happen to revisit this — and when?\n\nWhen they stall:\nCan we define a timeline? I would like a clear date to work toward.\n\nWhen they say you are already paid fairly:\nThe market data I have seen suggests otherwise. I am happy to share what I am looking at — can we review it together?\n\nDo not leave without a number, a date, or written criteria." },
      { title: "Lock a Timeline", premium: true, content: "If compensation cannot move now, get a commitment on when and what.\n\nIf the number is not available right now, can we agree on a specific date to revisit — and what I would need to deliver for that to happen?\n\nThen document it. Send a follow-up email the same day: As agreed, we will revisit my compensation on [date]. The criteria we discussed: [list them].\n\nA verbal agreement without documentation is not an agreement." },
    ];
  } else {
    identityAnchor = "You know your value, you communicate it clearly, and you do not leave conversations without a next step.";
    nextSteps = ["Five actions before the conversation:\n1. Research the market range — pull 3 specific data points.\n2. Set your target and your floor. Write both down.\n3. Decide what else is negotiable — equity, title, sign-on, review timing.\n4. Prepare your opening line and say it aloud.\n5. Reply or schedule the conversation within 24 hours."];
    sections = [
      { title: "Before You Respond", premium: false, content: "Do not accept or counter an offer without doing this first.\n\nResearch: 3 market data points for this role, level, and location.\nTarget: A specific figure — not higher. Write it down.\nFloor: The minimum you would accept. Know this before you speak.\nWider package: What else is negotiable — equity, title, sign-on, review timing. Rank them.\n\nStructure buys you calm. Enter without it and you will improvise." },
      { title: "Counter the Offer", premium: false, content: "Thank you for the offer. I am genuinely excited about this role. I would like to discuss the compensation — based on the market and what I am bringing, I was targeting [your number]. Is there room to move on base?\n\nThen stop. Do not explain. Do not justify. Hold the silence.\n\nIf they need to check: Of course — when can we pick this up? Name a day." },
      { title: "Handle We Are at the Top", premium: false, content: "When they say they are at the top of the range:\n\n1. Acknowledge: I appreciate you being direct about that. Pause.\n2. Re-anchor: Based on the market data I have seen, I think there is still room — I would like to land at [figure].\n3. Alternative: Is there flexibility on sign-on, equity, or a 6-month review?\n\nYou are not obligated to decide on the spot. I want to make this work. Let me think about it — can we speak again tomorrow?" },
      { title: "What Else Is On the Table", premium: true, content: "If base compensation is fixed, negotiate everything else.\n\nSign-on bonus: Often more flexible than base. Is there flexibility on a sign-on to account for what I am leaving behind?\nEquity: Vesting schedule and cliff. More equity with a shorter cliff can be worth more than a higher base.\nTitle: If the role is scoped above the title, negotiate it now. It costs them nothing and affects your next move.\nPerformance review: Can we agree to review compensation at 6 months based on [specific criteria]? Get the criteria in writing." },
    ];
  }
  return { ...parsed, problemType: "AVOIDING_CHALLENGER", strategy: "DIRECT_CONVERSATION", mode: "Challenger", identityAnchor, nextSteps, sections };
}

function buildFallback(problemType: string, strategy: string | null, name?: string) {
  const nameStr = name ? `, ${name}` : "";
  return {
    problemType, strategy,
    reframe: "Waiting for the right moment is the pattern. The moment is now.",
    breakdown: `The next move is clear${nameStr}. The question is whether you take it today or keep building the case for why the timing is not right. Every day you wait is still a decision — just not the one you intended to make.`,
    script: strategy === "DIRECT_CONVERSATION" ? {
      opening: "I want to address something that is affecting my work. Is now a good time?",
      issue: "There is a specific pattern I need to name. Here is what I have observed.",
      impact: "The effect of this on my work and results is real and measurable.",
      ask: "What I need is a specific change, agreed on today. [Pause. Say nothing.]",
      pushback: "I hear you. This still needs to be resolved. What would need to happen to move this forward?",
    } : null,
    sections: [{ title: "What to Do Now", content: `1. Name the highest-leverage action available to you in the next 24 hours${nameStr}.\n2. Execute it before anything else today.\n3. Reassess tomorrow with new information, not the same story.`, premium: false }],
    nextSteps: ["Identify the one action you have been avoiding. That is your first move. Do it before anything else today."],
  };
}

function buildUserPrompt(
  flowType: string,
  answers: Record<string, string | string[]>,
  userProfile: { name?: string; industry?: string; level?: string; challenge?: string; goal?: string } | null
): string {
  const profileSection = userProfile ? `
USER PROFILE (use throughout your response — personalise to this person specifically):
Name: ${userProfile.name ?? "not provided"}
Industry: ${userProfile.industry ?? "not provided"}
Level: ${userProfile.level ?? "not provided"}
Biggest current challenge: ${userProfile.challenge ?? "not provided"}
What success looks like in 6 months: ${userProfile.goal ?? "not provided"}

This is ${userProfile.name ?? "a professional"}, a ${userProfile.level ?? "professional"} in ${userProfile.industry ?? "their industry"}. Their coaching must feel written for them specifically — not a generic template.
` : "";

  if (flowType === "stuck") {
    const root = answers.root_cause ?? "";
    const strengths = Array.isArray(answers.strengths) ? answers.strengths.join(", ") : answers.strengths ?? "";
    const wants = Array.isArray(answers.wants) ? answers.wants.join(", ") : answers.wants ?? "";
    const directions = Array.isArray(answers.directions) ? answers.directions.join(", ") : answers.directions ?? "";
    const success = answers.success ?? "";
    return `${profileSection}Coaching scenario: I Feel Stuck in My Career

What they believe is holding them back: ${root}
Strengths they bring: ${strengths}
What they want more of: ${wants}
Directions calling to them: ${directions}
What success looks like in 3 years: ${success}

Diagnose the root cause precisely — is this a clarity gap (do not know what they want), a strategy gap (know what they want but not how to get there), or an obstacle (something or someone in the way)? Name it clearly in the breakdown. Then generate deeply personalised coaching reflecting their exact combination of strengths, wants, and directions. Not a generic career template.`;
  }

  if (flowType === "negotiate") {
    return `${profileSection}Coaching scenario: Negotiate Something Important

Situation type: ${answers.situation_type ?? ""}
What they are negotiating: ${answers.what ?? ""}
Where they are in the process: ${answers.timing ?? ""}
Their target: ${answers.target ?? ""}
Their leverage: ${answers.leverage ?? ""}
What worries them most: ${answers.fear ?? ""}

Calibrate everything to their situation type (${answers.situation_type ?? ""}), their leverage position, and their primary fear.`;
  }

  if (flowType === "conversation") {
    return `${profileSection}Coaching scenario: Handle a Tough Conversation

Who the conversation is with: ${answers.who ?? ""}
What it is about: ${answers.topic ?? ""}
How they are feeling going into it: ${answers.feeling ?? ""}
What success looks like: ${answers.goal ?? ""}

Generate coaching calibrated to a conversation with ${answers.who ?? "this person"} about ${answers.topic ?? "this topic"}. The script must reflect that specific relationship and situation.`;
  }

  if (flowType === "speak_up") {
    return `${profileSection}Coaching scenario: Speak Up in Meetings

What holds them back: ${answers.blocker ?? ""}
What happens in the moment: ${answers.pattern ?? ""}
Type of meeting: ${answers.meeting_type ?? ""}
What staying quiet costs them: ${answers.cost ?? ""}

Generate coaching calibrated to their exact silence pattern (${answers.pattern ?? ""}) in ${answers.meeting_type ?? "meetings"}.`;
  }

  if (flowType === "mindset") {
    return `${profileSection}Coaching scenario: Reset My Mindset Quickly

What is weighing on them: ${answers.feeling ?? ""}
What triggered this: ${answers.trigger ?? ""}
What their mind is doing with it: ${answers.pattern ?? ""}

Identify which of the three Passenger patterns is active (Victim, Self-Doubt, or Comparison), name the exact story being treated as fact, and generate a fast decisive pattern interrupt specific to this person and their situation.`;
  }

  if (flowType === "executive_visibility") {
    return `${profileSection}Coaching scenario: Make My Work Visible to Leadership

Main challenge: ${answers.challenge ?? ""}
Who they need to be visible to: ${answers.audience ?? ""}
How they share their work: ${answers.medium ?? ""}
Their biggest positioning gap: ${answers.gap ?? ""}

Generate positioning coaching for someone whose audience is ${answers.audience ?? "leadership"} and whose main gap is ${answers.gap ?? "framing work as business impact"}.`;
  }

  const lines = Object.entries(answers).map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\n");
  return `${profileSection}Coaching scenario: ${flowType}\n\nUser situation:\n${lines}`;
}

// ── Commitment / check-in endpoints ──────────────────────────────────────────

router.post("/commitment", (req, res) => {
  const { email, flowType, objective } = req.body as {
    email?: string;
    flowType?: string;
    objective?: string;
  };
  if (!flowType || !objective) {
    res.status(400).json({ error: "flowType and objective are required" });
    return;
  }
  const c = createCommitment(email ?? null, flowType, objective);
  res.json({ id: c.id, objective: c.objective, createdAt: c.createdAt });
});

router.get("/commitment/:id", (req, res) => {
  const c = getCommitment(req.params.id);
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  res.json(c);
});

router.post("/commitment/:id/checkin", (req, res) => {
  const { followedThrough } = req.body as { followedThrough?: boolean };
  if (typeof followedThrough !== "boolean") {
    res.status(400).json({ error: "followedThrough (boolean) is required" });
    return;
  }
  const c = checkIn(req.params.id, followedThrough);
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  res.json(c);
});

router.get("/pending", (req, res) => {
  const { email } = req.query as { email?: string };
  if (!email) { res.status(400).json({ error: "email query param required" }); return; }
  res.json(pendingForEmail(email));
});

export default router;
