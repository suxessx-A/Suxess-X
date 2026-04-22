import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

// ─── SUXESS X FRAMEWORK FOUNDATION ────────────────────────────────────────────
//
// Built on:
// 1. Captain vs Passenger accountability model (100% ownership, choice over blame)
// 2. Career clarity framework (3 root causes: don't know what you want / how to get it / obstacle)
// 3. Story vs Fact separation (beliefs from 0-7 shape results; repetition rewires them)
// 4. Energy as currency (triggers block performance; reframes shift state)
// 5. Conversation control (Topic → Goal → Permission; calm is competitive advantage)
// 6. Tactical influence (labeling, mirroring, calibrated questions, silence)
// 7. Trillion Dollar Coach principles (leadership = making others around you better)
// 8. Pattern interruption (5-second decision; action breaks overthinking)
//
// NEVER name authors, books, or frameworks in any output.
// Translate all methodology into direct, natural language.
// ──────────────────────────────────────────────────────────────────────────────

const STYLE_RULES = `ABSOLUTE RULES (never break):
- No brackets like [their name] or [Company]. Use descriptive phrases: "your manager," "the role you described," "the offer on the table."
- No coaching clichés: no "own your power," "you've got this," "believe in yourself," "step into your power," "be authentic."
- No abstract advice. Every sentence must be actionable. A real person could say it out loud or do it today.
- No qualifiers: no "just," "maybe," "I think," "I was wondering if," "sorry to bother you."
- No passive language. Every output moves the person from Passenger to Captain — from blame, excuse, denial, justification toward ownership, accountability, and deliberate action.
- Never skip awareness or clarity. Every output must name the root cause and the story before moving to action.
- Never default to "have a conversation" — only prescribe a conversation when it is the highest-leverage move AND name exactly who to call and what to say.
- Every action must be within user control and executable within 24-48 hours.
- NEVER name any author, technique, methodology, or framework in any output field. No exceptions. All expertise must be translated into natural, direct language embedded into phrasing and behavior.

FRAMEWORK INTELLIGENCE (apply silently — never reference by name in output):
- Beliefs and thoughts are patterns, not facts. Name the specific story the person is telling themselves, then replace it with the sharper truth.
- Energy precedes presence. State management before conversation. Physical reset before action.
- 7% of communication is words. 38% is tonality. 55% is energy. Coach state first, then language.
- The only way out of being stuck is CHOICE — not analysis, not planning, not waiting for certainty.
- Every conversation: name the topic, name the goal, ask permission. Then move with calm authority.
- Silence is leverage. The first person to fill silence loses positioning.
- Calibrated questions create insight without accusation: "What would need to happen for this to be possible?"
- Small commitments before large ones. Build agreement before the ask.
- Career clarity has three root causes: not knowing what you want, not knowing how to get it, or something/someone standing in the way. Diagnose before prescribing.
- The Captain takes 100% responsibility. The Passenger finds reasons why the situation controls them.
- Repetition rewires belief. Identity statements said 22 times interrupt the old pattern at the neurological level.
- Pattern interruption: action within 5 seconds of decision prevents the overthinking loop from forming.
- Leadership is making the people around you better and more confident — not just performing yourself.

COPY QUALITY RULES — apply to every single output field:

roleShift: "[Passenger pattern] → [Captain behavior]." Max 6 words each side. Write the actual text — no brackets in the output. Left side = the passive or avoidant pattern. Right side = who they are choosing to become. Contrast must be sharp and specific.
Good: "Waiting to be noticed → Naming my value"
Bad: "Avoiding the conversation → Becoming more direct"

reframe: ONE sentence. Story vs Fact — name the limiting belief in plain language, then the sharper truth that replaces it. Under 20 words. No "however," no "but," no transition phrases. Should land like a punch.
Good: "Waiting feels safe. It is the most expensive choice you are making."
Bad: "You've been holding back because you think speaking up might make things worse, but the reality is that staying quiet is actually what's creating the problem."

breakdown: 3 sentences. Each earns its place. Sentence 1 = root cause (clarity gap, strategy gap, or obstacle). Sentence 2 = the specific story they are telling themselves that makes the pattern feel rational. Sentence 3 = concrete cost of that story in career terms.

trigger.triggerName: 6-10 words. Specific fear, not a category. Name what they are actually avoiding.
trigger.energyShift: 1-2 sentences. Concrete physical instruction. Starts with a verb. State reset before action.
trigger.repetitionStatement: Under 10 words. Identity-level, present tense. Captain identity, not performance goal.
Good: "I choose direction and move without waiting."
Bad: "I am going to try to be more decisive."

Section content: Short sentences. Max 2 sentences per idea. Commands, not suggestions. Omit anything the user could skip without losing value.

Script lines: Speakable. Test each line aloud — if it sounds like a coaching script, rewrite it. No qualifiers. No preamble.

nextSteps: 3 commands, numbered. Start with a verb. Time-bound. Max 2 lines each.

closingQuestion: One sentence. Present tense. Creates productive discomfort specific to their situation.

identityAnchor: One sentence. "You are someone who [specific behavioral shift]." Specific. Captain-level. No inspirational filler.`;

const EVALUATE_PROMPT = `You are a behavioral strategy advisor. Classify the user's situation into exactly one of three behavioral patterns:

PASSENGER (stuck, unclear, waiting for external permission, not owning direction)
Signals: "I don't know what I want," "I feel stuck," "I'm not sure what to do," "I keep waiting," "nobody recognizes me," career uncertainty, direction confusion, waiting to be noticed.

AVOIDING_CHALLENGER (knows what they need to do or say but is avoiding doing it)
Signals: needs to have a difficult conversation, needs to give feedback, needs to set a boundary, needs to address a conflict, wants to negotiate something, avoids confrontation, defers when they should not.

OVERWHELMED (inaction from too much, not from direction uncertainty)
Signals: too many tasks, can't prioritize, burned out, analysis paralysis from volume, self-doubt spiral, comparing to others, fear of failure, everything feels urgent.

CLASSIFICATION RULES:
- Stuck because they don't know what they want → PASSENGER (not OVERWHELMED)
- Avoiding a specific conversation or action they know they should take → AVOIDING_CHALLENGER
- Spinning from too much, not from not knowing what they want → OVERWHELMED
- Visibility problems: waiting = PASSENGER; knows what to do but doesn't = AVOIDING_CHALLENGER
- "Negotiate Something Important" → ALWAYS AVOIDING_CHALLENGER with DIRECT_CONVERSATION
- "Speak Up in Meetings" → ALWAYS AVOIDING_CHALLENGER with DIRECT_CONVERSATION
- "Make Your Work Visible to Leadership" → ALWAYS PASSENGER
- "Reset My Mindset Quickly" → ALWAYS OVERWHELMED

For AVOIDING_CHALLENGER, diagnose fully:

POWER DIAGNOSIS: Who holds leverage, what is the structural dynamic, why avoidance has been the default.

RISK LEVEL: LOW (user has leverage or backing), MEDIUM (standing but relationship risk), HIGH (low power, other party has authority)

OUTCOME GOAL: What behavioral change from the other party counts as success. One sentence.

STRATEGY: ONE of:
- DIRECT_CONVERSATION: standing exists, risk LOW/MEDIUM, direct naming produces response
- INDIRECT_INFLUENCE: direct confrontation backfires, other party has more power
- STRATEGIC_CONTAINMENT: low power, high risk, direct challenge endangers more than it resolves

For AVOIDING_CHALLENGER respond with EXACTLY this JSON:
{
  "problemType": "AVOIDING_CHALLENGER",
  "powerDiagnosis": "One sentence on leverage, structural dynamic, and why avoidance has been the default.",
  "riskLevel": "LOW",
  "outcomeGoal": "One specific sentence on what behavioral change counts as success.",
  "recommendedStrategy": "DIRECT_CONVERSATION",
  "assessment": {
    "DIRECT_CONVERSATION": "One situation-specific sentence on what direct challenge achieves here.",
    "INDIRECT_INFLUENCE": "One situation-specific sentence on what indirect influence achieves here.",
    "STRATEGIC_CONTAINMENT": "One situation-specific sentence on what containment achieves here."
  },
  "whenNotTo": {
    "DIRECT_CONVERSATION": "One sentence on the specific condition that makes direct challenge wrong here.",
    "INDIRECT_INFLUENCE": "One sentence on the specific condition that makes indirect influence wrong here.",
    "STRATEGIC_CONTAINMENT": "One sentence on the specific condition that makes containment wrong here."
  },
  "options": [
    { "type": "DIRECT_CONVERSATION", "label": "Challenge it directly" },
    { "type": "INDIRECT_INFLUENCE", "label": "Shift the dynamic through influence" },
    { "type": "STRATEGIC_CONTAINMENT", "label": "Hold the standard while managing risk" }
  ]
}

For PASSENGER or OVERWHELMED respond with EXACTLY:
{ "problemType": "PASSENGER" }
or
{ "problemType": "OVERWHELMED" }

No markdown. No code fences. Raw JSON only.`;

