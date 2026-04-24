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
        "A peer or colleague",
        "Someone I manage",
        "A client or stakeholder",
        "HR or senior leadership",
      ],
    },
    {
      key: "topic",
      question: "What is the conversation about?",
      options: [
        "I need to give feedback",
        "I need to address a conflict",
        "I need to set a boundary",
        "I feel I have been treated unfairly",
        "I need to share difficult news",
      ],
    },
    {
      key: "feeling",
      question: "How are you feeling going into it?",
      options: [
        "Anxious and uncertain",
        "Frustrated but trying to stay calm",
        "Confident but worried about the reaction",
        "Dreading it and putting it off",
        "Ready — I just need a clear plan",
      ],
    },
    {
      key: "goal",
      question: "What does a successful outcome look like?",
      options: [
        "We reach a mutual understanding",
        "Their behaviour changes",
        "I say what I need to say and feel heard",
        "We agree on a clear path forward",
        "I hold my position and maintain the relationship",
      ],
    },
  ],

  stuck: [
    {
      key: "root_cause",
      phase: "Phase 1: Diagnosis",
      question: "What is really holding you back right now?",
      subtext: "Be honest — this shapes everything that follows",
      options: [
        "I am not clear on what I actually want next",
        "I know what I want but I do not know how to get there",
        "I know what I want and how — but something or someone is in the way",
        "I have lost confidence in myself and my direction",
        "I am climbing the wrong mountain and I know it",
      ],
    },
    {
      key: "strengths",
      phase: "Phase 2: Clarity",
      question: "Which of these best describe what you are genuinely good at?",
      subtext: "Choose your top 3",
      options: [
        "Strategic thinking and shaping direction",
        "Influencing and communicating with impact",
        "Solving complex problems with data",
        "Leading projects and managing stakeholders",
        "Building and developing teams",
        "Deep technical or domain expertise",
        "Commercial and client relationship management",
        "Designing and improving how things work",
        "Financial thinking and capital decisions",
        "Creating and innovating new approaches",
      ],
      multiSelect: true,
      minSelect: 2,
      maxSelect: 3,
    },
    {
      key: "wants",
      phase: "Phase 2: Clarity",
      question: "What do you want MORE of in your next chapter?",
      subtext: "Choose exactly 3",
      options: [
        "Real ownership and autonomy",
        "Strategic and creative problem-solving",
        "Visible impact and measurable results",
        "Leading and developing people",
        "Cross-functional exposure and influence",
        "Sustainability and work-life integration",
        "Significant step up in compensation",
        "Connection to a mission that matters",
        "Building something new",
      ],
      multiSelect: true,
      minSelect: 3,
      maxSelect: 3,
    },
    {
      key: "directions",
      phase: "Phase 3: Direction",
      question: "Which directions are genuinely calling to you — even faintly?",
      subtext: "Choose 2 that feel real",
      options: [
        "Senior individual contributor in my current area",
        "People leader or team lead",
        "General management or cross-functional role",
        "Strategic, advisory, or consulting role",
        "Move to a new industry or function entirely",
        "Build something of my own",
        "Executive or C-suite track",
      ],
      multiSelect: true,
      minSelect: 1,
      maxSelect: 2,
    },
    {
      key: "success",
      phase: "Phase 4: Reality",
      question: "What does success look like for you in 3 years?",
      options: [
        "Leading a team with real accountability for outcomes",
        "Recognised as the go-to expert in my domain",
        "Running my own projects with full autonomy",
        "At the table for decisions that actually matter",
        "Building something of my own",
        "Earning significantly more than I do today",
      ],
    },
  ],

  speak_up: [
    {
      key: "blocker",
      question: "What holds you back most in the moment?",
      options: [
        "My confidence drops before I speak",
        "Someone else says it first",
        "I cannot find a natural entry point",
        "I worry the point is not strong enough",
        "I am afraid of being wrong in front of others",
      ],
    },
    {
      key: "pattern",
      question: "What actually happens when the moment arrives?",
      options: [
        "I start to speak then pull back at the last second",
        "I wait for the perfect entry — it never comes",
        "Someone else says my point while I am still composing it",
        "I soften what I say so it sounds like a question",
        "I say it in my head but not out loud",
      ],
    },
    {
      key: "meeting_type",
      question: "What type of meeting is this for?",
      options: [
        "Team meeting or standup",
        "Leadership or executive presentation",
        "Cross-functional or project meeting",
        "Client or stakeholder review",
        "Large group or all-hands",
      ],
    },
    {
      key: "cost",
      question: "What does staying quiet cost you?",
      options: [
        "My ideas get attributed to someone else",
        "I am not seen as a strategic contributor",
        "The conversation goes in the wrong direction",
        "I lose confidence in the next meeting too",
        "I feel smaller in the room than I actually am",
      ],
    },
  ],

  executive_visibility: [
    {
      key: "challenge",
      question: "What is your main challenge with being visible to leadership?",
      options: [
        "They do not know what I am working on",
        "I struggle to frame my work as business impact",
        "I explain too much and lose them",
        "I am seen as execution, not strategy",
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
        "Written updates — email, Slack, or documents",
        "One-on-ones with my manager",
        "Formal presentations or reviews",
        "I rarely share directly — they do not see my work",
      ],
    },
    {
      key: "gap",
      question: "What is your biggest positioning gap?",
      options: [
        "I lead with tasks, not outcomes",
        "I do not know how to turn my work into a business story",
        "I include too much detail",
        "I wait to be asked instead of proactively sharing",
        "I downplay what I have delivered",
      ],
    },
  ],

  negotiate: [
    {
      key: "situation_type",
      question: "What is your situation?",
      options: [
        "Starting a new role",
        "My role has grown",
        "I believe I am underpaid",
      ],
    },
    {
      key: "what",
      question: "What are you negotiating?",
      options: [
        "Salary or total compensation",
        "A promotion or title change",
        "Project scope or delivery timelines",
        "Resources, budget, or headcount",
        "Contract terms with a client or partner",
      ],
    },
    {
      key: "timing",
      question: "Where are you in the process?",
      options: [
        "I have not brought it up yet",
        "In active discussion",
        "I have received a first offer",
        "I received a pushback or a no",
        "Approaching a final decision",
      ],
    },
    {
      key: "target",
      question: "What outcome are you aiming for?",
      subtext: "Be as specific as you can — this shapes your script",
      options: [
        "A specific salary figure I have in mind",
        "A promotion to the next level",
        "A meaningful increase — exact number to be confirmed",
        "Better terms on an offer I have received",
        "Resources or scope I have clearly defined",
      ],
    },
    {
      key: "leverage",
      question: "What is your current leverage?",
      options: [
        "Strong recent performance and results",
        "External offer or market data",
        "Unique skills or knowledge the organisation needs",
        "Key relationships and trust at senior level",
        "I am not sure — I need help identifying it",
      ],
    },
    {
      key: "fear",
      question: "What worries you most?",
      options: [
        "They will say no and I will feel embarrassed",
        "It will damage the relationship",
        "I will ask for too much or too little",
        "They will think I am being difficult",
        "I will cave under pressure",
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
        "I am afraid of failing or being found out",
        "I feel undervalued and invisible",
        "I am comparing myself to others and losing",
      ],
    },
    {
      key: "trigger",
      question: "What triggered this feeling?",
      options: [
        "A setback or failure at work",
        "Feedback that stung",
        "Watching someone else succeed or get ahead",
        "Pressure from a big upcoming challenge",
        "A pattern I keep repeating",
      ],
    },
    {
      key: "pattern",
      question: "What is your mind doing with it?",
      options: [
        "Treating it as proof I am not good enough",
        "Turning it into a worst-case future",
        "Comparing myself to others and coming up short",
        "Going over it in circles without resolution",
        "Avoiding the thing that is causing the anxiety",
      ],
    },
  ],
};