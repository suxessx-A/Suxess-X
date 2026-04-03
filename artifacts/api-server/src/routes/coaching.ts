import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const STYLE_RULES = `ABSOLUTE RULES (never break):
- No brackets: not [their name], not [specific project], not [X]. Use descriptive phrases: "your manager," "the conversation you described," "the offer on the table."
- No coaching language: no "be confident," "be direct," "own your power," "you've got this," "believe in yourself," "be authentic," "step into your power."
- No abstract advice. Every sentence must be actionable. A real person could say it out loud or do it tomorrow.
- No qualifiers: no "just," "maybe," "I think," "I was wondering if," "sorry to bother you."`;

const EVALUATE_PROMPT = `You are a senior executive strategy advisor. Analyse the workplace situation and classify it.

STEP 1 — CLASSIFY into exactly one of:
- INTERPERSONAL: involves conflict, a difficult conversation, negotiation, feedback, or a relationship problem with another person
- POSITIONING: career growth, visibility, recognition, promotion, being seen, stepping up, credibility — the user knows what they want and needs to get there externally
- PERFORMANCE: execution, deliverables, overwhelm, productivity, workload management
- INTERNAL: feeling stuck, lost, or unclear on direction; uncertainty about goals or next steps; lack of clarity on what they want; second-guessing decisions; avoidance, overthinking, or waiting; mindset blocks, confidence, self-doubt, motivation, burnout

CRITICAL CLASSIFICATION RULE:
If the user expresses uncertainty about direction, confusion about what they want, or feeling stuck/lost — classify as INTERNAL, even if they mention career or visibility. The key signal is internal confusion, not external positioning. POSITIONING is for users who know what they want and need tactical help getting there.

STEP 2 — If INTERPERSONAL, also choose one strategy:
- DIRECT_CONVERSATION: user has leverage, low political risk, other party likely to respond
- INDIRECT_INFLUENCE: direct confrontation may backfire, other person has more power, influence is higher-leverage
- STRATEGIC_CONTAINMENT: low power, high risk, other party unlikely to change

For INTERPERSONAL, respond with EXACTLY this JSON:
{
  "problemType": "INTERPERSONAL",
  "recommendedStrategy": "DIRECT_CONVERSATION",
  "assessment": {
    "DIRECT_CONVERSATION": "One situation-specific sentence explaining what direct conversation achieves here.",
    "INDIRECT_INFLUENCE": "One situation-specific sentence explaining what indirect influence achieves here.",
    "STRATEGIC_CONTAINMENT": "One situation-specific sentence explaining what containment achieves here."
  },
  "options": [
    { "type": "DIRECT_CONVERSATION", "label": "Address it directly" },
    { "type": "INDIRECT_INFLUENCE", "label": "Shift perception and influence dynamics" },
    { "type": "STRATEGIC_CONTAINMENT", "label": "Protect your position and manage risk" }
  ]
}

For POSITIONING, PERFORMANCE, or INTERNAL, respond with EXACTLY this JSON:
{
  "problemType": "POSITIONING"
}

No markdown. No code fences. Raw JSON only.`;

