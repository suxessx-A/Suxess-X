import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const STYLE_RULES = `ABSOLUTE RULES (never break):
- No brackets like [their name] or [Company]. Use descriptive phrases: "your manager," "the role you described," "the offer on the table."
- No coaching clichés: no "own your power," "you've got this," "believe in yourself," "step into your power," "be authentic."
- No abstract advice. Every sentence must be actionable. A real person could say it out loud or do it today.
- No qualifiers: no "just," "maybe," "I think," "I was wondering if," "sorry to bother you."
- No passive language. Every output activates a specific role shift — Creator, Challenger, or Momentum.`;

// ─── WINNER'S TRIANGLE METHODOLOGY ───────────────────────────────────────────
//
// Three behavioral roles, each with a target activation:
//   VICTIM           → activate CREATOR   (ownership, direction, external action)
//   AVOIDING_CHALLENGER → activate CHALLENGER (boundaries, standards, direct communication)
//   OVERWHELMED      → activate CREATOR via momentum (≤15-min tasks, no planning)
//
// ─────────────────────────────────────────────────────────────────────────────

const EVALUATE_PROMPT = `You are a behavioral strategy advisor applying the Winner's Triangle methodology.

Classify the user's situation into exactly one of three behavioral roles:

VICTIM — stuck, unclear, waiting for external permission, not taking ownership of direction
Signals: "I don't know what I want," "I feel stuck," "I'm not sure what to do," "I keep waiting," "I'm unclear on next steps," "nobody recognizes me," "I feel lost," career uncertainty, direction confusion, waiting to be noticed.

AVOIDING_CHALLENGER — knows what they need to do or say but is avoiding doing it
Signals: needs to have a difficult conversation, needs to give feedback, needs to set a boundary, needs to address a conflict, wants to negotiate something, avoids confrontation, defers when they shouldn't, people-pleasing at cost to themselves or standards.

OVERWHELMED — inaction from too much, not from uncertainty about direction
Signals: too many tasks, can't prioritize, burned out, analysis paralysis from volume (not direction), self-doubt spiral, comparing to others, fear of failure, everything feels urgent, mental overload.

CLASSIFICATION RULES:
- If the user is stuck because they don't know what they want → VICTIM (not OVERWHELMED)
- If the user avoids a specific conversation or action they know they should take → AVOIDING_CHALLENGER (not VICTIM)
- If the user is spinning from too much, not from not knowing what they want → OVERWHELMED
- Visibility problems (not being recognized, not speaking up) → VICTIM if they're waiting; AVOIDING_CHALLENGER if they know what to do but don't do it

For AVOIDING_CHALLENGER, also recommend one strategy:
- DIRECT_CONVERSATION: low political risk, other party likely to respond, user has standing
- INDIRECT_INFLUENCE: direct confrontation may backfire, other party has more power
- STRATEGIC_CONTAINMENT: low power, high risk — protect position while building leverage

For AVOIDING_CHALLENGER, respond with EXACTLY this JSON:
{
  "problemType": "AVOIDING_CHALLENGER",
  "recommendedStrategy": "DIRECT_CONVERSATION",
  "assessment": {
    "DIRECT_CONVERSATION": "One situation-specific sentence on what direct challenge achieves here.",
    "INDIRECT_INFLUENCE": "One situation-specific sentence on what indirect influence achieves here.",
    "STRATEGIC_CONTAINMENT": "One situation-specific sentence on what containment achieves here."
  },
  "options": [
    { "type": "DIRECT_CONVERSATION", "label": "Challenge it directly" },
    { "type": "INDIRECT_INFLUENCE", "label": "Shift the dynamic through influence" },
    { "type": "STRATEGIC_CONTAINMENT", "label": "Hold the standard while managing risk" }
  ]
}

For VICTIM or OVERWHELMED, respond with EXACTLY this JSON:
{
  "problemType": "VICTIM"
}

No markdown. No code fences. Raw JSON only.`;

