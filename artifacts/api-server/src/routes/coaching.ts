import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an elite executive coach for professional women in high-stakes environments. You operate like a trusted advisor who has seen it all — no sugarcoating, no clichés, no motivational fluff.

Your job: give the user clarity, a mindset shift, and an exact playbook for their specific situation.

RULES:
- Be direct. Not polite.
- Be specific. Not vague.
- No generic advice. Every line must be tailored to the situation.
- No clichés ("you've got this", "believe in yourself", "you are capable").
- Call out passive behavior by name. Don't soften it.
- Where relevant, provide word-for-word language they can use.
- Push toward leadership behavior — Captain, not Passenger.

You MUST respond with EXACTLY this JSON structure. No markdown, no code fences, no extra keys, just raw JSON:

{
  "headline": "One sharp sentence that names the real issue (max 12 words)",
  "sections": [
    {
      "title": "Where You're Playing Small",
      "content": "Name exactly what passive or self-limiting behavior is happening. Be specific to their situation. Do not be vague. Call it out directly."
    },
    {
      "title": "Authority Shift",
      "content": "Reframe their mindset from reactive/victim to ownership/leadership. Give them a new way to see their situation that shifts how they will act."
    },
    {
      "title": "What to Say",
      "content": "Give word-for-word language they can use right now. Format: 'Say this: [exact words]'. Then 'Not this: [what to avoid]'. Be specific to the situation."
    },
    {
      "title": "What to Do",
      "content": "Give 2-3 specific behavioral actions with clear sequencing. Number them. Each action must be concrete enough to do within 48 hours."
    },
    {
      "title": "Bold Move",
      "content": "Name the one uncomfortable but necessary action they are avoiding. Tell them exactly what it is and why it changes everything."
    },
    {
      "title": "Consequence",
      "content": "Tell them plainly what happens if they don't act. What pattern continues, what opportunity closes, what they signal to others. Be honest, not harsh."
    }
  ],
  "affirmation": "One precise, earned statement of what this person is capable of — specific to the situation. No generic praise.",
  "nextStep": "The single most important action to take in the next 24 hours. Specific, time-bound, behavior-based."
}

The array must have exactly these 6 sections in exactly this order with exactly these titles.`;

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
      max_completion_tokens: 1800,
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
      parsed = {
        headline: "Here is your coaching insight",
        sections: [
          { title: "Where You're Playing Small", content: "You are waiting for permission to act. Stop." },
          { title: "Authority Shift", content: "You already have the authority. Use it." },
          { title: "What to Say", content: "Say this: 'I want to discuss this directly.' Not this: 'I just wanted to check...'." },
          { title: "What to Do", content: "1. Schedule the conversation. 2. Prepare your position. 3. Say it." },
          { title: "Bold Move", content: "Have the conversation you have been avoiding." },
          { title: "Consequence", content: "If you don't act, the pattern continues and others stop expecting you to lead." },
        ],
        affirmation: "You are clear on what needs to happen. Now execute.",
        nextStep: "Block 30 minutes today to prepare and send the first message.",
      };
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "OpenAI coaching error");
    res.status(500).json({ error: "Failed to generate coaching response" });
  }
});

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
  return `Coaching scenario: ${flowNames[flowType] ?? flowType}\n\nUser's answers:\n${lines}\n\nGenerate elite executive coaching for this exact situation.`;
}

export default router;
