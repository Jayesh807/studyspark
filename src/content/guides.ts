export type GuideCategorySlug =
  | "study-planning"
  | "exam-preparation"
  | "productivity"
  | "typing"
  | "pdf-tools";

export interface GuideCategory {
  slug: GuideCategorySlug;
  title: string;
  description: string;
}

export interface GuideRecord {
  slug: string;
  title: string;
  question: string;
  description: string;
  category: GuideCategorySlug;
  publishedAt: string;
  updatedAt: string;
  readTime: string;
  reviewed: boolean;
  editor: string;
  reviewerNote: string;
  relatedFeatures: string[];
  relatedGuides: string[];
  checklist: string[];
  sections: { heading: string; body: string[] }[];
}

export const GUIDE_CATEGORIES: GuideCategory[] = [
  {
    slug: "study-planning",
    title: "Study Planning",
    description: "Practical ways to turn syllabus pressure into a weekly plan.",
  },
  {
    slug: "exam-preparation",
    title: "Exam Preparation",
    description: "Revision methods, practice routines, and exam-week decisions.",
  },
  {
    slug: "productivity",
    title: "Productivity",
    description: "Focus, notes, weekly review, and realistic study habits.",
  },
  {
    slug: "typing",
    title: "Typing",
    description: "Accuracy-first typing practice for notes, assignments, and tests.",
  },
  {
    slug: "pdf-tools",
    title: "PDF Tools",
    description: "Ways to use PDFs and generated questions responsibly.",
  },
];