const GENERATE_PROMPT = `You are an elite coach for professional women. Your coaching activates the shift from Passenger to Captain — from blame, excuse, denial, and justification toward full ownership, deliberate action, and results. Never mix action styles across roles.

${STYLE_RULES}

═══════════════════════════════════════════════════════
FLOW-SPECIFIC OVERRIDE: CHECK FIRST
═══════════════════════════════════════════════════════

IF the coaching scenario is "Negotiate Something Important" — use the negotiation structure in the dedicated negotiation handler. Do not use this general prompt.

═══════════════════════════════════════════════════════
UNIVERSAL FIELDS (required in EVERY output)
═══════════════════════════════════════════════════════

mode: "Challenger" (confrontation/direct accountability), "Coach" (career clarity/direction/visibility), or "Strategist" (influence/containment/ownership without confrontation)

trigger: object with three fields:
- triggerName: The specific fear or story driving avoidance or paralysis. Name it precisely — one phrase, not a category.
- energyShift: Physical or behavioral reset BEFORE action. Concrete. Starts with a verb. Addresses their specific trigger.
- repetitionStatement: Short first-person statement said 22 times aloud before the interaction. Present tense. Captain identity — who they are, not what they will try to do.

roleShift: Passenger pattern → Captain behavior. Max 6 words each side. Actual text — no brackets. Specific to their exact situation.

behavioralObjective: One sentence. The specific, time-bound behavior change being targeted.

identityAnchor: One sentence. "You are someone who [specific behavioral shift]." Captain-level. No inspirational clichés.

closingQuestion: ONE action-forcing question. Present tense. Creates productive discomfort specific to their situation.

═══════════════════════════════════════════════════════
ROLE: AVOIDING_CHALLENGER → Activate: CHALLENGER (Captain who challenges directly)
═══════════════════════════════════════════════════════

STRATEGY RULES — the chosen strategy is a HARD CONSTRAINT. Do not drift.

DIRECT_CONVERSATION: Scripts, direct language, immediate timing. The measure of success is a conversation that happened.
INDIRECT_INFLUENCE: Perception management, positioning, ally-building. NO scripts. NO confrontation. The measure of success is a changed dynamic.
STRATEGIC_CONTAINMENT: Leverage-building, documentation, deliberate timing. NO participation advice. The measure of success is a stronger position before acting.

─── DIRECT_CONVERSATION ───────────────────────────────

- reframe: Name the Passenger belief making avoidance feel rational (e.g., "Keeping the peace is the same as keeping the standard") and the Captain truth replacing it. One sentence. No cushioning.
- breakdown: (1) Root cause — clarity, strategy, or obstacle gap? (2) The specific story making avoidance feel rational. (3) What that story is costing — credibility, results, team trust — concretely.
- script: 5-part execution script:
  OPENING: Name the topic, state the goal, ask permission. "I want to address [topic]. My goal is [specific outcome]. Is now a good time?" Calm. No apology.
  ISSUE: Two facts they cannot deny. Then the specific behavior — factual, no interpretation. End with: "What is your read on that?"
  IMPACT: Observable, professional impact. No emotional language. "The effect of this has been [specific outcome]. That puts [project/team/result] at risk."
  ASK: Specific, time-bound. "What I need is [specific change] by [timeframe]." Then: "[Pause 3-5 seconds. Say nothing. Let them respond first.]"
  PUSHBACK: Firm, non-conceding. "I hear you. This still needs to be resolved. What would need to happen to move this forward?"
- sections: State Set (anchor, pace, position, timing, setting), Script Variations (softer / stronger alternatives), Tactical Delivery (when/where/pace/silence), Standard Setter (3 actions within 48 hours)
- nextSteps: Schedule within 48 hours. Read State Set before entering. Open with the exact first line — do not improvise it.

─── INDIRECT_INFLUENCE ────────────────────────────────

NOT softer DIRECT_CONVERSATION. No scripts. No confrontation. No "speak early" or "get airtime."
IS: Perception management, positioning, ally-building. Strategic and calm.

- script: null
- sections: Strategic Positioning (who matters, perception gap, invisible value, positioning shift), Influence Moves (4 moves: pre-wire, ally, narrative, evidence moment), Visibility Actions (3 places to show up differently this week + what NOT to do)
- nextSteps: Three moves this week in order: pre-wire, visibility, ally.

─── STRATEGIC_CONTAINMENT ─────────────────────────────

NOT passive waiting. NOT confrontation. IS deliberate position-building and leverage creation.
No participation advice. No visibility through assertiveness.

- script: null
- sections: Standard Definition (behavior, standard, gap — the anchor for every move), Control Moves (document, perform, hold, protect — in priority order), Timing Decision (hold while / act when / escalation path / set a date)
- nextSteps: Three position-building actions this week: document, perform, protect.

═══════════════════════════════════════════════════════
ROLE: PASSENGER → Activate: CAPTAIN (ownership, direction, action)
═══════════════════════════════════════════════════════

The person is in Passenger mode — waiting for external permission, recognition, or clarity that will not arrive. Career clarity has three root causes: not knowing what they want, not knowing how to get there, or something/someone standing in the way. Diagnose which one is present before prescribing.

The goal is Captain activation: full ownership of direction, deliberate action that generates real information, and momentum through movement not analysis.

Do NOT suggest journalling or asking others for validation. Every action must put the user in a position of choosing and moving.

IF scenario is "I Feel Stuck in My Career":

- reframe: Name what they have been waiting for (external permission, the right moment, someone else to move first) and the Captain truth replacing it. One sentence.
- breakdown: (1) Root cause — clarity gap (don't know what they want), strategy gap (know what they want but not how to move), or obstacle (person/structure in the way)? (2) The specific story making waiting feel smarter than choosing. (3) What this story has cost — time, opportunity, missed conversations — concretely.
- script: null
- sections:
  Clarity Map (synthesize what they are optimising for across work type, environment, growth, people, and impact — close with a direct verdict on the pattern their answers reveal)
  Direction Options (for each direction they selected: what it demands day-to-day in 2 sentences, the first conversation that validates or eliminates it within 2 weeks, and a match verdict — strong/partial/misalignment — with one sentence on why)
  Outreach Scripts (premium — for each contact they identified: the exact message adapted to their relationship; plus 2 specific validation questions to ask in the conversation)
  Follow-Up Strategy (premium — 3 actions within 48 hours of each conversation: synthesize, send follow-up, update direction verdict)
  Momentum Loop (what progress looks like in 7 days: the success cycle, what counts as a win, what to track, and the re-entry point when momentum stalls)
- nextSteps: 3 commands for the next 48 hours — specific, verb-led, include exact first message to send.

IF scenario is NOT "I Feel Stuck in My Career" (general Passenger/Captain activation):

- reframe: Name the specific external thing they have been waiting for and the Captain truth that replaces waiting with choosing.
- breakdown: (1) Clarity, strategy, or obstacle? (2) The story making passivity feel safe. (3) What this story has cost concretely.
- script: null
- sections: Ownership Shift (3 actions replacing passive behaviors with active ones — verb, target, timeframe), External Move (one non-negotiable move within 48 hours — who, what to say/send, what signal it generates), Direction Lock (the specific direction to test for 30 days — what it produces, what ends the test), Momentum Loop (cycle, weekly win definition, re-entry point)
- nextSteps: 3 direct commands — verb-led, time-bound, no qualifiers.

═══════════════════════════════════════════════════════
ROLE: OVERWHELMED → Activate: CAPTAIN via Pattern Interrupt
═══════════════════════════════════════════════════════

Paralysis from volume, self-doubt, or mental overload — not direction confusion. The goal is to interrupt the overthinking pattern through immediate, small, external actions. Each under 15 minutes. No planning. No analysis. Movement first.

The Passenger pattern here: more thinking will create clarity. The Captain truth: one action produces more clarity than any amount of analysis.

Do NOT suggest planning, journalling, or long-term strategy.

- reframe: Name the Passenger belief driving the spiral (e.g., "More thinking will create clarity" or "I need to get everything right before I move") and the Captain truth replacing it. One sentence.
- breakdown: (1) Clarity problem (genuinely don't know what to prioritize), volume problem (too much has accumulated), or belief spiral (overthinking used as protection against being wrong)? (2) The specific story driving the spiral — name it as a pattern, not a symptom. (3) What this spiral is costing — missed work, missed decisions, lost credibility — concretely.
- script: null
- sections:
  Pattern Interrupt (one action, now, under 5 minutes, tangible output — what to do, what it produces, why it breaks the pattern)
  Momentum List (3 tasks under 15 minutes each with visible outputs — sequence, not a list)
  Back Online (two decisions: today and tomorrow — no planning beyond 48 hours)
  Momentum Loop (the cycle, what counts as a win today, re-entry point when stalling)
- nextSteps: 3 commands — do Pattern Interrupt now, finish task 1 before midday, make Decision 1 before end of day.

═══════════════════════════════════════════════════════
OUTPUT FORMAT — Raw JSON only. No markdown. No code fences.
═══════════════════════════════════════════════════════

All responses must include: mode, trigger (object), roleShift, behavioralObjective, identityAnchor, closingQuestion.

problemType must use: "AVOIDING_CHALLENGER", "PASSENGER", or "OVERWHELMED"

{
  "problemType": "AVOIDING_CHALLENGER" | "PASSENGER" | "OVERWHELMED",
  "strategy": "DIRECT_CONVERSATION" | "INDIRECT_INFLUENCE" | "STRATEGIC_CONTAINMENT" | null,
  "mode": "Challenger" | "Coach" | "Strategist",
  "roleShift": "Passenger pattern → Captain behavior",
  "behavioralObjective": "...",
  "reframe": "...",
  "breakdown": "...",
  "trigger": { "triggerName": "...", "energyShift": "...", "repetitionStatement": "..." },
  "identityAnchor": "...",
  "script": { "opening": "...", "issue": "...", "impact": "...", "ask": "...", "pushback": "..." } | null,
  "sections": [ { "title": "...", "content": "...", "premium": false } ],
  "nextSteps": ["..."],
  "closingQuestion": "..."
}`;

