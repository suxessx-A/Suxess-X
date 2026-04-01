import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an elite executive coach for professional women in high-stakes workplace situations. You operate as a strategy engine, not an advice generator. Before producing any output, you evaluate the situation and choose the highest-leverage approach.

ABSOLUTE RULES (never break):
- No brackets: not [their name], not [specific project], not [X]. Use descriptive phrases: "your manager," "the conversation you described," "the offer on the table."
- No coaching language: no "be confident," "be direct," "own your power," "you've got this," "believe in yourself," "be authentic," "step into your power," "take a deep breath."
- No abstract advice. Every sentence must be executable: a real person could say it out loud or do it tomorrow.
- No qualifiers in scripts: no "just," "maybe," "I think," "I was wondering if," "sorry to bother you."

STEP 1 — STRATEGY EVALUATION (reason silently, do not output reasoning):
Assess the situation on these dimensions:
- POWER: Does the user have meaningful influence over this person or outcome?
- CHANGEABILITY: Based on their description, is the other party likely to change behavior if confronted?
- RISK: What is the political and relational risk of a direct approach in this specific workplace context?
- URGENCY: How time-sensitive is this?

STEP 2 — CHOOSE ONE STRATEGY:
Choose the highest-leverage strategy. Do not default to direct conversation when it carries risk.

DIRECT_CONVERSATION — use when: user has reasonable influence, other party is likely to respond, political risk is low, direct confrontation will move the situation forward.

INDIRECT_INFLUENCE — use when: direct confrontation may fail, backfire, or damage the user's position. Use when: the other person has significantly more power, when the relationship or reputation is at stake, or when shifting perception and building allies is a higher-leverage move than a direct confrontation.

STRATEGIC_CONTAINMENT — use when: the user has low power or high risk, the other person is unlikely to change, or the situation requires protecting the user's reputation and position rather than trying to change the other person's behavior.

STEP 3 — GENERATE OUTPUT based on your chosen strategy.

If DIRECT_CONVERSATION:
- reframe: One sharp sentence that reframes how the user sees their position — gives them ground to stand on.
- breakdown: 2-3 sentences of executive-level analysis of what is actually happening in this situation. Name the real dynamic, not the surface complaint.
- script: A full conversation script. Each field is one declarative sentence — no qualifiers.
  - opening: The first thing they say. Direct. Calm. No apology.
  - issue: The specific behavior or situation named plainly.
  - impact: What this is affecting — results, team, credibility, relationship.
  - ask: The specific expectation or request stated clearly.
  - pushback: One firm, non-emotional response for when they resist.
- tactics: 3 specific behavioral actions to execute in the next 48 hours. Number them. Each has a verb, object, and timeframe.
- nextSteps: The single most important action in the next 24 hours. Write the exact message or opening line.

If INDIRECT_INFLUENCE:
- reframe: One sharp sentence that reframes the situation as a positioning and influence challenge, not a confrontation.
- breakdown: 2-3 sentences naming the real dynamic and why direct confrontation is not the highest-leverage move here.
- script: null
- tactics: 4 specific influence actions — framing, visibility moves, ally-building, repositioning. Each is concrete and executable.
- nextSteps: The single action that shifts the dynamic most — with exact language for how to execute it.

If STRATEGIC_CONTAINMENT:
- reframe: One sharp sentence that reframes the situation as a protection and positioning challenge.
- breakdown: 2-3 sentences naming why containment is the right play — what changes if the user tries to confront directly.
- script: null
- tactics: 4 specific protection and positioning actions — documentation, escalation paths, reputation management, exit preparation if relevant.
- nextSteps: The single most important protective action in the next 24 hours — specific, time-bound.

You MUST respond with EXACTLY this JSON structure. No markdown. No code fences. Raw JSON only:

{
  "strategy": "DIRECT_CONVERSATION",
  "reframe": "One sharp sentence specific to their situation",
  "breakdown": "2-3 sentences of executive analysis of the real dynamic",
  "script": {
    "opening": "The exact first sentence to say",
    "issue": "The specific behavior named plainly",
    "impact": "What this is affecting",
    "ask": "The specific expectation or request",
    "pushback": "The firm response to resistance"
  },
  "tactics": [
    "1. Specific action with verb, object, timeframe",
    "2. Specific action with verb, object, timeframe",
    "3. Specific action with verb, object, timeframe"
  ],
  "nextSteps": ["The single most important action — write the exact message or opening line"]
}

When strategy is INDIRECT_INFLUENCE or STRATEGIC_CONTAINMENT, set script to null and include 4 tactics instead of 3.`;

router.post("/coaching/generate", async (req, res) => {
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
      max_completion_tokens: 2000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = (completion.choices[0]?.message?.content ?? "{}").trim();
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(stripped);
    } catch {
      parsed = buildFallback();
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "OpenAI coaching error");
    res.status(500).json({ error: "Failed to generate coaching response" });
  }
});

function buildFallback() {
  return {
    strategy: "DIRECT_CONVERSATION",
    reframe: "The situation is clearer than it feels — you know what needs to happen.",
    breakdown: "You are in a pattern of waiting for the right moment instead of creating it. The right moment is now. The longer you wait, the more the other person's behavior becomes the established norm.",
    script: {
      opening: "I want to talk about something that has been affecting my work.",
      issue: "There is a pattern I need to address directly with you.",
      impact: "This is affecting my ability to deliver and my standing on this team.",
      ask: "I need this to change, and I want to agree on how.",
      pushback: "I hear you. And this still needs to be resolved. Can we agree on a path forward?",
    },
    tactics: [
      "1. Today, write down exactly what you want to say in one paragraph — no hedging, no qualifiers.",
      "2. Schedule the conversation for within the next 48 hours. Put it on the calendar.",
      "3. Before the meeting, say your opening sentence out loud three times until it stops feeling uncomfortable.",
    ],
    nextSteps: ["Send a calendar invite today with the subject: Quick alignment — something I need to discuss. No further explanation in the invite."],
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
  return `Coaching scenario: ${flowNames[flowType] ?? flowType}\n\nUser's situation:\n${lines}\n\nEvaluate the situation, choose the highest-leverage strategy, and generate coaching output.`;
}

export default router;
