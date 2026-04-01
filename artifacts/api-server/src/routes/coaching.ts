import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const STYLE_RULES = `ABSOLUTE RULES (never break):
- No brackets: not [their name], not [specific project], not [X]. Use descriptive phrases: "your manager," "the conversation you described," "the offer on the table."
- No coaching language: no "be confident," "be direct," "own your power," "you've got this," "believe in yourself," "be authentic," "step into your power," "take a deep breath."
- No abstract advice. Every sentence must be executable.
- No qualifiers in scripts: no "just," "maybe," "I think," "I was wondering if," "sorry to bother you."`;

const EVALUATE_PROMPT = `You are a senior executive strategy advisor. Your job is to assess a workplace situation and recommend the highest-leverage approach before any coaching is generated.

${STYLE_RULES}

Evaluate the situation on four dimensions:
- POWER: Does the user have meaningful influence over this person or outcome?
- CHANGEABILITY: Based on their description, is the other party likely to change if confronted?
- RISK: What is the political and relational risk of a direct approach in this specific context?
- URGENCY: How time-sensitive is this?

Then recommend ONE of three strategies:

DIRECT_CONVERSATION — when: user has reasonable influence, other party is likely to respond to feedback, political risk is low, direct confrontation will move the situation forward.
INDIRECT_INFLUENCE — when: direct confrontation may fail, backfire, or damage the user's position. Other person has more power, relationship/reputation is at stake, or shifting perception is a higher-leverage move.
STRATEGIC_CONTAINMENT — when: low power, high risk, or the other person is unlikely to change. Focus should be protecting position, not changing the other person.

For each strategy, write one sentence (specific to their situation) explaining WHY that approach is or is not the highest-leverage move here. The sentence for the recommended strategy explains why it IS the best play. The sentences for the other two explain why they could also apply — or why they are a fallback — never say a strategy is "wrong," just explain what it offers in this context.

Respond with EXACTLY this JSON. No markdown. No code fences. Raw JSON only:

{
  "recommendedStrategy": "DIRECT_CONVERSATION",
  "assessment": {
    "DIRECT_CONVERSATION": "One sentence specific to their situation explaining what direct conversation achieves here.",
    "INDIRECT_INFLUENCE": "One sentence specific to their situation explaining what indirect influence achieves here.",
    "STRATEGIC_CONTAINMENT": "One sentence specific to their situation explaining what containment achieves here."
  },
  "options": [
    { "type": "DIRECT_CONVERSATION", "label": "Address it directly" },
    { "type": "INDIRECT_INFLUENCE", "label": "Shift perception and influence dynamics" },
    { "type": "STRATEGIC_CONTAINMENT", "label": "Protect your position and manage risk" }
  ]
}`;

const GENERATE_PROMPT = `You are an elite executive coach for professional women in high-stakes workplace situations. The user has chosen their strategy. Generate coaching output for EXACTLY that strategy — do not override or second-guess their choice.

${STYLE_RULES}

If strategy is DIRECT_CONVERSATION:
- reframe: One sharp sentence that gives the user ground to stand on.
- breakdown: 2-3 sentences of executive-level analysis of what is actually happening.
- script: A full 5-part conversation script. Each field is one declarative sentence — no qualifiers.
  - opening: First thing they say. Direct. Calm. No apology.
  - issue: The specific behavior named plainly.
  - impact: What this is affecting — results, team, credibility, relationship.
  - ask: The specific expectation stated clearly.
  - pushback: One firm, non-emotional response for when they resist.
- tactics: 3 specific actions to execute in the next 48 hours. Number them. Each has a verb, object, and timeframe.
- nextSteps: The single most important action in the next 24 hours — write the exact message or opening line.

If strategy is INDIRECT_INFLUENCE:
- reframe: One sharp sentence that reframes this as a positioning and influence challenge.
- breakdown: 2-3 sentences naming the real dynamic and why influence is the higher-leverage play.
- script: null
- tactics: 4 specific influence actions — framing, visibility moves, ally-building, repositioning. Concrete and executable.
- nextSteps: The single action that shifts the dynamic most — with exact language for how to execute it.

If strategy is STRATEGIC_CONTAINMENT:
- reframe: One sharp sentence that reframes this as a protection and positioning challenge.
- breakdown: 2-3 sentences naming why containment is the right play.
- script: null
- tactics: 4 specific protection and positioning actions — documentation, escalation paths, reputation management.
- nextSteps: The single most important protective action in the next 24 hours — specific and time-bound.

Respond with EXACTLY this JSON. No markdown. No code fences. Raw JSON only:

{
  "strategy": "DIRECT_CONVERSATION",
  "reframe": "...",
  "breakdown": "...",
  "script": { "opening": "...", "issue": "...", "impact": "...", "ask": "...", "pushback": "..." },
  "tactics": ["1. ...", "2. ...", "3. ..."],
  "nextSteps": ["..."]
}`;

