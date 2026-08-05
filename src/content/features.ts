import {
  BarChart3,
  BookOpenCheck,
  Clock,
  FileQuestion,
  FileText,
  GraduationCap,
  Keyboard,
  ListTodo,
  NotebookPen,
  Timer,
  type LucideIcon,
} from "lucide-react";

export interface FeatureRecord {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  problem: string;
  audience: string;
  status: "indexable" | "hub-only";
  icon: LucideIcon;
  path: string;
  updatedAt: string;
  steps: string[];
  example: string;
  practices: string[];
  limitations: string[];
  privacy: string;
  faq: { question: string; answer: string }[];
  relatedGuides: string[];
  relatedTools?: { label: string; href: string }[];
}

export const FEATURES: FeatureRecord[] = [
  {
    slug: "revision-planner",
    title: "Revision Planner",
    shortTitle: "Revision Planner",
    description:
      "Plan exam revision by breaking a syllabus into topics, priorities, and progress states.",
    problem:
      "Students often know an exam is coming but do not know which topic to revise next.",
    audience: "School and college students preparing for chapter-based exams.",
    status: "indexable",
    icon: BookOpenCheck,
    path: "/features/revision-planner",
    updatedAt: "2026-08-05",
    steps: [
      "Create an exam or choose a subject.",
      "Add each chapter, unit, or topic as a revision item.",
      "Mark weaker topics as higher priority.",
      "Update progress after each focused revision session.",
    ],
    example:
      "A biology student can add Genetics, Human Health, and Ecology as separate topics, then keep Genetics at high priority until practice questions feel consistent.",
    practices: [
      "Keep topics small enough to review in one sitting.",
      "Review high-priority topics before easy topics.",
      "Add short notes about mistakes after each session.",
    ],
    limitations: [
      "A planner cannot decide topic importance unless the student enters honest priorities.",
      "It does not guarantee exam results.",
    ],
    privacy:
      "Revision topics are part of the signed-in workspace and should not be indexed or shown publicly.",
    faq: [
      {
        question: "Should I add every chapter at once?",
        answer:
          "Add enough topics to see the full syllabus, then split only the chapters that feel too large to revise in one session.",
      },
      {
        question: "How often should I update progress?",
        answer:
          "Update progress after each revision block so the plan reflects what you actually reviewed, not what you hoped to finish.",
      },
    ],
    relatedGuides: [
      "how-to-create-a-realistic-revision-plan",
      "how-to-divide-a-syllabus-before-an-examination",
    ],
  },
  {
    slug: "focus-timer",
    title: "Focus Timer",
    shortTitle: "Focus Timer",
    description:
      "Use timed study blocks and breaks to make focused work easier to start and stop.",
    problem:
      "Long, vague study sessions often turn into distraction because there is no clear start, break, or finish point.",
    audience: "Students who want a simple focus routine for homework, revision, and reading.",
    status: "indexable",
    icon: Timer,
    path: "/features/focus-timer",
    updatedAt: "2026-08-05",
    steps: [
      "Choose one subject or task before starting the timer.",
      "Pick a focus length that fits the task.",
      "Work only on that task until the timer ends.",
      "Take a real break before starting the next block.",
    ],
    example:
      "A student writing notes for chemistry can run two 25-minute blocks, then spend the final break writing down what still needs review.",
    practices: [
      "Write a tiny goal before every timer session.",
      "Use breaks away from the study screen when possible.",
      "Stop the session if you are only pretending to focus.",
    ],
    limitations: [
      "Timed focus helps structure attention, but it cannot replace sleep or preparation.",
      "Very difficult work may need longer blocks than a classic 25-minute timer.",
    ],
    privacy:
      "Signed-in focus history can feed personal analytics. Public timer use does not need private study records.",
    faq: [
      {
        question: "Is 25 minutes always the best focus length?",
        answer:
          "No. It is a useful starting point. Reading may work with 25 minutes, while problem solving may need 40 or 50 minutes.",
      },
      {
        question: "What should I do during breaks?",
        answer:
          "Stand up, drink water, rest your eyes, or stretch. Avoid starting another high-attention activity during a short break.",
      },
    ],
    relatedGuides: ["how-to-use-a-focus-timer-without-burning-out"],
    relatedTools: [{ label: "Open Pomodoro Timer", href: "/tools/pomodoro-timer" }],
  },
  {
    slug: "typing-speed-test",
    title: "Typing Speed Test",
    shortTitle: "Typing Test",
    description:
      "Practice typing accuracy and speed with student-friendly passages and instant feedback.",
    problem:
      "Typing fast is less useful when mistakes make notes, code, or online answers harder to correct.",
    audience: "Students preparing for digital notes, coding, assignments, or online tests.",
    status: "indexable",
    icon: Keyboard,
    path: "/features/typing-speed-test",
    updatedAt: "2026-08-05",
    steps: [
      "Choose a passage difficulty.",
      "Type carefully before trying to increase speed.",
      "Review mistakes after the result appears.",
      "Repeat with similar difficulty until accuracy improves.",
    ],
    example:
      "A coding student can practice medium passages until accuracy stays steady, then move to harder passages with longer sentences.",
    practices: [
      "Treat accuracy as the first score to improve.",
      "Slow down when errors cluster around punctuation or capital letters.",
      "Practice in short sessions instead of one long session.",
    ],
    limitations: [
      "Typing scores vary by keyboard, device, and passage difficulty.",
      "Leaderboard-style scores should not be treated as academic performance.",
    ],
    privacy:
      "Typing performance can be stored for signed-in leaderboard or progress features. Do not enter private notes into typing practice.",
    faq: [
      {
        question: "Should I chase WPM first?",
        answer:
          "No. Build accuracy first. Speed improves more safely when you are not correcting every few words.",
      },
      {
        question: "How long should I practice?",
        answer:
          "Five to ten focused minutes is enough for most practice days.",
      },
    ],
    relatedGuides: ["how-to-improve-typing-accuracy-before-typing-speed"],
  },
  {
    slug: "study-analytics",
    title: "Study Analytics",
    shortTitle: "Analytics",
    description:
      "Review study activity, completed tasks, focus sessions, and subject balance over time.",
    problem:
      "Students can feel busy without knowing which subject is receiving enough attention.",
    audience: "Students who want a weekly review habit based on their own study activity.",
    status: "indexable",
    icon: BarChart3,
    path: "/features/study-analytics",
    updatedAt: "2026-08-05",
    steps: [
      "Complete tasks and focus sessions in the workspace.",
      "Review weekly activity by subject.",
      "Look for neglected subjects or overloaded days.",
      "Plan next week from the pattern you observe.",
    ],
    example:
      "If mathematics shows many focus blocks but English has no completed tasks, the next weekly plan can reserve time for essay review.",
    practices: [
      "Use analytics as a prompt for reflection, not as a scorecard.",
      "Compare subject balance before exam week.",
      "Write one adjustment after each weekly review.",
    ],
    limitations: [
      "Analytics depend on what the student records in the workspace.",
      "Charts show effort patterns, not guaranteed learning outcomes.",
    ],
    privacy:
      "Study analytics are user-specific and should remain private to the signed-in account.",
    faq: [
      {
        question: "Can analytics tell me which subject I understand best?",
        answer:
          "No. They show activity patterns. Understanding still needs practice questions, feedback, and honest review.",
      },
      {
        question: "How often should I review analytics?",
        answer:
          "Weekly review is usually enough to spot imbalance without turning tracking into a distraction.",
      },
    ],
    relatedGuides: ["how-to-review-your-study-progress-every-week"],
  },
  {
    slug: "notes",
    title: "Digital Notes",
    shortTitle: "Notes",
    description:
      "Keep study notes connected to subjects and review tasks inside the workspace.",
    problem:
      "Notes become less useful when they are separated from the tasks and revision plans that need them.",
    audience: "Students who want simple digital notes that support review.",
    status: "hub-only",
    icon: NotebookPen,
    path: "/features/notes",
    updatedAt: "2026-08-05",
    steps: ["Create notes by subject.", "Add examples and questions.", "Connect notes to revision tasks."],
    example:
      "A physics note can keep one formula, one solved example, and one question to revisit before a test.",
    practices: ["Write the main idea first.", "Add your own example.", "Review notes by question."],
    limitations: ["Standalone details should wait until the notes workflow is audited."],
    privacy: "Private notes should not be indexed.",
    faq: [],
    relatedGuides: ["how-to-take-useful-digital-notes"],
  },
  {
    slug: "exam-mode",
    title: "Exam Mode",
    shortTitle: "Exam Mode",
    description:
      "Keep exam dates, preparation status, and revision priorities visible.",
    problem:
      "Exam preparation gets harder when dates, topics, and readiness are tracked in different places.",
    audience: "Students managing multiple upcoming tests.",
    status: "hub-only",
    icon: GraduationCap,
    path: "/features/exam-mode",
    updatedAt: "2026-08-05",
    steps: ["Add exam dates.", "Attach topics.", "Review readiness before the final week."],
    example:
      "A student can keep two midterms visible and choose topics based on nearest date and weakness.",
    practices: ["Start with dates.", "Attach topics early.", "Use final days for review, not discovery."],
    limitations: ["Exam mode supports planning; it does not guarantee marks."],
    privacy: "Exam records are private account data.",
    faq: [],
    relatedGuides: ["how-to-divide-a-syllabus-before-an-examination"],
  },
  {
    slug: "pdf-question-answering",
    title: "PDF Question Answering",
    shortTitle: "PDF Q&A",
    description:
      "Ask questions from study material after uploading or extracting text from a PDF.",
    problem:
      "Students need help turning long material into focused questions without losing source context.",
    audience: "Students working from PDFs, notes, and study handouts.",
    status: "hub-only",
    icon: FileQuestion,
    path: "/features/pdf-question-answering",
    updatedAt: "2026-08-05",
    steps: ["Upload or paste study material.", "Ask a specific question.", "Check the answer against the original source."],
    example:
      "Instead of asking 'explain chapter 3,' ask 'what are the three differences between mitosis and meiosis in this PDF?'",
    practices: ["Ask narrow questions.", "Verify important answers.", "Do not upload material you are not allowed to process."],
    limitations: ["AI answers can be wrong and should be checked against the source."],
    privacy: "PDF and AI handling must match the privacy policy and verified data-flow inventory.",
    faq: [],
    relatedGuides: ["how-to-ask-better-questions-from-a-pdf"],
  },
  {
    slug: "pdf-exam-generator",
    title: "PDF Exam Generator",
    shortTitle: "PDF Exam Generator",
    description:
      "Create practice questions from study material for revision.",
    problem:
      "Students often need practice questions after reading notes, but generic questions may not match their material.",
    audience: "Students who want source-based practice questions.",
    status: "hub-only",
    icon: FileText,
    path: "/features/pdf-exam-generator",
    updatedAt: "2026-08-05",
    steps: ["Provide study material.", "Choose a question count.", "Review generated questions before relying on them."],
    example:
      "A history student can generate short-answer questions from a chapter summary and then mark weak areas.",
    practices: ["Use generated questions as practice, not final truth.", "Check answers against notes.", "Keep question counts manageable."],
    limitations: ["Generated questions can miss important topics or include mistakes."],
    privacy: "Source material handling must be visible in privacy notes.",
    faq: [],
    relatedGuides: ["how-to-generate-practice-questions-from-study-material"],
  },
  {
    slug: "text-to-pdf",
    title: "Text to PDF",
    shortTitle: "Text to PDF",
    description:
      "Format study text into a cleaner PDF for printing or review.",
    problem:
      "Plain notes can be hard to print or share when headings, math, code, or Hindi text are not formatted well.",
    audience: "Students preparing printable notes from pasted text.",
    status: "hub-only",
    icon: FileText,
    path: "/features/text-to-pdf",
    updatedAt: "2026-08-05",
    steps: ["Paste notes.", "Choose formatting options.", "Preview before download or print."],
    example:
      "A student can paste AI-generated physics notes and check formulas before saving a PDF.",
    practices: ["Preview before printing.", "Check formulas and language rendering.", "Do not paste private material into public/shared devices."],
    limitations: ["Formatting improves presentation but not the accuracy of the notes."],
    privacy: "PDF formatting behavior must match the verified privacy data-flow inventory.",
    faq: [],
    relatedGuides: ["how-to-generate-practice-questions-from-study-material"],
    relatedTools: [{ label: "Open PDF Formatter", href: "/tools/pdf-formatter" }],
  },
];

export const INDEXABLE_FEATURES = FEATURES.filter((feature) => feature.status === "indexable");

export function getFeature(slug: string) {
  return FEATURES.find((feature) => feature.slug === slug);
}

