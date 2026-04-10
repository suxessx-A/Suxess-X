export type FlowStep = {
  key: string;
  phase?: string;
  question: string;
  subtext?: string;
  options: string[];
  multiSelect?: boolean;
  minSelect?: number;
  maxSelect?: number;
};

export const flows: Record<string, FlowStep[]> = {
  conversation: [
    {
      key: "who",
      question: "Who is this conversation with?",
      options: [
        "My manager",
        "A peer / colleague",
        "Someone I manage",
        "A client or stakeholder",
        "HR or leadership",
      ],
    },
    {
      key: "topic",
      question: "What is the conversation about?",
      options: [
        "I need to give feedback",
        "I need to address a conflict",
        "I need to set a boundary",
        "I feel I've been treated unfairly",
        "I need to share bad news",
      ],
    },
    {
      key: "feeling",
      question: "How are you feeling going into it?",
      options: [
        "Anxious and uncertain",
        "Angry but trying to stay calm",
        "Confident but worried about reaction",
        "Dreading it — putting it off",
        "Ready but need a plan",
      ],
    },
    {
      key: "goal",
      question: "What does success look like for you?",
      options: [
        "We reach a mutual understanding",
        "They change their behavior",
        "I say what I need to say and feel heard",
        "We agree on a path forward",
        "I maintain the relationship and my dignity",
      ],
    },
  ],

  stuck: [
    {
      key: "skills",
      phase: "Phase 1: Clarity",
      question: "Which of these best describe your transferable strengths?",
      subtext: "Choose your top 3–5",
      options: [
        "Strategic thinking & planning",
        "Communication & influencing others",
        "Data analysis & problem-solving",
        "Project & stakeholder management",
        "Team leadership & development",
        "Technical or domain expertise",
        "Client & partner relationship management",
        "Process design & improvement",
        "Financial or budget management",
        "Creative direction & innovation",
      ],
      multiSelect: true,
      minSelect: 3,
      maxSelect: 5,
    },
    {
      key: "wants_more",
      phase: "Phase 1: Clarity",
      question: "What do you want MORE of in your next chapter?",
      subtext: "Choose exactly 3",
      options: [
        "Autonomy and real ownership",
        "Creative or strategic problem-solving",
        "Visible impact and measurable results",
        "People leadership and team development",
        "Cross-functional exposure",
        "Technical depth and mastery",
        "Work-life balance and sustainability",
        "Compensation and meaningful recognition",
        "Connection to a mission I believe in",
      ],
      multiSelect: true,
      minSelect: 3,
      maxSelect: 3,
    },
    {
      key: "wants_less",
      phase: "Phase 1: Clarity",
      question: "What do you want LESS of going forward?",
      subtext: "Choose exactly 3",
      options: [
        "Micromanagement and lack of trust",
        "Repetitive, low-impact work",
        "Unclear goals or constantly shifting priorities",
        "Office politics and performative culture",
        "Too many meetings, not enough doing",
        "Isolation or lack of collaboration",
        "Limited growth ceiling",
        "Chronic under-resourcing or firefighting",
        "Invisible work with no recognition",
      ],
      multiSelect: true,
      minSelect: 3,
      maxSelect: 3,
    },
    {
      key: "directions",
      phase: "Phase 2: Direction",
      question: "Which directions are genuinely calling to you — even faintly?",
      subtext: "Choose 2–3 that resonate",
      options: [
        "Senior individual contributor in my current function",
        "People manager or team lead",
        "Cross-functional or general management",
        "Strategic, advisory, or consulting role",
        "Move to a new industry or entirely new function",
        "Entrepreneur or independent operator",
        "Executive or C-suite track",
        "Portfolio career: multiple roles or revenue streams",
      ],
      multiSelect: true,
      minSelect: 2,
      maxSelect: 3,
    },
    {
      key: "success",
      phase: "Phase 3: Reality Check",
      question: "What does success look like for you in 3 years?",
      options: [
        "Leading a team with real accountability for outcomes",
        "Recognized as the go-to expert in my domain",
        "Running my own projects with full autonomy",
        "At the table for decisions that actually matter",
        "Building something of my own",
        "Earning significantly more than I do today",
      ],
    },
    {
      key: "outreach",
      phase: "Phase 4: Action",
      question: "Who could you realistically speak with in the next 7 days?",
      subtext: "Choose 2 people you could actually contact",
      options: [
        "A former colleague who made a similar transition",
        "Someone I follow whose career path I admire",
        "A mentor or sponsor who knows my work well",
        "Someone from a professional community or event",
        "I don't have the contact yet — I need to build it first",
      ],
      multiSelect: true,
      minSelect: 1,
      maxSelect: 2,
    },
  ],

  speak_up: [
    {
      key: "blocker",
      question: "What holds you back most?",
      options: [
        "My confidence drops before I speak",
        "Someone else says it first",
        "I can't find a natural entry point",
        "I worry the point isn't good enough",
        "I'm afraid of being wrong in front of others",
      ],
    },
    {
      key: "audience",
      question: "Who matters most when you speak up?",
      options: [
        "My direct manager",
        "Senior leadership / executives",
        "Cross-functional peers",
        "A client or external stakeholder",
        "My own team",
      ],
    },
    {
      key: "meeting_type",
      question: "What type of meeting is this?",
      options: [
        "Team meeting or standup",
        "Leadership or exec presentation",
        "Cross-functional or project meeting",
        "1:1 with my manager",
        "Client or stakeholder review",
      ],
    },
    {
      key: "cost",
      question: "What happens when you stay quiet?",
      options: [
        "Someone else gets credit for the idea",
        "The moment passes and I move on",
        "I draft what I'd have said — in my head",
        "I say it privately after, not in the room",
        "I feel smaller than I should in that room",
      ],
    },
  ],

  executive_visibility: [
    {
      key: "challenge",
      question: "What's your main challenge with leadership visibility?",
      options: [
        "They don't know what I'm working on",
        "I struggle to frame my work as business impact",
        "I explain too much and lose them",
        "I'm seen as execution, not strategy",
        "I only present to them in formal settings",
      ],
    },
    {
      key: "audience",
      question: "Who do you most need to be visible to?",
      options: [
        "My skip-level (my manager's manager)",
        "The executive team",
        "Cross-functional leaders",
        "External stakeholders or clients",
        "A wider industry audience",
      ],
    },
    {
      key: "medium",
      question: "How do you most often share your work?",
      options: [
        "In team or leadership meetings",
        "Written updates (email, Slack, docs)",
        "1:1s with my manager",
        "Formal presentations or reviews",
        "I rarely share directly — they don't see my work",
      ],
    },
    {
      key: "gap",
      question: "What's your biggest positioning gap?",
      options: [
        "I lead with tasks, not outcomes",
        "I don't know how to turn my work into a business story",
        "I include too much detail",
        "I wait to be asked instead of leading",
        "I downplay what I've delivered",
      ],
    },
  ],

  negotiate: [
    {
      key: "situation_type",
      question: "What's your situation?",
      options: [
        "Starting a new role",
        "My role has grown",
        "I believe I'm underpaid",
      ],
    },
    {
      key: "what",
      question: "What are you negotiating?",
      options: [
        "Salary or compensation",
        "A promotion",
        "Project scope or deadlines",
        "Resources or headcount",
        "Contract terms with a client",
      ],
    },
    {
      key: "timing",
      question: "Where are you in the process?",
      options: [
        "About to start — haven't brought it up yet",
        "In active discussion",
        "Received a first offer — deciding how to respond",
        "Received a pushback or 'no'",
        "Nearing a final decision",
      ],
    },
    {
      key: "leverage",
      question: "What is your current leverage?",
      options: [
        "Strong recent performance / results",
        "External offer or market data",
        "Unique skills or knowledge",
        "Key relationships and trust",
        "I'm not sure — I need help identifying it",
      ],
    },
    {
      key: "fear",
      question: "What worries you most?",
      options: [
        "They'll say no and I'll feel embarrassed",
        "It will damage the relationship",
        "I'll ask for too much or too little",
        "They'll think I'm being difficult",
        "I'll cave under pressure",
      ],
    },
  ],

  mindset: [
    {
      key: "feeling",
      question: "What is weighing on you right now?",
      options: [
        "I doubt myself and my abilities",
        "I feel overwhelmed and burned out",
        "I'm afraid of failing or being exposed",
        "I feel undervalued and unseen",
        "I'm comparing myself to others and losing",
      ],
    },
    {
      key: "trigger",
      question: "What triggered this feeling?",
      options: [
        "A setback or failure at work",
        "Feedback that stung",
        "Watching someone else succeed",
        "Pressure from a big upcoming challenge",
        "A pattern I keep repeating",
      ],
    },
    {
      key: "need",
      question: "What do you need most right now?",
      options: [
        "Perspective — I've lost mine",
        "A concrete plan to feel in control",
        "Someone to tell me I'm enough",
        "Ways to stop the mental spiral",
        "Motivation to keep going",
      ],
    },
  ],
};