router.post("/coaching/evaluate", async (req, res) => {
  const { flowType, answers } = req.body as {
    flowType: string;
    answers: Record<string, string>;
  };
  if (!flowType || !answers) {
    res.status(400).json({ error: "Missing flowType or answers" });
    return;
  }

  const userPrompt = buildUserPrompt(flowType, answers);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 400,
      messages: [
        { role: "system", content: EVALUATE_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = (completion.choices[0]?.message?.content ?? "{}").trim();
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(stripped);
    } catch {
      parsed = {
        recommendedStrategy: "DIRECT_CONVERSATION",
        reason: "Based on your situation, a direct approach is most likely to move things forward.",
        options: [
          { type: "DIRECT_CONVERSATION", label: "Address it directly" },
          { type: "INDIRECT_INFLUENCE", label: "Shift perception and influence dynamics" },
          { type: "STRATEGIC_CONTAINMENT", label: "Protect your position and manage risk" },
        ],
      };
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "OpenAI evaluate error");
    res.status(500).json({ error: "Failed to evaluate strategy" });
  }
});

router.post("/coaching/generate", async (req, res) => {
  const { flowType, answers, strategy } = req.body as {
    flowType: string;
    answers: Record<string, string>;
    strategy: string;
  };

  if (!flowType || !answers || !strategy) {
    res.status(400).json({ error: "Missing flowType, answers, or strategy" });
    return;
  }

  const userPrompt = `Strategy chosen by user: ${strategy}\n\n${buildUserPrompt(flowType, answers)}\n\nGenerate coaching output for the ${strategy} strategy exactly as instructed.`;

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
      parsed = buildFallback(strategy);
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "OpenAI generate error");
    res.status(500).json({ error: "Failed to generate coaching response" });
  }
});

function buildFallback(strategy: string) {
  return {
    strategy,
    reframe: "The situation is clearer than it feels — you know what needs to happen.",
    breakdown: "You are in a pattern of waiting for the right moment instead of creating it. The longer you wait, the more the other person's behavior becomes the established norm.",
    script: strategy === "DIRECT_CONVERSATION" ? {
      opening: "I want to talk about something that has been affecting my work.",
      issue: "There is a pattern I need to address directly with you.",
      impact: "This is affecting my ability to deliver and my standing on this team.",
      ask: "I need this to change, and I want to agree on how.",
      pushback: "I hear you. And this still needs to be resolved. Can we agree on a path forward?",
    } : null,
    tactics: [
      "1. Today, write down exactly what you want to say in one paragraph — no hedging, no qualifiers.",
      "2. Take one concrete action before end of day.",
      "3. Review your position and next steps before tomorrow morning.",
    ],
    nextSteps: ["Take one concrete action today that moves this situation forward in a direction you control."],
  };
}

function buildUserPrompt(flowType: string, answers: Record<string, string>): string {
  const flowNames: Record<string, string> = {
    conversation: "Handle a Tough Conversation",
    stuck: "I Feel Stuck in My Career",
    visibility: "I Need to Step Up and Be Seen",
    negotiate: "Negotiate Something Important",
    mindset: "Reset My Mindset Quickly",
  };
  const lines = Object.entries(answers)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
  return `Coaching scenario: ${flowNames[flowType] ?? flowType}\n\nUser's situation:\n${lines}`;
}

export default router;