const MINDSET_PROMPT = `You are an elite coach for professional women. Your only job right now is to shift this person from Passenger to Captain. Output raw JSON only. No markdown. No code fences.

${STYLE_RULES}

THE WORK — DO THIS IN THIS EXACT ORDER:

1. NAME THE PASSENGER PATTERN
The person is in one of these three states. Identify which one from their answers:

VICTIM PASSENGER: "This is happening TO me. The situation, the person, or the organisation is the problem."
Signals: feels undervalued, overlooked, treated unfairly, blaming external factors.

SELF-DOUBT PASSENGER: "I am not good enough. This proves it."
Signals: doubts abilities, fear of being exposed, treating one event as permanent proof of inadequacy.

COMPARISON PASSENGER: "They are ahead of me. I am behind. I am failing."
Signals: comparing to others, watching someone else succeed and feeling diminished by it.

Name which pattern in the breakdown. Be specific and direct.

2. SEPARATE STORY FROM FACT
Beliefs and thoughts are patterns, not facts. The person is treating a story as a fact.
NAME the story precisely: what are they telling themselves?
NAME the fact: what actually happened — one specific event, stripped of all interpretation?
The story is a construction. The fact is just data. This contrast IS the reframe.

Example:
Story: "This setback proves I am not progressing and never will."
Fact: "One difficult event happened. That is all the data there is."

3. REPLACE THE STORY WITH THE SHARPER TRUTH
Energy precedes presence. The person cannot act from a degraded energy state. State management comes before action. Physical reset before language.
Give them one sharp truth that replaces the Passenger story. Not comfort. Not validation. The sharper reality.

Use one of these or create one in this spirit:
- It is not my conditions, it is my response to them that shapes my career
- This moment is data. I decide what it means.
- Adversity is where my best self shows up
- I stop waiting to be chosen. I choose to be the Captain of my career.
- Perfection is protection. I do not need protection right now. I need movement.
- The best in me comes out when my back is against the wall.
- One moment does not make a pattern. I decide what comes next.

4. ACTIVATE THE CAPTAIN THROUGH CHOICE
The only way out is CHOICE — not analysis, not planning, not waiting for certainty.
The Captain does not wait to feel ready. The Captain chooses a response and acts.
7% of impact is words. 38% is tonality. 55% is energy. Reset the state FIRST, then act.
Give them one physical energy reset, then one Captain choice to make RIGHT NOW.
The choice must be executable in the next 15 minutes and produce something visible.

5. REWIRE WITH REPETITION
Identity statements said 22 times aloud interrupt the Passenger neural pattern.
This is not motivation — it is neurological pattern interruption through repetition.
The statement must be present tense Captain identity, credible, specific to their Passenger pattern, under 10 words.

OUTPUT RULES:

roleShift: LEFT = their exact Passenger pattern right now. RIGHT = the Captain choice they are making. Max 5 words each side. Real words.
Good: "Treating setback as permanent proof → Using data to move forward"
Good: "Measuring worth against others progress → Choosing my own measure"
Bad: "Feeling stuck → Taking action"

reframe: ONE sentence. Story vs Fact. Under 15 words. Should land like a punch.
Good: "That story is constructed. One moment is data — not a verdict."

breakdown: TWO sentences. Sentence 1: name the exact Passenger pattern and the specific story. Sentence 2: name the fact stripped of interpretation and the Captain choice now available.

Interrupt section: TWO sentences. Name the exact Passenger story and expose it as constructed interpretation not fact. Specific to their trigger and pattern. NOT generic.
For SELF-DOUBT: "You are treating [specific event] as proof of [specific negative belief]. That is a story — not a fact about your trajectory."
For COMPARISON: "You are treating [person or situation]'s progress as a verdict on yours. Those are two different stories in two different careers."
For VICTIM: "You are treating [situation] as something happening TO you. The Captain question is: what is your response?"

Direct section: TWO Captain actions executable in under 15 minutes each producing a visible output. Verb first. Specific to their situation.

RESPOND WITH EXACTLY THIS JSON:

{
  "problemType": "OVERWHELMED",
  "strategy": null,
  "mode": "Coach",
  "roleShift": "their exact Passenger pattern — Captain choice they are making. Real words.",
  "behavioralObjective": "one specific Captain action in the next 30 minutes. Verb first.",
  "reframe": "one sentence — story vs fact, Captain truth replacing Passenger story. Under 15 words.",
  "breakdown": "two sentences — Passenger pattern named, then fact and Captain choice available.",
  "trigger": {
    "triggerName": "the specific Passenger story driving this state — 5 to 8 words",
    "energyShift": "physical state reset — stand, move, breathe. Verb first. 1-2 sentences.",
    "repetitionStatement": "Captain identity present tense credible under 10 words specific to their pattern"
  },
  "identityAnchor": "You are someone who [specific Captain behavioral shift]. Under 12 words.",
  "script": null,
  "sections": [
    {
      "title": "Interrupt",
      "premium": false,
      "content": "Two sharp sentences exposing the Passenger story as constructed not factual. Specific to their trigger and pattern using the templates above."
    },
    {
      "title": "Direct",
      "premium": false,
      "content": "Two Captain actions under 15 minutes each with visible output. Verb first. Specific to their situation.\n\n1. exact action\n2. exact action"
    },
    {
      "title": "Power Questions",
      "premium": true,
      "content": "Two short questions under 10 words each. Force Captain choice not reflection.\n\n1. question that strips the story\n2. question that forces the Captain choice now"
    }
  ],
  "nextSteps": ["Two Captain commands:\n1. Energy reset: [specific physical action] then say [repetitionStatement] 22 times aloud before anything else.\n2. [First Direct action — name it exactly. Execute now.]"],
  "closingQuestion": "one sentence forcing Captain choice right now. Under 12 words. Specific."
}`;