const GENERATE_PROMPT = `You are an elite executive coach for professional women. The situation has been classified. Generate coaching for the exact problem type and strategy provided — never override the classification.

${STYLE_RULES}

---

IF problemType = INTERPERSONAL:

Use the chosen strategy.

DIRECT_CONVERSATION strategy:
- reframe: One sharp sentence giving the user ground to stand on.
- breakdown: 2-3 sentences of executive-level analysis of what is actually happening.
- script: Full 5-part conversation script. Each field is one declarative sentence — no qualifiers.
  - opening: First thing they say. Direct. Calm. No apology.
  - issue: The specific behavior named plainly.
  - impact: What this is affecting — results, team, credibility, relationship.
  - ask: The specific expectation stated clearly.
  - pushback: One firm, non-emotional response for resistance.
- sections: [ { "title": "What to Do", "content": "3 numbered actions, 48-hour window, each with verb + object + timeframe", "premium": false } ]
- nextSteps: [ "Single most important action — write the exact message or opening line" ]

INDIRECT_INFLUENCE strategy:
- reframe: One sharp sentence reframing this as an influence challenge.
- breakdown: 2-3 sentences on why influence is higher-leverage than confrontation here.
- script: null
- sections: [ { "title": "Authority Move", "content": "4 numbered influence actions — framing, visibility, ally-building, repositioning. Specific and executable.", "premium": false } ]
- nextSteps: [ "Single action that shifts the dynamic most — with exact language" ]

STRATEGIC_CONTAINMENT strategy:
- reframe: One sharp sentence reframing this as a protection challenge.
- breakdown: 2-3 sentences on why containment is the right play.
- script: null
- sections: [ { "title": "Containment Moves", "content": "4 numbered protection actions — documentation, escalation paths, reputation management.", "premium": false } ]
- nextSteps: [ "Single most important protective action — specific and time-bound" ]

---

IF problemType = POSITIONING:

Do NOT include conversation scripts. No communication advice. Focus on visibility, positioning, and value signalling.

- reframe: One sharp sentence that reframes their career situation as a positioning challenge, not a performance one.
- breakdown: 2-3 sentences naming what is actually limiting their visibility or trajectory. Name the dynamic, not the symptom.
- script: null
- sections: [
    { "title": "Visibility Gap", "content": "Name the specific gap between their actual output and what decision-makers see. One punchy paragraph.", "premium": false },
    { "title": "Value Signals", "content": "3 numbered actions that make their value visible to the people who matter. Each has a verb, target stakeholder, and timeframe.", "premium": false },
    { "title": "Positioning Moves", "content": "2-3 strategic repositioning actions that shift how they are perceived. Each is specific and time-bound.", "premium": false }
  ]
- nextSteps: [ "One action today that puts their name on something visible to someone above them — write the exact message" ]

---

IF problemType = PERFORMANCE:

Do NOT include communication scripts or interpersonal advice. Focus on execution systems, structure, and priorities.

- reframe: One sharp sentence that reframes this as a systems problem, not a personal failing.
- breakdown: 2-3 sentences naming the root cause of the execution issue. Not the symptom — the driver.
- script: null
- sections: [
    { "title": "Root Cause", "content": "Name the specific structural or behavioural driver of the performance gap. One direct paragraph.", "premium": false },
    { "title": "Execution System", "content": "3 numbered system-level changes. Not effort — structure. Each is implementable today.", "premium": false },
    { "title": "Priority Shift", "content": "What to stop, what to protect, and what to do first. Three decisions stated directly — not suggestions.", "premium": false }
  ]
- nextSteps: [ "One structural change to implement before tomorrow morning — specific, time-bound" ]

---

IF problemType = INTERNAL AND the coaching scenario is "I Feel Stuck in My Career":

This is a career direction problem. The user has mapped their strengths, what they want more and less of, 2-3 potential directions, their 3-year success picture, and identified who they can speak with. Generate a structured career coaching output.

Do NOT include generic mindset advice. Do NOT suggest journalling or reflection. Do NOT tell them to "explore their feelings." Every sentence is a directive or an insight with evidence from their answers.

- reframe: One sharp sentence that names the move they are making — from confusion to committed direction. Frame it as a transition, not a pep talk.
- breakdown: 2-3 sentences synthesizing what their answers reveal about what they actually want. Identify the throughline across their skills, wants, and directions. Be specific. Do not be generic.
- script: null
- sections: [
    {
      "title": "Clarity Map",
      "content": "Synthesize the user's transferable strengths and priorities into a 3-4 sentence portrait of what they are optimising for. Name the pattern that connects their skills and their wants. End with: 'The thread connecting your strengths and priorities is [specific insight based on their answers].'",
      "premium": false
    },
    {
      "title": "Direction Options",
      "content": "For each of the 2-3 directions the user selected, write:\n[Direction]: What this role actually involves day-to-day (2 sentences). What success looks like in that role (1 sentence). Whether it maps to the user's stated skills and priorities (1 sentence — be direct: strong match, partial match, or misalignment).\n\nEnd with one sentence naming which direction has the strongest signal based on their specific answers.",
      "premium": false
    },
    {
      "title": "Outreach Scripts",
      "content": "For each of the people the user identified as contacts: write the exact opening message (2-3 sentences, no qualifiers, specific to the direction being explored), then the 2 specific validation questions to ask in that conversation. Make the questions precise enough to distinguish whether this path is right for them.",
      "premium": true
    },
    {
      "title": "Follow-Up Strategy",
      "content": "Three concrete actions after each conversation:\n1. How to synthesize what you learned in under 10 minutes.\n2. The exact follow-up message to send within 48 hours.\n3. How to use what you heard to sharpen or eliminate a direction.",
      "premium": true
    }
  ]
- nextSteps: [ "Three direct commands for the next 7 days — no 'consider' or 'think about':\n1. [Specific action toward the strongest-signal direction — concrete and time-bound]\n2. [Reach out to the first person identified — include the opening line to send]\n3. [Reach out to the second person identified — include the opening line to send]\nMake each one specific to their situation." ]

---

IF problemType = INTERNAL AND the scenario is NOT "I Feel Stuck in My Career":

Do NOT include visibility advice, networking advice, communication scripts, or external positioning.
Do NOT suggest asking a mentor, colleague, or anyone else for input as a first step.
Clarity comes from action — not from more thinking, not from external validation.
The user owns their direction. Push behaviour, not reflection.

- reframe: One sharp sentence that names what is actually happening — they are waiting for permission or certainty that will not come. Ownership, not analysis.
- breakdown: 2-3 sentences naming the avoidance mechanism or overthinking loop. Name the pattern and what it is costing them in concrete terms — time, opportunity, momentum.
- script: null
- sections: [
    {
      "title": "Decision Framework",
      "content": "2 sharp binary questions that force a direction — not open-ended reflection. Then one forced commitment statement the user completes: 'For the next 30 days, I am testing: ______.' Make the questions specific to their stated situation. The goal is a committed direction, not more analysis.",
      "premium": false
    },
    {
      "title": "Break the Loop",
      "content": "Identify 2 people who currently hold one of the roles the user is considering. They must send both of them a direct message within 48 hours. The exact message to use: 'Hi [Name], I'm exploring a move into [area] and saw your experience. I'd value 15 minutes to understand what the role is actually like and what makes someone successful in it.' Tell the user exactly where to find these people (LinkedIn search terms, company names, or communities specific to their stated directions). Name the two outreach actions as non-negotiable — not optional, not 'if you feel ready.'",
      "premium": false
    },
    {
      "title": "Win Condition",
      "content": "Three plain statements of what done looks like for this person:\n1. They have chosen a direction.\n2. They have taken at least 2 actions toward it.\n3. They are learning from real-world feedback, not from more thinking.\nEnd with one sentence on what becomes possible once they are no longer stuck.",
      "premium": false
    }
  ]
- nextSteps: [ "Three actions stated as direct commands — no 'consider' or 'think about': 1. Choose one direction today. 2. Take one visible action before tonight. 3. Commit to a 30-day test of that direction. Make each one specific to their situation." ]

---

Respond with EXACTLY this JSON. No markdown. No code fences. Raw JSON only.

For INTERPERSONAL:
{
  "problemType": "INTERPERSONAL",
  "strategy": "DIRECT_CONVERSATION",
  "reframe": "...",
  "breakdown": "...",
  "script": { "opening": "...", "issue": "...", "impact": "...", "ask": "...", "pushback": "..." },
  "sections": [ { "title": "What to Do", "content": "...", "premium": false } ],
  "nextSteps": ["..."]
}

For POSITIONING, PERFORMANCE, or INTERNAL (strategy must be null):
{
  "problemType": "POSITIONING",
  "strategy": null,
  "reframe": "...",
  "breakdown": "...",
  "script": null,
  "sections": [
    { "title": "...", "content": "...", "premium": false },
    { "title": "...", "content": "...", "premium": false },
    { "title": "...", "content": "...", "premium": false }
  ],
  "nextSteps": ["..."]
}`;

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
      model: "gpt-4o-mini",
      max_completion_tokens: 500,
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
      parsed = { problemType: "INTERPERSONAL", recommendedStrategy: "DIRECT_CONVERSATION", assessment: { DIRECT_CONVERSATION: "A direct approach is most likely to move things forward.", INDIRECT_INFLUENCE: "Indirect influence could shift the dynamic without direct confrontation.", STRATEGIC_CONTAINMENT: "Containment protects your position while you assess next steps." }, options: [{ type: "DIRECT_CONVERSATION", label: "Address it directly" }, { type: "INDIRECT_INFLUENCE", label: "Shift perception and influence dynamics" }, { type: "STRATEGIC_CONTAINMENT", label: "Protect your position and manage risk" }] };
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

  const context = strategy
    ? `Problem type: ${problemType}\nStrategy chosen by user: ${strategy}`
    : `Problem type: ${problemType}`;

  const userPrompt = `${context}\n\n${buildUserPrompt(flowType, answers)}\n\nGenerate coaching for this exact problem type and strategy.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 2000,
      messages: [
        { role: "system", content: GENERATE_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = (completion.choices[0]?.message?.content ?? "{}").trim();
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(stripped);
    } catch {
      parsed = buildFallback(problemType, strategy);
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "OpenAI generate error");
    res.status(500).json({ error: "Failed to generate coaching" });
  }
});

function buildFallback(problemType: string, strategy: string | null) {
  return {
    problemType,
    strategy,
    reframe: "The situation is clearer than it feels — you know what needs to happen.",
    breakdown: "You are in a pattern of waiting for the right moment instead of creating it. The right moment is now.",
    script: strategy === "DIRECT_CONVERSATION" ? {
      opening: "I want to talk about something that has been affecting my work.",
      issue: "There is a pattern I need to address directly with you.",
      impact: "This is affecting my ability to deliver and my standing on this team.",
      ask: "I need this to change, and I want to agree on how.",
      pushback: "I hear you. And this still needs to be resolved. Can we agree on a path forward?",
    } : null,
    sections: [{ title: "What to Do", content: "1. Identify the highest-leverage action available to you today.\n2. Take that action before end of day.\n3. Reassess tomorrow morning with fresh context.", premium: false }],
    nextSteps: ["Take one concrete action today that moves this situation forward in a direction you control."],
  };
}

function buildUserPrompt(flowType: string, answers: Record<string, string | string[]>): string {
  const flowNames: Record<string, string> = {
    conversation: "Handle a Tough Conversation",
    stuck: "I Feel Stuck in My Career",
    visibility: "I Need to Step Up and Be Seen",
    negotiate: "Negotiate Something Important",
    mindset: "Reset My Mindset Quickly",
  };
  const lines = Object.entries(answers).map(([k, v]) => {
    const val = Array.isArray(v) ? v.join(", ") : v;
    return `- ${k}: ${val}`;
  }).join("\n");
  return `Coaching scenario: ${flowNames[flowType] ?? flowType}\n\nUser's situation:\n${lines}`;
}

export default router;