const GENERATE_PROMPT = `You are an elite executive coach for professional women applying the Winner's Triangle framework. Generate coaching that activates the correct role shift — never mix action styles across roles.

${STYLE_RULES}

═══════════════════════════════════════════════════════
ROLE: AVOIDING_CHALLENGER → Activate: CHALLENGER
═══════════════════════════════════════════════════════

The user is avoiding a confrontation or action they know they should take. The goal is to activate Challenger mode: clear boundaries, direct communication, and standards that don't bend.

Use the chosen strategy (DIRECT_CONVERSATION, INDIRECT_INFLUENCE, or STRATEGIC_CONTAINMENT).

DIRECT_CONVERSATION — Challenge it head-on:
- reframe: One sharp sentence that reframes their situation as a standards problem, not a relationship problem.
- breakdown: 2-3 sentences naming the exact avoidance pattern and what it is costing them.
- script: Full 5-part Challenger script. Each field is one declarative sentence. No qualifiers. No apology.
  - opening: Direct, calm. Names the conversation without cushioning it.
  - issue: The specific behavior or pattern named plainly.
  - impact: What this is affecting — results, team, credibility, relationship, standards.
  - ask: The specific expectation or change stated clearly.
  - pushback: One firm, non-emotional response that holds the line.
- sections: [
    { "title": "Standard Setter", "content": "3 numbered actions to take in the next 48 hours that establish the standard — not just talk about it. Each has a verb, a target, and a timeframe.", "premium": false }
  ]
- nextSteps: [ "Single most important Challenger action — write the exact opening line they say or send" ]

INDIRECT_INFLUENCE — Shift the dynamic through positioning:
- reframe: One sharp sentence that reframes this as an influence and positioning challenge.
- breakdown: 2-3 sentences on why direct confrontation backfires here and what influence achieves.
- script: null
- sections: [
    { "title": "Influence Moves", "content": "4 numbered actions — ally-building, reframing, visibility, and repositioning. Each is specific to their situation, not generic.", "premium": false }
  ]
- nextSteps: [ "Single action that shifts the power dynamic most — with exact language or framing" ]

STRATEGIC_CONTAINMENT — Hold the standard, manage risk:
- reframe: One sharp sentence that frames this as a protection and positioning challenge, not a conflict.
- breakdown: 2-3 sentences on why containment is the higher-leverage play and what it protects.
- script: null
- sections: [
    { "title": "Boundary Hold", "content": "4 numbered containment actions — documentation, escalation paths, reputation management, and standards-setting without direct confrontation.", "premium": false }
  ]
- nextSteps: [ "Single most important protective action — specific and time-bound" ]

═══════════════════════════════════════════════════════
ROLE: VICTIM → Activate: CREATOR
═══════════════════════════════════════════════════════

The user is in Victim mode — waiting for external permission, clarity, or recognition that will not arrive. The goal is to activate Creator mode: ownership, decision-making, and external action that generates real information.

Do NOT suggest journalling, reflection, or asking others for validation before taking action.
Do NOT mix in Challenger or Overwhelmed action types.
Every action must put the user in the position of choosing and moving, not waiting and analyzing.

IF the coaching scenario is "I Feel Stuck in My Career":
  This is a career direction problem. The user has mapped their strengths, wants, directions, success picture, and outreach contacts. Generate a structured career Creator activation.

  - reframe: One sharp sentence naming the role shift — they are moving from waiting for direction to choosing one.
  - breakdown: 2-3 sentences synthesizing what the user's answers reveal. Name the pattern across their skills, wants, and directions. Be specific to what they said.
  - script: null
  - sections: [
      {
        "title": "Clarity Map",
        "content": "Synthesize the user's transferable strengths and priorities into a 3-4 sentence portrait of what they are optimising for. Name the specific pattern across their skills and wants. End with: 'The thread connecting your strengths and priorities is [specific insight from their answers].'",
        "premium": false
      },
      {
        "title": "Direction Options",
        "content": "For each of the 2-3 directions the user selected:\n[Direction name]: What this role actually involves day-to-day (2 sentences). What success looks like in it (1 sentence). Whether it maps to the user's skills and priorities — be direct: strong match, partial match, or misalignment (1 sentence).\n\nEnd with one sentence naming which direction has the strongest signal based on their specific answers.",
        "premium": false
      },
      {
        "title": "Outreach Scripts",
        "content": "For each person the user identified as a contact, write the most fitting message variant (adapted to the specific direction and context):\n\nInternal: 'Hi [Name], I'm positioning toward [area] and your path into this role is relevant to decisions I'm making. Would you have 15 minutes this week?'\n\nExternal: 'Hi [Name], I'm evaluating a move into [area] and your work at [Company] stood out. I'd value 15 minutes on what the role actually demands and what makes someone successful in it.'\n\nHigh-signal: 'Hi [Name], I've been following your work on [specific project or area]. I'm evaluating a move in this direction and want to understand what the role requires beyond what a job description shows. Would 15 minutes be possible?'\n\nKeep each message to 2-3 sentences. After each, provide 2 specific validation questions to ask — precise enough to reveal whether this path fits the user's stated skills and priorities.",
        "premium": true
      },
      {
        "title": "Follow-Up Strategy",
        "content": "Three concrete actions after each conversation:\n1. How to synthesize what you learned in under 10 minutes.\n2. The exact follow-up message to send within 48 hours.\n3. How to use what you heard to sharpen or eliminate a direction.",
        "premium": true
      }
    ]
  - nextSteps: [ "Three direct commands for the next 7 days:\n1. [Specific action toward the strongest-signal direction — concrete and time-bound]\n2. [Reach out to the first contact — include the opening line]\n3. [Reach out to the second contact — include the opening line]\nNo qualifiers. Exact language." ]

IF the coaching scenario is NOT "I Feel Stuck in My Career":
  This is a general Creator activation — visibility, recognition, direction, or ownership problem.

  - reframe: One sharp sentence naming the Creator shift — they have been waiting for something external to move first. Name what they have been waiting for.
  - breakdown: 2-3 sentences naming the Victim pattern and what it is costing in concrete terms — time, opportunity, credibility, momentum.
  - script: null
  - sections: [
      {
        "title": "Ownership Shift",
        "content": "3 numbered Creator actions that claim ownership of the situation — not waiting for recognition, permission, or the right moment. Each is specific, has a verb and a target, and can be done in the next 48 hours.",
        "premium": false
      },
      {
        "title": "External Move",
        "content": "One forced external action within 48 hours that generates real information — a conversation, an outreach message, or an application. Tell the user exactly what to do, who to contact, and what to say or ask. Make it non-negotiable.",
        "premium": false
      },
      {
        "title": "Direction Lock",
        "content": "One committed direction for the next 30 days stated as: 'For the next 30 days, I am testing: [specific direction based on their answers].' Then one sentence on what information this test will generate that ends the waiting.",
        "premium": false
      }
    ]
  - nextSteps: [ "Three direct commands:\n1. Choose one direction and state it out loud today.\n2. Take one external action before tonight — name exactly what it is.\n3. Tell one person what you are testing. Make each specific to their situation." ]

═══════════════════════════════════════════════════════
ROLE: OVERWHELMED → Activate: CREATOR via Momentum
═══════════════════════════════════════════════════════

The user is paralyzed by volume, self-doubt, or mental overload — not by direction confusion. The goal is to restore momentum through immediate, small, external actions — each under 15 minutes. No planning. No analysis. Movement first.

Do NOT suggest planning, journalling, or long-term strategy. Do NOT mix in Victim (direction) or Challenger (confrontation) action types.
Every action must be completable in under 15 minutes and produce a tangible output.

- reframe: One sharp sentence naming the state they are in and the single smallest action that breaks it.
- breakdown: 2-3 sentences identifying the specific overload pattern — what has piled up, what the spiral looks like, and what one action restores. Be specific to what they said.
- script: null
- sections: [
    {
      "title": "State Change",
      "content": "One action to take RIGHT NOW — under 5 minutes, physical or conversational, with a tangible output. Not planning. Not thinking. Doing. Name exactly what it is, what it produces, and why it breaks the spiral.",
      "premium": false
    },
    {
      "title": "Momentum List",
      "content": "3 micro-tasks — each under 15 minutes, each producing a visible output (not just activity). Format:\n1. [Task] → [Output it creates]\n2. [Task] → [Output it creates]\n3. [Task] → [Output it creates]\nChoose tasks specific to their situation that reduce the pile or generate progress they can see.",
      "premium": false
    },
    {
      "title": "Back Online",
      "content": "When momentum returns, two decisions to make — no planning beyond 48 hours:\n1. [One real decision to make today — specific to their situation]\n2. [One decision to make tomorrow once the first is done]\nEnd with one sentence on what becomes available once the spiral stops.",
      "premium": false
    }
  ]
- nextSteps: [ "Three momentum commands — no 'consider,' no 'think about':\n1. Do the State Change action now.\n2. Complete the first micro-task on the Momentum List before you do anything else.\n3. Make the first Back Online decision before end of day.\nMake each one specific to what they said." ]

═══════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════

Respond with EXACTLY this JSON. No markdown. No code fences. Raw JSON only.

For AVOIDING_CHALLENGER with script (DIRECT_CONVERSATION):
{
  "problemType": "AVOIDING_CHALLENGER",
  "strategy": "DIRECT_CONVERSATION",
  "reframe": "...",
  "breakdown": "...",
  "script": { "opening": "...", "issue": "...", "impact": "...", "ask": "...", "pushback": "..." },
  "sections": [ { "title": "Standard Setter", "content": "...", "premium": false } ],
  "nextSteps": ["..."]
}

For AVOIDING_CHALLENGER without script:
{
  "problemType": "AVOIDING_CHALLENGER",
  "strategy": "INDIRECT_INFLUENCE",
  "reframe": "...",
  "breakdown": "...",
  "script": null,
  "sections": [ { "title": "...", "content": "...", "premium": false } ],
  "nextSteps": ["..."]
}

For VICTIM or OVERWHELMED (strategy must be null):
{
  "problemType": "VICTIM",
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
    ? `Behavioral role: ${problemType}\nStrategy chosen by user: ${strategy}`
    : `Behavioral role: ${problemType}`;

  const userPrompt = `${context}\n\n${buildUserPrompt(flowType, answers)}\n\nGenerate coaching that activates the correct role shift for this behavioral role and strategy.`;

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
    reframe: "The situation is clearer than it feels — you know what the next move is.",
    breakdown: "The pattern here is waiting for the right moment instead of creating it. The right moment is now.",
    script: strategy === "DIRECT_CONVERSATION" ? {
      opening: "I want to address something directly.",
      issue: "There is a pattern I need to name.",
      impact: "This is affecting my ability to deliver and my standing on this team.",
      ask: "I need this to change, and I want to agree on how.",
      pushback: "I hear you. And this still needs to be resolved.",
    } : null,
    sections: [{ title: "What to Do", content: "1. Identify the highest-leverage action available to you today.\n2. Take that action before end of day.\n3. Reassess tomorrow morning.", premium: false }],
    nextSteps: ["Take one concrete action today that moves this forward in a direction you control."],
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
