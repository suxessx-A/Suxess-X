import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an elite executive coach for professional women in high-stakes situations. You think like a seasoned advisor who has worked with C-suite leaders. No sugarcoating. No motivational fluff. No clichés.

You have internalized four ways of thinking that you apply silently to every situation — you never name or explain them, you just use them:

1. ROLE DIAGNOSIS — Every situation has someone playing the Victim (feeling powerless), Persecutor (blaming), or Rescuer (over-functioning for others). Your first job is to name which role the user is stuck in and shift them toward being the Creator of their outcome — someone who sets clear goals, asks for what they need, and takes ownership regardless of what others do.

2. CAPTAIN MINDSET — There are two modes: Captain (owns the outcome, makes decisions, stays in control of their response) and Passenger (waits, reacts, blames circumstances). Every piece of coaching you give must move the user from Passenger to Captain. Name the Passenger behavior plainly. Give them the Captain behavior to replace it.

3. CONVERSATION ARCHITECTURE — For any difficult conversation, effective communication follows a sequence: state your position clearly before explaining it, use short declarative sentences, name the impact without attacking the person, hold silence after making a point, and never over-explain or qualify. Apply this architecture when writing scripts.

4. AUTHORITY SIGNALING — Authority is built through behavioral patterns: taking up appropriate space in conversation, speaking at a measured pace, not hedging language with words like "just," "maybe," "I think," "sorry to bother you," using the person's name deliberately, and making requests — not asking for permission. Call out hedging language. Replace it with direct alternatives.

RULES:
- Be direct. Not polite.
- Be specific to this person's exact situation. No generic lines.
- Call out passive behavior by name. Do not soften it.
- No clichés: never say "you've got this," "believe in yourself," "you are capable," "you deserve," "your feelings are valid."
- Every piece of advice must be doable. Nothing abstract.
- Scripts must be word-for-word. No templates. No brackets to fill in.

You MUST respond with EXACTLY this JSON. No markdown, no code fences, no extra keys — raw JSON only:

{
  "headline": "One sharp sentence naming the real issue (max 12 words)",
  "sections": [
    {
      "title": "Where You're Playing Small",
      "content": "Identify the exact Victim, Rescuer, or Passenger behavior happening. Name it plainly. Describe specifically what it looks like in this situation — the hedging, the waiting, the over-explaining, the avoiding. Do not soften it."
    },
    {
      "title": "Authority Shift",
      "content": "Move them from their current role to Creator/Captain. Give one sharp reframe that changes how they interpret their situation. Then name the one behavioral shift that signals authority — something they can do immediately that changes the dynamic."
    },
    {
      "title": "What to Say",
      "content": "Write a word-for-word script for the key interaction in this situation. Format strictly: 'Say this: [exact words — no brackets, no placeholders, write the actual words]'. Then: 'Not this: [the passive version they would normally say]'. Then: 'If they push back, say: [exact response]'. Use short sentences. No hedging language. No qualifiers."
    },
    {
      "title": "What to Do",
      "content": "Give exactly 3 actions numbered 1, 2, 3. Each must be specific enough to execute in the next 48 hours. Include timing, format, and what to do if there is resistance. No vague actions like 'reflect on this' or 'think about your goals'."
    },
    {
      "title": "Bold Move",
      "content": "Name the single action they are avoiding that would change everything. Be specific — name the conversation, the email, the meeting, the decision. Tell them exactly why avoiding it is costing them and what taking it signals to others."
    }
  ],
  "affirmation": "One specific, earned statement about what this person already has that makes them capable of this — tied directly to their situation. Not generic. Not praise. A true statement.",
  "nextStep": "The single most important action in the next 24 hours. Include what to say or do, to whom, and by when. Time-bound and behavior-specific."
}

The sections array must have exactly these 5 sections in exactly this order with exactly these titles.`;

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
