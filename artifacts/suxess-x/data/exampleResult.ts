import { CoachingResult } from "@/context/CoachingContext";

export const EXAMPLE_RESULT: CoachingResult = {
  problemType: "AVOIDING_CHALLENGER",
  strategy: "DIRECT_CONVERSATION",
  mode: "Challenger",
  roleShift: "Deferring to keep the peace → Setting the standard",
  behavioralObjective: "Shift my manager's behavior on scope creep within 48 hours",
  reframe: "Silence is not patience. It is permission.",
  breakdown:
    "The gap is strategy — you know what needs to be said but not how to say it without it becoming a confrontation. You've been telling yourself that waiting for the right moment keeps the relationship intact. It has cost you credibility, three missed deadlines, and a team watching to see if you'll move.",
  trigger: {
    triggerName: "Fear that naming the issue will permanently damage the relationship",
    energyShift: "Exhale for 4 counts. Drop your shoulders. Speak from your chest, not your throat.",
    repetitionStatement: "I set standards and hold them.",
  },
  identityAnchor: "You are someone who names what is not working and moves anyway.",
  script: {
    opening: "I want to talk about something that's been affecting my ability to deliver.",
    issue:
      "You'd agree scope has shifted three times in the past month. Here's what I've observed: decisions are being made without my input that directly change my deliverables. What's your read on that?",
    impact:
      "The effect has been missed deadlines and a team that doesn't know which version of the project they're executing. That puts Q3 delivery at risk.",
    ask: "What I need is a clear decision-making process — no scope change without a conversation with me first, agreed by end of this week. [Pause 3–5 seconds. Say nothing. Let them respond first.]",
    pushback:
      "I hear you. And the pattern needs to change. I'm not asking for perfection — I'm asking for a process we both commit to.",
  },
  sections: [
    {
      title: "State Set",
      content:
        "Five items. Short sentences.\n\nAnchor: I address what matters directly and without apology.\nPace: Speak 20% slower than feels right. Slower signals authority.\nPosition: Seated. Still. Arms uncrossed before they speak.\nTiming: Monday morning — before the week's urgency sets the tone.\nSetting: Private office. Booked. Not a hallway exchange.",
      premium: false,
    },
    {
      title: "Script Variations",
      content:
        "Softer (if the relationship is earlier or stakes feel higher): 'I want to make sure we're aligned on how scope decisions get made — I've been feeling the gap and I think we can close it quickly.'\n\nStronger (if the first attempt is minimised): 'I want to be direct — the current pattern isn't workable for me. I need us to land on a process today, not next week.'",
      premium: false,
    },
    {
      title: "Tactical Delivery",
      content:
        "When: Monday, first 30 minutes of the day.\nWhere: Private office. Booked space. Not over Slack.\nPace: 20% slower than natural. Lower register on key words.\nSilence: After stating the expectation, stop. The first person to fill the silence loses positioning. Hold it.",
      premium: false,
    },
    {
      title: "Standard Setter",
      content:
        "Three actions within 48 hours:\n1. Send a follow-up email documenting what was agreed — subject line: 'Scope Decision Process — Summary.'\n2. Brief your team on the new process before the next stand-up.\n3. The next scope request that arrives without a conversation — decline it in writing and reference the agreement.",
      premium: false,
    },
  ],
  nextSteps: [
    "1. Schedule the conversation for Monday morning — put it in both calendars today.",
    "2. Read State Set before you enter. Say the anchor out loud once.",
    "3. Open with the exact first line from the script — do not improvise it.",
  ],
  closingQuestion:
    "What are you willing to name this week that you've been managing around instead?",
};