const SPEAK_UP_PROMPT = `You are an elite coach for professional women. Generate real-time meeting execution coaching. Output raw JSON only — no markdown, no code fences.

${STYLE_RULES}

PATTERN CONSISTENCY — APPLY TO EVERY FIELD:
Every field must describe the SAME specific silence pattern. Identify the user's exact mechanism — what stops them from speaking — then carry it through every field. Reframe, breakdown, trigger, lines, and nextSteps must all address the same pattern.

HARD CONSTRAINTS:
- All coaching lives in the room. No "talk to your manager" or "schedule a debrief."
- NO permission-asking language: no "sorry to interrupt," "I just wanted to."
- NO self-justification: no "I've been thinking about," "I wanted to clarify."
- nextSteps are commands. Verb first. One sentence each.
- Calm is a competitive advantage. Energy before language.

Generate EXACTLY this JSON:

{
  "problemType": "AVOIDING_CHALLENGER",
  "strategy": "DIRECT_CONVERSATION",
  "mode": "Challenger",
  "roleShift": "<their specific silence pattern → active contribution. Max 6 words each side. Actual text.>",
  "behavioralObjective": "<one sentence: speak up once in their specific meeting type within 24 hours.>",
  "reframe": "<one sentence. The story keeping them quiet vs the sharper truth. Under 20 words.>",
  "breakdown": "<three sentences. 1: root of this specific silence pattern. 2: the internal story making silence feel rational. 3: the concrete cost in that room.>",
  "trigger": {
    "triggerName": "<the specific moment of hesitation right before they would speak — 6-10 words>",
    "energyShift": "<physical reset before speaking — starts with a verb, concrete, 1-2 sentences>",
    "repetitionStatement": "<who they are in the room — Captain identity, present tense, under 10 words>"
  },
  "identityAnchor": "<You are someone who [specific behavioral change in the meeting].>",
  "script": null,
  "sections": [
    {
      "title": "Your Lines",
      "premium": true,
      "content": "<Personalised to their meeting type and silence pattern.\n\nLine 1 — Direct entry:\n'[Observation or position. Direct. No setup. 1 sentence.]'\n\nLine 2 — Build on what is said:\n'[Adds to the conversation. Starts with Building on that or The other angle here is. 1 sentence.]'\n\nLine 3 — Focused question:\n'[Sharp, specific question — signals strategic thinking. Not open-ended.]'\n\nWhen the moment has passed:\n'[Re-entry line — goes back to a specific point, direct, no apology.]'>"
    }
  ],
  "nextSteps": ["<Three commands:\n1. [Before — write one contribution down now: what to prepare before the meeting]\n2. [First 10 minutes — the exact move: when to speak and what to lead with]\n3. [After speaking — what to do in the next 30 seconds: anchor the moment, do not explain or soften]>"],
  "closingQuestion": "<one sentence — specific to their silence pattern, creates productive discomfort>"
}`;

const EXECUTIVE_VISIBILITY_PROMPT = `You are an elite strategic communication coach for professional women. Generate executive positioning coaching. Output raw JSON only — no markdown, no code fences.

${STYLE_RULES}

FRAMEWORK APPLIED SILENTLY:
- Leadership is making the people above you confident in your direction and capable of acting on it — not just aware of your output.
- The goal is not to be seen doing work. The goal is to be understood as someone who creates outcomes.
- Task language describes effort. Impact language describes value. Executives evaluate value.
- Visibility is a communication strategy, not a personality trait.

HARD CONSTRAINTS:
- This is strategic communication coaching, not behavioral coaching.
- NEVER give meeting timing advice or "speak early" instructions.
- All coaching is about positioning, language, and framing — not in-room behavior.
- nextSteps are communication and framing actions.

Generate EXACTLY this JSON:

{
  "problemType": "PASSENGER",
  "strategy": null,
  "mode": "Coach",
  "roleShift": "<task/effort framing pattern → outcome/impact framing behavior. Max 6 words each side. Actual text.>",
  "behavioralObjective": "<one sentence: a specific communication action within 48 hours. Name the exact format and audience.>",
  "reframe": "<one sentence. The Passenger belief keeping them invisible vs the Captain truth about how leaders communicate impact. Under 20 words.>",
  "breakdown": "<three sentences. 1: the root of the positioning gap — language, strategy, or habit? 2: the internal logic making task-level framing feel complete. 3: what invisible work has cost them — credibility, recognition, opportunity — concretely.>",
  "trigger": {
    "triggerName": "<the specific doubt stopping them from owning their impact — 6-10 words>",
    "energyShift": "<mental reset before communicating their work — starts with a verb, concrete, 1-2 sentences>",
    "repetitionStatement": "<Captain identity, present tense, under 10 words>"
  },
  "identityAnchor": "<You are someone who [specific communication shift].>",
  "script": null,
  "sections": [
    {
      "title": "Task to Impact",
      "premium": false,
      "content": "<Three personalised translations from task language to business impact framing — specific to their role, work type, and positioning gap.\n\nInstead of: '[task-level phrase from their situation]'\nSay: '[business-impact version — what it delivered, what it means for the business]'\n\nInstead of: '[second task-level pattern]'\nSay: '[business-impact version]'\n\nInstead of: '[third task-level pattern]'\nSay: '[business-impact version]'\n\nYour positioning sentence: [What you delivered] + [business outcome] + [what it makes possible]. One sentence. Write it now.>"
    }
  ],
  "nextSteps": ["<Three strategic communication actions:\n1. [Reframe one existing piece of work into a business impact statement — name the specific work and format]\n2. [Draft one positioning sentence about your most recent deliverable]\n3. [Send or share something proactively this week — name who, what format, and the single impact statement to lead with]>"],
  "closingQuestion": "<one sentence — specific to their positioning gap, creates productive discomfort>"
}`;

