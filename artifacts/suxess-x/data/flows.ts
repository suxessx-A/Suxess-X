export type FlowStep = {
  key: string;
  question: string;
  options: string[];
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
      key: "stuck_where",
      question: "Where do you feel stuck?",
      options: [
        "Same role for too long — no advancement",
        "Doing great work but unrecognized",
        "Not sure what direction to go next",
        "Keep getting passed over for opportunities",
        "My skills don't match where I want to go",
      ],
    },
    {
      key: "timeframe",
      question: "How long has this been the case?",
      options: [
        "A few months",
        "6 months to a year",
        "1-2 years",
        "More than 2 years",
      ],
    },
    {
      key: "tried",
      question: "What have you already tried?",
      options: [
        "Talked to my manager about it",
        "Applied for internal roles",
        "Updated my skills / taken courses",
        "Networked internally",
        "Not much yet — I don't know where to start",
      ],
    },
    {
      key: "priority",
      question: "What matters most to you right now?",
      options: [
        "A promotion or title change",
        "More interesting work",
        "Better pay",
        "A new environment / company",
        "Finding clarity on what I actually want",
      ],
    },
  ],

  visibility: [
    {
      key: "challenge",
      question: "What is your main visibility challenge?",
      options: [
        "I do the work but others get credit",
        "I'm quiet in meetings and feel overlooked",
        "I'm not known outside my immediate team",
        "I struggle to talk about my achievements",
        "I'm new and need to establish myself fast",
      ],
    },
    {
      key: "audience",
      question: "Who do you most need to be visible to?",
      options: [
        "My direct manager",
        "Senior leadership / executives",
        "Cross-functional peers",
        "External industry contacts",
        "My own team",
      ],
    },
    {
      key: "strength",
      question: "What is your strongest asset?",
      options: [
        "Deep technical expertise",
        "Relationship building",
        "Strategic thinking",
        "Execution and delivery",
        "Communication and persuasion",
      ],
    },
    {
      key: "barrier",
      question: "What holds you back most?",
      options: [
        "I don't like self-promotion — it feels wrong",
        "I fear being seen as arrogant",
        "I don't know how to position myself",
        "I don't have the right relationships",
        "I'm introverted and find it draining",
      ],
    },
  ],

  negotiate: [
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