export const GUIDES: GuideRecord[] = [
  guide({
    slug: "how-to-create-a-realistic-revision-plan",
    title: "How to Create a Realistic Revision Plan",
    question: "How do I turn a syllabus into a plan I can follow?",
    description:
      "A practical revision planning method for students who need to divide topics, set priorities, and avoid last-minute guessing.",
    category: "study-planning",
    relatedFeatures: ["revision-planner", "study-analytics"],
    relatedGuides: ["how-to-divide-a-syllabus-before-an-examination"],
    checklist: [
      "List every topic before choosing dates.",
      "Mark difficult topics early.",
      "Keep each revision task small enough for one session.",
      "Reserve review time for mistakes, not only new chapters.",
    ],
    sections: [
      {
        heading: "Start with the full syllabus",
        body: [
          "A revision plan fails when it starts from mood instead of material. Write every chapter, unit, or lecture topic before deciding what to study first.",
          "Group small items together and split large chapters into parts that can be revised in one sitting.",
        ],
      },
      {
        heading: "Give each topic a priority",
        body: [
          "Use three simple labels: strong, needs review, and weak. Weak topics should appear earlier in the plan because they need more than one pass.",
          "Do not hide difficult chapters at the end of the week. Put them where your attention is usually best.",
        ],
      },
      {
        heading: "Use StudySpark as the working example",
        body: [
          "In StudySpark, a student can add exam topics to the revision planner, set weak chapters as high priority, then use focus sessions to work through them.",
          "At the end of the week, analytics can show whether the planned subjects actually received time.",
        ],
      },
    ],
  }),
  guide({
    slug: "how-to-divide-a-syllabus-before-an-examination",
    title: "How to Divide a Syllabus Before an Examination",
    question: "How do I split large exam material without guessing?",
    description:
      "A syllabus-splitting workflow for students who have many chapters and limited revision days.",
    category: "study-planning",
    relatedFeatures: ["revision-planner", "exam-mode"],
    relatedGuides: ["how-to-create-a-realistic-revision-plan"],
    checklist: [
      "Separate scoring topics from background topics.",
      "Split large chapters into question-sized parts.",
      "Schedule weak topics before easy topics.",
      "Leave the final day for mixed practice and corrections.",
    ],
    sections: [
      {
        heading: "Divide by revision effort",
        body: [
          "A chapter list is not enough. One chapter may take ten minutes and another may take three study blocks.",
          "Estimate effort by asking how many question types, formulas, definitions, or diagrams the topic contains.",
        ],
      },
      {
        heading: "Build topic groups",
        body: [
          "Create groups such as formulas, definitions, diagrams, examples, and mistakes. This makes revision more specific than simply writing a chapter name.",
          "StudySpark revision topics can mirror these groups so progress is easier to update after each session.",
        ],
      },
    ],
  }),
  guide({
    slug: "active-recall-explained-with-a-student-example",
    title: "Active Recall Explained with a Student Example",
    question: "How do I test myself without just rereading?",
    description:
      "A plain-language active recall guide with a student example and review checklist.",
    category: "exam-preparation",
    relatedFeatures: ["revision-planner"],
    relatedGuides: ["spaced-repetition-a-practical-weekly-schedule"],
    checklist: [
      "Close the notes before answering.",
      "Write or speak the answer from memory.",
      "Check the source and mark missing points.",
      "Repeat the weak part after a break.",
    ],
    sections: [
      {
        heading: "What active recall means",
        body: [
          "Active recall means trying to bring an answer out of memory before checking the material. It is different from rereading because it shows what you can retrieve without help.",
          "For example, after reading a biology section, close the notes and write the stages of mitosis from memory.",
        ],
      },
      {
        heading: "Use a mistake list",
        body: [
          "The useful part is not only the answer. It is the gap between your answer and the source.",
          "Add that gap to a revision topic or task so it appears again in your plan.",
        ],
      },
    ],
  }),
  guide({
    slug: "spaced-repetition-a-practical-weekly-schedule",
    title: "Spaced Repetition: A Practical Weekly Schedule",
    question: "How should I review the same topic across a week?",
    description:
      "A simple weekly spaced repetition schedule that students can adapt before exams.",
    category: "exam-preparation",
    relatedFeatures: ["revision-planner", "study-analytics"],
    relatedGuides: ["active-recall-explained-with-a-student-example"],
    checklist: [
      "Review new material the next day.",
      "Review weak material again after two or three days.",
      "Mix old and new topics before the weekend.",
      "Use short active recall prompts, not full rereading every time.",
    ],
    sections: [
      {
        heading: "A seven-day example",
        body: [
          "Day 1 is the first study session. Day 2 is a short recall check. Day 4 is a mixed review. Day 7 is practice with mistakes from the week.",
          "The spacing matters because each return shows whether the topic is becoming easier to retrieve.",
        ],
      },
      {
        heading: "Track the pattern",
        body: [
          "Use StudySpark tasks or revision topics to schedule each return. The goal is not a perfect calendar; it is a visible reminder to revisit material before it fades.",
        ],
      },
    ],
  }),
  guide({
    slug: "how-to-use-a-focus-timer-without-burning-out",
    title: "How to Use a Focus Timer Without Burning Out",
    question: "How do I use timed focus without overdoing it?",
    description:
      "A focus timer guide for students who want structure without turning every minute into pressure.",
    category: "productivity",
    relatedFeatures: ["focus-timer"],
    relatedGuides: ["how-to-review-your-study-progress-every-week"],
    checklist: [
      "Choose one task before starting.",
      "Stop for a real break when the timer ends.",
      "Use shorter blocks when tired.",
      "Review what changed after two or three sessions.",
    ],
    sections: [
      {
        heading: "Pick a task, not a mood",
        body: [
          "A timer works best when it has one job. Write a task such as 'solve five integration problems' instead of 'study math'.",
          "When the timer ends, decide whether the next block should continue, switch, or stop.",
        ],
      },
      {
        heading: "Protect breaks",
        body: [
          "Breaks are part of the method, not a reward for later. Stand up, rest your eyes, or move away from the screen.",
          "If every break becomes another screen activity, the next study block usually starts with less attention.",
        ],
      },
    ],
  }),
  guide({
    slug: "how-to-improve-typing-accuracy-before-typing-speed",
    title: "How to Improve Typing Accuracy Before Typing Speed",
    question: "How do I reduce mistakes before chasing WPM?",
    description:
      "An accuracy-first typing practice routine for students who write notes, assignments, code, or online answers.",
    category: "typing",
    relatedFeatures: ["typing-speed-test"],
    relatedGuides: [],
    checklist: [
      "Practice slowly enough to notice errors.",
      "Repeat the same difficulty until accuracy stabilizes.",
      "Watch punctuation and capitalization mistakes.",
      "Increase speed only after errors decrease.",
    ],
    sections: [
      {
        heading: "Accuracy makes speed useful",
        body: [
          "Fast typing is not helpful if every sentence needs correction. Accuracy gives speed somewhere stable to grow.",
          "In a typing test, review the mistake pattern before starting another round.",
        ],
      },
      {
        heading: "Practice with student text",
        body: [
          "Use passages similar to notes, assignments, and exam answers. This makes practice closer to the typing you actually need.",
        ],
      },
    ],
  }),
  guide({
    slug: "how-to-take-useful-digital-notes",
    title: "How to Take Useful Digital Notes",
    question: "How do I write notes that are easy to revise later?",
    description:
      "A student note-taking guide focused on main ideas, examples, questions, and review.",
    category: "productivity",
    relatedFeatures: ["notes", "revision-planner"],
    relatedGuides: ["active-recall-explained-with-a-student-example"],
    checklist: [
      "Put the main idea first.",
      "Add one example in your own words.",
      "Write one question the note should answer.",
      "Mark the note for revision if it feels unclear.",
    ],
    sections: [
      {
        heading: "Notes should help future review",
        body: [
          "A useful note is not a transcript. It should help your future self remember what matters and what to practice.",
          "Start with the main idea, then add the example or formula that makes the idea concrete.",
        ],
      },
      {
        heading: "Connect notes to action",
        body: [
          "If a note reveals confusion, turn it into a revision task. StudySpark works best when notes, tasks, and revision plans support each other.",
        ],
      },
    ],
  }),
  guide({
    slug: "how-to-review-your-study-progress-every-week",
    title: "How to Review Your Study Progress Every Week",
    question: "How do I use my study history to plan next week?",
    description:
      "A weekly review routine for students who want to compare effort, tasks, and subject balance.",
    category: "productivity",
    relatedFeatures: ["study-analytics", "revision-planner"],
    relatedGuides: ["how-to-create-a-realistic-revision-plan"],
    checklist: [
      "Check which subjects received time.",
      "Look at unfinished high-priority tasks.",
      "Choose one adjustment for next week.",
      "Keep the review short and honest.",
    ],
    sections: [
      {
        heading: "Look for imbalance",
        body: [
          "A weekly review is not about judging yourself. It is about spotting imbalance early.",
          "If one subject has no focus time and another has many sessions, ask whether that matches your exam dates and weak topics.",
        ],
      },
      {
        heading: "Plan one correction",
        body: [
          "Do not redesign your entire routine every Sunday. Pick one correction: a subject to protect, a weak topic to review, or a task to split smaller.",
        ],
      },
    ],
  }),
  guide({
    slug: "how-to-ask-better-questions-from-a-pdf",
    title: "How to Ask Better Questions from a PDF",
    question: "How do I get useful answers from uploaded material?",
    description:
      "A guide to asking narrow, checkable questions from study PDFs and notes.",
    category: "pdf-tools",
    relatedFeatures: ["pdf-question-answering"],
    relatedGuides: ["how-to-generate-practice-questions-from-study-material"],
    checklist: [
      "Ask about one section or concept at a time.",
      "Include the exact term or page topic when possible.",
      "Check important answers against the source.",
      "Do not upload material you are not allowed to process.",
    ],
    sections: [
      {
        heading: "Specific questions work better",
        body: [
          "A broad prompt such as 'explain this PDF' usually produces a broad answer. A narrow question helps you check whether the answer matches the material.",
          "Ask for a comparison, definition, example, or practice question from a named topic.",
        ],
      },
      {
        heading: "Verify before relying",
        body: [
          "AI-assisted answers can be useful for study, but they can also miss context. Use the PDF as the final source when accuracy matters.",
        ],
      },
    ],
  }),
  guide({
    slug: "how-to-generate-practice-questions-from-study-material",
    title: "How to Generate Practice Questions from Study Material",
    question: "How do I turn notes into practice questions responsibly?",
    description:
      "A responsible workflow for creating practice questions from notes or PDFs and checking their quality.",
    category: "pdf-tools",
    relatedFeatures: ["pdf-exam-generator", "text-to-pdf"],
    relatedGuides: ["how-to-ask-better-questions-from-a-pdf"],
    checklist: [
      "Use clean source material.",
      "Generate a small question set first.",
      "Check questions against the original notes.",
      "Rewrite weak questions before using them for revision.",
    ],
    sections: [
      {
        heading: "Start small",
        body: [
          "A smaller question set is easier to inspect. Generate five to ten questions before creating a longer practice sheet.",
          "Look for missing topics, repeated wording, and answers that do not match your notes.",
        ],
      },
      {
        heading: "Use questions as practice, not proof",
        body: [
          "Generated questions can help you practice recall. They should not replace teacher-provided examples, official past papers, or your own checking.",
        ],
      },
    ],
  }),
];

function guide(input: Omit<GuideRecord, "publishedAt" | "updatedAt" | "readTime" | "reviewed" | "editor" | "reviewerNote">): GuideRecord {
  return {
    ...input,
    publishedAt: "2026-08-05",
    updatedAt: "2026-08-05",
    readTime: "5 min read",
    reviewed: true,
    editor: "StudySpark Editorial Team",
    reviewerNote:
      "Reviewed for student usefulness, claim discipline, internal links, and alignment with current StudySpark features.",
  };
}

export const REVIEWED_GUIDES = GUIDES.filter((guide) => guide.reviewed);

export function getGuide(slug: string) {
  return REVIEWED_GUIDES.find((guide) => guide.slug === slug);
}

export function getCategory(slug: string) {
  return GUIDE_CATEGORIES.find((category) => category.slug === slug);
}

export function getGuidesByCategory(category: GuideCategorySlug) {
  return REVIEWED_GUIDES.filter((guide) => guide.category === category);
}