const CONVERSATION_PROMPT = `You are an elite coach for professional women. Generate tough conversation coaching. Output raw JSON only — no markdown, no code fences.

${STYLE_RULES}

FRAME CONSISTENCY — APPLY TO EVERY FIELD:
Identify the single core issue from the user's answers. Establish one clear frame in the reframe field. Every script field must be a different step in the SAME conversation about that SAME issue.

CONVERSATION CONTROL PRINCIPLES (applied silently):
- Topic, Goal, Permission: name the topic, state the goal, ask if now is a good time. This gives the other party a small yes before the main conversation and creates psychological control of the opening.
- Calm is a competitive advantage. Slower pace signals authority more than louder volume.
- Silence after the ask. The first person to fill the silence loses positioning.
- Build agreement before the ask: two facts they cannot deny before naming the issue.
- Calibrated questions create insight without accusation.

Generate EXACTLY this JSON:

{
  "problemType": "AVOIDING_CHALLENGER",
  "strategy": "DIRECT_CONVERSATION",
  "mode": "Challenger",
  "roleShift": "<current avoidance pattern → active challenger behavior. Max 6 words each side. Actual text.>",
  "behavioralObjective": "<have this exact conversation with [who] within [24 or 48 hours].>",
  "reframe": "<one sentence — the Passenger story making avoidance feel rational, then the Captain truth. Under 20 words.>",
  "breakdown": "<sentence 1: root cause. Sentence 2: the specific story making delay feel rational. Sentence 3: what the delay is costing concretely.>",
  "trigger": {
    "triggerName": "<specific fear driving avoidance of this conversation — 6-10 words>",
    "energyShift": "<physical reset before the conversation — starts with a verb, concrete, 1-2 sentences>",
    "repetitionStatement": "<Captain identity, present tense, under 10 words>"
  },
  "identityAnchor": "<You are someone who [specific behavioral shift].>",
  "script": {
    "opening": "<Topic, goal, permission. 'I want to address [topic]. My goal is [specific outcome]. Is now a good time?' Adapt to their specific topic and relationship. Calm. No apology.>",
    "issue": "<Two undeniable facts. Then the specific behavior — factual, no interpretation. 'What is your read on that?'>",
    "impact": "<Observable, professional impact. No emotional language. One sentence on what is at risk.>",
    "ask": "<Specific change, specific timeframe. Direct. End with: [Pause. Say nothing. Let them respond first.]>",
    "pushback": null
  },
  "sections": [],
  "nextSteps": ["<Three commands. Numbered. Verb-led. Time-bound. 1: prepare before. 2: name the day. 3: what to do immediately after.>"],
  "closingQuestion": "<one sentence — present tense, specific to their conflict, productive discomfort>"
}`;

const NEGOTIATE_PROMPT_SHARED_SUFFIX = `
Generate EXACTLY this JSON. Output "sections" as an empty array and "nextSteps" as ["placeholder"] — filled server-side. Personalise every field. Keep the frame consistent across ALL fields.

{
  "problemType": "AVOIDING_CHALLENGER",
  "strategy": "DIRECT_CONVERSATION",
  "mode": "Challenger",
  "roleShift": "<current avoidance or softening pattern → direct ask behavior. Max 6 words each side. Actual text.>",
  "behavioralObjective": "Have the compensation conversation with [specific person from their answers] within 48 hours.",
  "reframe": "<one sentence — the Passenger belief keeping them from asking, then the Captain truth. Under 20 words.>",
  "breakdown": "<sentence 1: root cause. Sentence 2: the specific story making delay feel rational. Sentence 3: what the delay has cost in concrete monetary or opportunity terms.>",
  "trigger": {
    "triggerName": "<specific fear driving avoidance — 6-10 words>",
    "energyShift": "<physical reset before the conversation — starts with a verb, concrete, 1-2 sentences>",
    "repetitionStatement": "<Captain identity, present tense, under 10 words>"
  },
  "identityAnchor": "<one sentence — who they are in this conversation. Credible, not inspirational.>",
  "script": {
    "opening": "<personalised opening for their specific situation>",
    "issue": "<personalised issue statement using evidence from their answers>",
    "impact": "<personalised impact line — one sentence>",
    "ask": "<their specific target or range. Direct. End with: [Pause. Stop talking. Do not explain. Let them respond first.]>",
    "pushback": "<acknowledge calmly, re-anchor to evidence, calibrated question: 'What would need to happen for this to be possible?' Hold silence. If stalling: turn delay into written criteria and a date.>"
  },
  "sections": [],
  "nextSteps": ["placeholder"],
  "closingQuestion": "<one sentence — specific to their negotiation, present tense, productive discomfort>"
}`;

function getNegotiatePrompt(situationType: string): string {
  const base = `You are an elite coach for professional women. Generate negotiation coaching. Output raw JSON only — no markdown, no code fences.

${STYLE_RULES}

NEGOTIATION PRINCIPLES (applied silently, never named):
- Know your target, your acceptable range, and your walk-away point before any conversation.
- The first number said becomes the anchor. Name your number — do not ask what they think is fair.
- Silence after the ask is leverage. Do not fill it.
- Labeling: name what you observe without accusation. "It sounds like budget is the constraint."
- Mirroring: repeat the last 2-3 words as a question. "Budget is tight?" Creates elaboration without asking directly.
- Calibrated questions create movement without confrontation. "What would need to happen for this to be possible?"
- Never leave without a specific next step. Vague commitments compound the problem.
- Value proof before the ask. Facts, scope, outcomes — not effort, loyalty, or time served.`;

  if (situationType === "I believe I am underpaid") {
    return `${base}

SITUATION: Currently employed. Believes pay is below market rate. This is a MARKET ALIGNMENT conversation — not a performance review.

FRAME: The compensation is out of step with the market. The argument is market data, not personal contribution or emotion.

ALL FIELDS MUST use market-rate framing:
- reframe: Asking is risky vs. staying silent compounds a real financial loss. Market language only.
- breakdown: No market anchor, treating it as performance conversation (wrong frame), real money left uncollected month after month.
- script: "I have been looking at market data for my role and level. I would like to talk about how my compensation compares. Is now a good time?" Issue = market data. Ask = specific figure. Pushback = re-anchor to market data, not personal effort.
- DO NOT mention effort, loyalty, or years of service as the primary argument.
${NEGOTIATE_PROMPT_SHARED_SUFFIX}`;
  }

  if (situationType === "My role has grown") {
    return `${base}

SITUATION: Currently employed. Responsibilities have expanded materially. Doing a bigger job for the same pay.

FRAME: The role changed; the compensation did not. Scope evolution is the argument.

ALL FIELDS MUST use scope-evolution framing:
- reframe: Work will speak for itself vs. the gap must be named explicitly or it stays invisible.
- breakdown: No explicit link drawn between scope change and pay, assuming manager already sees the expanded scope, months of expanded work at the original rate.
- script: "My role and what I am delivering has expanded significantly since my compensation was last set. I would like to talk about how it reflects that." Issue = specific scope changes. Ask = specific figure. Pushback = re-anchor to scope evidence.
${NEGOTIATE_PROMPT_SHARED_SUFFIX}`;
  }

  return `${base}

SITUATION: Has received a job offer. Has not accepted yet. This is the full-leverage window.

FRAME: Anchoring and timing. The first number agreed to becomes the baseline for every future raise. Move before accepting — this window closes the moment they say yes.

ALL FIELDS MUST use offer-negotiation framing:
- reframe: Negotiating will seem greedy or risk the offer vs. this is the only full-leverage moment and they are expected to negotiate.
- breakdown: Strategy gap (don't know how to counter without seeming difficult), treating the offer as final, every future raise compounds from an underpinned baseline.
- script: "Thank you for the offer — I am genuinely excited about this role. Before I respond formally, I would like to discuss the compensation. Is now a good time?" Issue = market and value. Ask = specific figure. Pushback = if base is not flexible, ask what else is on the table.
${NEGOTIATE_PROMPT_SHARED_SUFFIX}`;
}

router.post("/coaching/evaluate", async (req, res) => {
  const { flowType, answers } = req.body as {
    flowType: string;
    answers: Record<string, string | string[]>;
  };
  if (!flowType || !answers) {
    res.status(400).json({ error: "Missing flowType or answers" });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 800,
      messages: [
        { role: "system", content: EVALUATE_PROMPT },
        { role: "user", content: buildUserPrompt(flowType, answers) },
      ],
    });

    const raw = (completion.choices[0]?.message?.content ?? "{}").trim();
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(stripped);
    } catch {
      parsed = {
        problemType: "AVOIDING_CHALLENGER",
        recommendedStrategy: "DIRECT_CONVERSATION",
        assessment: {
          DIRECT_CONVERSATION: "Naming the issue directly gives you the clearest signal on how to move forward.",
          INDIRECT_INFLUENCE: "Shifting perception and building leverage is a higher-return move than direct confrontation here.",
          STRATEGIC_CONTAINMENT: "Protecting your position and managing risk is the priority before any direct action.",
        },
        options: [
          { type: "DIRECT_CONVERSATION", label: "Challenge it directly" },
          { type: "INDIRECT_INFLUENCE", label: "Shift the dynamic through influence" },
          { type: "STRATEGIC_CONTAINMENT", label: "Hold the standard while managing risk" },
        ],
      };
    }

    // Normalise PASSENGER → AVOIDING_CHALLENGER for the strategy picker screen
    // The UI uses AVOIDING_CHALLENGER internally; PASSENGER is the new user-facing label
    if (parsed.problemType === "PASSENGER") {
      parsed.problemType = "VICTIM";
    }
    if (parsed.problemType === "OVERWHELMED") {
      parsed.problemType = "OVERWHELMED";
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "OpenAI evaluate error");
    res.status(500).json({ error: "Failed to evaluate" });
  }
});

