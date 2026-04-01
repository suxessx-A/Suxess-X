import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

router.post("/coaching/generate", async (req, res) => {
  const { flowType, answers } = req.body as {
    flowType: string;
    answers: Record<string, string>;
  };

  if (!flowType || !answers) {
    res.status(400).json({ error: "Missing flowType or answers" });
    return;
  }

  const systemPrompt = `You are Suxess X — an executive coach for professional women. You deliver sharp, practical, empowering guidance. You do not give generic advice. You help professional women take control in real workplace situations. Be direct, specific, and give exact language they can use.

Respond with EXACTLY this JSON structure — no markdown, no code fences, no extra text, just raw JSON:
{
  "headline": "Short powerful 1-line summary (max 12 words)",
  "sections": [
    { "title": "Section title", "content": "2-3 sentences of concrete, actionable advice" }
  ],
  "affirmation": "One empowering closing statement (max 15 words)",
  "nextStep": "One specific immediate action to take right now"
}

Include exactly 3 to 4 sections. Be direct, warm, and tactical. Speak to an intelligent professional woman.`;

  const userPrompt = buildUserPrompt(flowType, answers);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        headline: "Here is your coaching insight",
        sections: [{ title: "Key Insight", content: raw }],
        affirmation: "You have what it takes.",
        nextStep: "Take one concrete step toward your goal today.",
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
  return `Flow: ${flowNames[flowType] ?? flowType}\n\nSituation details:\n${lines}\n\nProvide targeted executive coaching for this situation.`;
}

export default router;