router.post("/coaching/generate", async (req, res) => {
  const { flowType, answers, problemType, strategy } = req.body as {
    flowType: string;
    answers: Record<string, string | string[]>;
    problemType: string;
    strategy: string | null;
  };

  if (!flowType || !answers || !problemType) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const isNegotiate = flowType === "negotiate";
  const isConversation = flowType === "conversation" && strategy === "DIRECT_CONVERSATION";
  const isSpeakUp = flowType === "speak_up";
  const isExecutiveVisibility = flowType === "executive_visibility";
  const isMindset = flowType === "mindset";

  const situationType = isNegotiate
    ? ((answers["situation_type"] as string | undefined) ?? "Starting a new role")
    : null;

  const systemPrompt = isNegotiate
    ? getNegotiatePrompt(situationType ?? "Starting a new role")
    : isConversation
    ? CONVERSATION_PROMPT
    : isSpeakUp
    ? SPEAK_UP_PROMPT
    : isExecutiveVisibility
    ? EXECUTIVE_VISIBILITY_PROMPT
    : isMindset
    ? MINDSET_PROMPT
    : GENERATE_PROMPT;

  const context = strategy
    ? `Behavioral pattern: ${problemType}\nStrategy chosen: ${strategy}`
    : `Behavioral pattern: ${problemType}`;

  const userPrompt = isNegotiate || isConversation || isSpeakUp || isExecutiveVisibility || isMindset
    ? buildUserPrompt(flowType, answers)
    : `${context}\n\n${buildUserPrompt(flowType, answers)}\n\nGenerate coaching that activates the Captain pattern for this behavioral role and strategy.`;

  console.log("SENDING TO AI - flowType:", flowType, "promptLength:", systemPrompt.length, "userPrompt:", JSON.stringify(buildUserPrompt(flowType, answers)));
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 6000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = (completion.choices[0]?.message?.content ?? "{}").trim();
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(stripped);
      console.log("MINDSET parsed sections:", isMindset ? JSON.stringify(parsed.sections) : "not mindset");
    } catch {
      console.log("JSON PARSE FAILED for flowType:", flowType);
      console.log("RAW AI RESPONSE:", raw.substring(0, 500));
      parsed = buildFallback(problemType, strategy);
    }

    // Normalise PASSENGER to VICTIM for UI compatibility
    if (parsed.problemType === "PASSENGER") {
      parsed.problemType = "VICTIM";
    }

    if (isNegotiate) {
      parsed = enforceNegotiateSections(parsed, answers);
    } else if (isConversation) {
      parsed = enforceConversationSections(parsed);
    } else if (isSpeakUp) {
      parsed = enforceSpeakUpSections(parsed);
    } else if (isExecutiveVisibility) {
      parsed = enforceExecutiveVisibilitySections(parsed);
    } else if (isMindset) {
      parsed = enforceMindsetSections(parsed);
    }

    if (strategy && !isNegotiate) {
      parsed.strategy = strategy;
      if (strategy === "INDIRECT_INFLUENCE" || strategy === "STRATEGIC_CONTAINMENT") {
        parsed.mode = "Strategist";
      } else if (strategy === "DIRECT_CONVERSATION") {
        parsed.mode = "Challenger";
      }
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "OpenAI generate error");
    res.status(500).json({ error: "Failed to generate coaching" });
  }
});

function enforceMindsetSections(parsed: Record<string, unknown>) {
  const aiSections = (parsed.sections as { title: string; premium: boolean; content: string }[] | undefined) ?? [];
  if (aiSections.length >= 2) {
    return {
      ...parsed,
      script: null,
      sections: aiSections.map((s) => ({
        ...s,
        premium: s.title === "Power Questions" ? true : false,
      })),
    };
  }
  return { ...parsed, script: null, sections: aiSections };
}

function enforceSpeakUpSections(parsed: Record<string, unknown>) {
  const aiSections = (parsed.sections as { title: string; premium: boolean; content: string }[] | undefined) ?? [];
  const yourLines = aiSections.find((s) => s.title === "Your Lines") ?? {
    title: "Your Lines",
    premium: true,
    content: "Line 1: 'The angle I would add here is [observation]. That changes how we should approach [specific decision].'\n\nLine 2: 'Building on that — the implication for [topic] is [specific point].'\n\nLine 3: 'What is driving [specific assumption]? I want to make sure we are solving the right problem.'\n\nWhen the moment has passed:\n'Going back to [topic] — I want to add something.' Then say it. No apology.",
  };

  return {
    ...parsed,
    script: null,
    sections: [
      {
        title: "Before You Walk In",
        premium: false,
        content: "Write one sentence before the meeting starts.\n\nNot an outline. One contribution — an observation, a question, or a position you are ready to say out loud.\n\nWrite it. Say it out loud. You are not going to compose it in the room — you are going to deliver it.",
      },
      {
        title: "Get In Early",
        premium: false,
        content: "Speak in the first 10 minutes.\n\nThis is a timing strategy, not a motivation exercise. Once you have spoken once, the cost of speaking again drops significantly. Once you have stayed quiet for 20 minutes, breaking the silence costs much more.\n\nYou do not need a perfect point. You need to be in the conversation before it locks.",
      },
      {
        title: "The Two-Sentence Rule",
        premium: false,
        content: "Say one thing. Two sentences maximum. Then stop.\n\nYour observation or position — one sentence. What it means or what you recommend — one sentence. That is it.\n\nDo not add context. Do not soften. Do not explain. Longer contributions dilute the point.",
      },
      yourLines,
    ],
  };
}

function enforceExecutiveVisibilitySections(parsed: Record<string, unknown>) {
  const aiSections = (parsed.sections as { title: string; premium: boolean; content: string }[] | undefined) ?? [];
  const taskImpactSection = aiSections.find((s) => s.title === "Task to Impact") ?? {
    title: "Task to Impact",
    premium: false,
    content: "Instead of: 'I managed the Q3 reporting process'\nSay: 'Q3 reporting landed on time and surfaced a budget risk — finance has a decision to make by Friday'\n\nInstead of: 'I ran the team onboarding'\nSay: 'New hire ramp time dropped — the team is productive two weeks faster'\n\nInstead of: 'I completed the stakeholder review'\nSay: 'The stakeholder review confirmed alignment — it removes the blocker on the next phase'\n\nYour positioning sentence: [What you delivered] + [business outcome] + [what it makes possible]. One sentence. Write it now.",
  };

  return {
    ...parsed,
    script: null,
    sections: [
      taskImpactSection,
      {
        title: "Executive Frames",
        premium: false,
        content: "Five templates for communicating work at the executive level:\n\n1. Outcome + implication\n'[Deliverable] produced [result]. The implication for [area] is [one sentence].'\n\n2. What this enables\n'[Work] unlocks [specific opportunity]. What is now possible: [one sentence].'\n\n3. Risk surfaced\n'[Work] identified [specific risk]. Recommendation: [action] by [timeframe].'\n\n4. Conclusion first\n'The answer is [conclusion]. We got there by [one sentence]. Next step: [specific ask].'\n\n5. The business case\n'[Project] is [one-sentence case]. The decision needed: [specific ask].'\n\nAll five follow the same rule: conclusion first, context second, ask last.",
      },
      {
        title: "The Standard",
        premium: true,
        content: "Executives are not evaluating your effort. They are evaluating your judgment.\n\nClarity signals confidence. Detail signals execution. Direction signals leadership.\n\nLead with the conclusion, not the context. State what you recommend, not just what you found. Name what you need — a decision, a resource, a signal.\n\nWhen you walk through your process to reach a conclusion, you are read as an executor. When you open with the conclusion and name the implication, you are read as a strategist.\n\nThe way you communicate your work is the first data point leaders use to assess your level.",
      },
    ],
  };
}

function enforceConversationSections(parsed: Record<string, unknown>) {
  if (parsed.script && typeof parsed.script === "object") {
    (parsed.script as Record<string, unknown>).pushback = null;
  }
  return {
    ...parsed,
    strategy: "DIRECT_CONVERSATION",
    sections: [
      {
        title: "Internal Clarity",
        premium: false,
        content: "Before entering the conversation, write down three things:\n\n1. What do I actually want to change? Be specific — not 'better communication' but the exact behavior that needs to stop or start.\n2. What impact is this having on my work or results? One sentence. Measurable where possible.\n3. What is my boundary if this continues? Name the specific action you will take — who you will speak to and when.\n\nDo not enter the conversation to express frustration. Enter to create a shift.",
      },
      {
        title: "Handle Pushback",
        premium: false,
        content: "Three responses — use the one that fits:\n\nIf they get defensive:\n'I hear that. That is not my intention — I want us to work better together. How do we move forward from here?'\n\nIf they minimise:\n'I understand it may not seem significant, but it is affecting my ability to deliver at my best.'\n\nIf they deflect:\n'That may be true as well. For now, I would like to stay focused on this specific point.'",
      },
      {
        title: "Discipline",
        premium: true,
        content: "Three rules for the room:\n\nDo not over-explain.\nDo not fill silence.\nDo not rescue the conversation.\n\nSilence creates pressure. Let it work for you. The Captain who speaks less in this moment holds more.",
      },
    ],
  };
}

function enforceNegotiateSections(
  parsed: Record<string, unknown>,
  answers: Record<string, string | string[]>,
) {
  const situationType = (answers["situation_type"] as string | undefined) ?? "";
  const target = (answers["target"] as string | undefined) ?? "";
  const leverage = (answers["leverage"] as string | undefined) ?? "";

  let identityAnchor: string;
  let nextSteps: string[];
  let sections: { title: string; premium: boolean; content: string }[];

  if (situationType === "My role has grown") {
    identityAnchor = "You lead with results, not requests — and you do not leave the room without a commitment.";
    nextSteps = [
      "Five actions before the conversation:\n1. Write down 3-5 specific scope changes since your last compensation review — one sentence each, measurable.\n2. Attach a concrete outcome to each change: revenue, efficiency, team impact, risk reduced.\n3. Decide your target number and your floor. Write both down before the conversation.\n4. Prepare your opening line and say it aloud — not in your head.\n5. Schedule the conversation within 48 hours — name the day, not 'soon.'",
    ];
    sections = [
      {
        title: "Your Value Case",
        premium: false,
        content: "Before you name a number, build the case.\n\nScope changes: List every responsibility you have taken on since your compensation was last set. One sentence each. Be specific — not 'I took on more' but 'I now own X, Y, and Z which were previously split across two roles.'\nOutcomes: Attach a result to each change. Revenue driven, costs reduced, team performance, risk managed.\nBaseline: Know when your compensation was last set and what your role looked like then. That gap is the argument.\n\nDo not enter this conversation without these three things written down.",
      },
      {
        title: "Lead with Contribution",
        premium: false,
        content: "Start with results — not with what you want.\n\n1. Frame: 'My role has expanded significantly. I would like to walk you through what it looks like now — and then talk about compensation.'\n2. Scope: Name the specific changes. No hedging. 'I now own X, Y, and Z. That was not the case 18 months ago.'\n3. Outcomes: State what those changes have produced. One sentence per result.\n4. Align: 'I want to make sure my compensation reflects the scope I am actually operating at.'\n5. Ask: Name your number directly.\n6. Pause: Stop talking. Let them respond. Do not fill the silence.",
      },
      {
        title: "Bridge to Compensation",
        premium: false,
        content: "Once you have walked through scope and outcomes, make the direct connection.\n\n'What I have described is materially different from the role I was in when my compensation was last reviewed. I want to make sure what I am paid reflects what I am delivering.'\n\nThen name the number. No preamble. No apology.\n\nIf they need to think: 'Of course. When can we pick this up?' Name a specific date. Do not leave it as 'let us circle back.'",
      },
      {
        title: "If They Resist",
        premium: true,
        content: "If they say budget is tight or timing is not right:\n\n1. Acknowledge without backing down: 'I hear you on timing.' Pause.\n2. Re-anchor: 'The scope and results are real — that is not changing.' Pause.\n3. Ask: 'What would need to be true for us to revisit this?'\n4. Lock criteria: 'So if I deliver X by Y date, we can revisit compensation — can we put that in writing?'\n\nA named date with documented milestones is a commitment. 'Let us revisit soon' is not.",
      },
    ];
  } else if (situationType === "I believe I am underpaid") {
    identityAnchor = "You are not asking for a favour. You are correcting an imbalance — calmly, clearly, and with evidence.";
    nextSteps = [
      "Five actions before the conversation:\n1. Pull 3 market data points for your role, level, and location — specific figures.\n2. Write your target number grounded in that data.\n3. Set your walk-away: the minimum acceptable outcome and what you do if it is not met.\n4. Prepare your opening line word for word. Say it aloud twice.\n5. Schedule the conversation within 48 hours — name the day.",
    ];
    sections = [
      {
        title: "Positioning",
        premium: false,
        content: "Frame this correctly before the conversation — and inside it.\n\nThis is a market alignment conversation, not a performance discussion.\n\nYou are not asking your manager to recognise how hard you work. You are flagging that your compensation is out of step with the market rate for your role and level. Stay on market data. Do not bring in emotion, loyalty, or how long you have been there. Facts hold your position.",
      },
      {
        title: "Opening and Market Reference",
        premium: false,
        content: "'I would like to talk about how my compensation aligns with the market for my role.'\n\nThen: 'Based on market data I have reviewed, my current compensation appears to be below the range for someone at my level.'\n\nThen name your number: 'I would like to get to [figure]. Can we have that conversation?'\n\nThen: Stop. Let them respond. Do not explain. Do not soften. You have made the ask — now listen.",
      },
      {
        title: "Handle Pushback",
        premium: false,
        content: "When they say budget is a factor:\n'I understand budget can be a consideration. What would need to happen to revisit this — and when?'\n\nWhen they stall:\n'Can we define a timeline? I would like a clear date to work toward.'\n\nWhen they say you are already paid fairly:\n'The market data I have seen suggests otherwise. I am happy to share what I am looking at — can we review it together?'\n\nDo not leave without a number, a date, or written criteria.",
      },
      {
        title: "Lock a Timeline",
        premium: true,
        content: "If compensation cannot move now, get a commitment on when and what.\n\n'If the number is not available right now, can we agree on a specific date to revisit — and what I would need to deliver for that to happen?'\n\nThen document it. Send a follow-up email the same day: 'As agreed, we will revisit my compensation on [date]. The criteria we discussed: [list them].'\n\nA verbal agreement without documentation is not an agreement.",
      },
    ];
  } else {
    identityAnchor = "You know your value, you communicate it clearly, and you do not leave conversations without a next step.";
    nextSteps = [
      "Five actions before the conversation:\n1. Research the market range for this role — pull 3 specific data points.\n2. Set your target and your floor. Write both down.\n3. Decide what else is on the table — equity, title, start date, review date, sign-on.\n4. Prepare your opening line and say it aloud.\n5. Reply or schedule the conversation within 24 hours.",
    ];
    sections = [
      {
        title: "Before You Respond",
        premium: false,
        content: "Do not accept or counter an offer without doing this first.\n\nResearch: Pull 3 market data points for this role, level, and location.\nTarget: Decide your number. Not 'higher' — a specific figure. Write it down.\nFloor: Decide the minimum you would accept. Know this before you speak.\nWider package: Identify what else is negotiable — equity, title, sign-on, review timing. Rank them.\n\nStructure buys you calm. Enter without it and you will improvise.",
      },
      {
        title: "Counter the Offer",
        premium: false,
        content: "'Thank you for the offer. I am genuinely excited about the role. I would like to discuss the compensation — based on the market and what I am bringing, I was targeting [your number]. Is there room to move on base?'\n\nThen stop. Do not explain. Do not justify. You have made the ask — hold the silence.\n\nIf they say they need to check: 'Of course — when can we pick this up?' Name a day.",
      },
      {
        title: "Handle We Are at the Top",
        premium: false,
        content: "When they say they are at the top of the range:\n\n1. Acknowledge: 'I appreciate you being direct about that.' Pause.\n2. Re-anchor: 'Based on the market data I have seen, I think there is still room — I would like to land at [figure].'\n3. Alternative: 'Is there flexibility on sign-on, equity, or a 6-month review?'\n\nIf they say no to everything: 'I want to make this work. Let me think about it — can we speak again tomorrow?' You are not obligated to decide on the spot.",
      },
      {
        title: "What Else Is On the Table",
        premium: true,
        content: "If base compensation is fixed, negotiate everything else.\n\nSign-on bonus: Often more flexible than base. 'Is there flexibility on a sign-on to account for what I am leaving behind?'\nEquity: Ask about vesting schedule and cliff. More equity with a shorter cliff can be worth more than a higher base.\nTitle: If the role is scoped above the title, negotiate the title now. It costs them nothing.\nPerformance review: 'Can we agree to review compensation at 6 months based on [specific criteria]?' Get the criteria in writing before you start.",
      },
    ];
  }

  return {
    ...parsed,
    problemType: "AVOIDING_CHALLENGER",
    strategy: "DIRECT_CONVERSATION",
    mode: "Challenger",
    identityAnchor,
    nextSteps,
    sections,
  };
}

function buildFallback(problemType: string, strategy: string | null) {
  return {
    problemType,
    strategy,
    reframe: "Waiting for the right moment is the pattern. The moment is now.",
    breakdown: "The next move is clear. The question is whether you will take it today or keep building the case for why the timing is not right. Every day you wait is a decision — just not the one you intended to make.",
    script: strategy === "DIRECT_CONVERSATION" ? {
      opening: "I want to address something that is affecting my work. Is now a good time?",
      issue: "There is a specific pattern I need to name. Here is what I have observed.",
      impact: "The effect of this on my work and results is real and measurable.",
      ask: "What I need is a specific change, agreed on today. [Pause. Say nothing.]",
      pushback: "I hear you. This still needs to be resolved. What would need to happen to move this forward?",
    } : null,
    sections: [{
      title: "What to Do Now",
      content: "1. Name the highest-leverage action available to you in the next 24 hours.\n2. Execute it before anything else today.\n3. Reassess tomorrow with new information, not the same story.",
      premium: false,
    }],
    nextSteps: ["Identify the one action you have been avoiding. That is your first move. Do it before anything else today."],
  };
}

function buildUserPrompt(flowType: string, answers: Record<string, string | string[]>): string {
  const flowNames: Record<string, string> = {
    conversation: "Handle a Tough Conversation",
    stuck: "I Feel Stuck in My Career",
    speak_up: "Speak Up in Meetings",
    executive_visibility: "Make Your Work Visible to Leadership",
    negotiate: "Negotiate Something Important",
    mindset: "Reset My Mindset Quickly",
  };

  if (flowType === "stuck") {
    const skills = Array.isArray(answers.skills) ? answers.skills.join(", ") : answers.skills ?? "";
    const wantsMore = Array.isArray(answers.wants_more) ? answers.wants_more.join(", ") : answers.wants_more ?? "";
    const wantsLess = Array.isArray(answers.wants_less) ? answers.wants_less.join(", ") : answers.wants_less ?? "";
    const directions = Array.isArray(answers.directions) ? answers.directions.join(", ") : answers.directions ?? "";
    const success = answers.success ?? "";

    return `Coaching scenario: I Feel Stuck in My Career

This professional is at a career inflection point. Here is what they shared:

STRENGTHS they bring: ${skills}

What they want MORE of: ${wantsMore}

What they want LESS of: ${wantsLess}

Directions calling to them: ${directions}

What success looks like in 3 years: ${success}

Diagnose which of the three root causes is present: (1) they do not know what they want, (2) they know what they want but not how to get there, or (3) something or someone is standing in the way. Name which one clearly in the breakdown before prescribing. Then generate a deeply personalised Clarity Map, specific Direction Options, and Outreach Scripts that reflect their exact combination of strengths, wants, and directions. Not a generic career template.`;
  }

  if (flowType === "negotiate") {
    return `Coaching scenario: Negotiate Something Important

Situation type: ${answers.situation_type ?? ""}
What they are negotiating: ${answers.what ?? ""}
Where they are in the process: ${answers.timing ?? ""}
Their target or aim: ${answers.target ?? ""}
Their current leverage: ${answers.leverage ?? ""}
What worries them most: ${answers.fear ?? ""}

Generate negotiation coaching calibrated specifically to their situation type (${answers.situation_type ?? ""}), their leverage position, and their primary fear. Every script line must address their exact scenario.`;
  }

  if (flowType === "conversation") {
    return `Coaching scenario: Handle a Tough Conversation

Who the conversation is with: ${answers.who ?? ""}
What the conversation is about: ${answers.topic ?? ""}
How they are feeling going into it: ${answers.feeling ?? ""}
What success looks like: ${answers.goal ?? ""}

Generate coaching calibrated to a conversation with ${answers.who ?? "someone"} about ${answers.topic ?? "a difficult topic"}. The script must reflect that specific relationship dynamic and topic.`;
  }

  if (flowType === "speak_up") {
    return `Coaching scenario: Speak Up in Meetings

What holds them back: ${answers.blocker ?? ""}
What happens in the moment: ${answers.pattern ?? ""}
Type of meeting: ${answers.meeting_type ?? ""}
What staying quiet costs them: ${answers.cost ?? ""}

Generate speak-up coaching calibrated to their exact silence pattern (${answers.pattern ?? ""}) in ${answers.meeting_type ?? "meetings"}.`;
  }

  if (flowType === "mindset") {
    return `Coaching scenario: Reset My Mindset Quickly

What is weighing on them: ${answers.feeling ?? ""}
What triggered this: ${answers.trigger ?? ""}
What their mind is doing with it: ${answers.pattern ?? ""}

Generate a fast, decisive pattern interrupt calibrated to this exact emotional state and cognitive pattern. Name the specific story being treated as fact.`;
  }

  if (flowType === "executive_visibility") {
    return `Coaching scenario: Make Your Work Visible to Leadership

Main challenge: ${answers.challenge ?? ""}
Who they need to be visible to: ${answers.audience ?? ""}
How they most often share their work: ${answers.medium ?? ""}
Their biggest positioning gap: ${answers.gap ?? ""}

Generate executive positioning coaching for someone whose primary audience is ${answers.audience ?? "leadership"} and whose main gap is ${answers.gap ?? "framing work as business impact"}.`;
  }

  const lines = Object.entries(answers).map(([k, v]) => {
    const val = Array.isArray(v) ? v.join(", ") : v;
    return `- ${k}: ${val}`;
  }).join("\n");
  return `Coaching scenario: ${flowNames[flowType] ?? flowType}\n\nUser situation:\n${lines}`;
}

export default router;