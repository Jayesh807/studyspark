"use client";

import { m } from "framer-motion";
import {
  LayoutDashboard,
  ListTodo,
  Timer,
  BarChart3,
  CalendarDays,
  BookOpenCheck,
  GraduationCap,
  Keyboard,
  Music,
  Calculator,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "./section-heading";
import { GlassCard } from "@/components/shared/motion";

interface FeatureDeep {
  icon: LucideIcon;
  title: string;
  description: string;
  details: string[];
  gradient: string;
}

const FEATURE_DEEP_DIVES: FeatureDeep[] = [
  {
    icon: ListTodo,
    title: "Smart Task Management for Students",
    description:
      "Capture every assignment, reading, project, and personal goal in one organized task list. Set priorities, assign categories by subject, add due dates, and track your completion trends over time. StudySpark surfaces what matters today so you always know your next step.",
    details: [
      "Create tasks with priority levels (high, medium, low) and subject categories",
      "Filter and sort by due date, priority, or subject for instant clarity",
      "Track completion rates and productivity trends in your analytics dashboard",
      "Automatic archival of completed tasks to keep your workspace clean",
    ],
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: CalendarDays,
    title: "Student Calendar — Never Miss a Deadline",
    description:
      "A student-first calendar that shows your tasks, events, and exam countdowns in one unified month view. Color-coded subjects make it easy to spot conflicts and ensure balanced study distribution across your courses. Plan lectures, study sessions, and personal events with drag-and-drop simplicity.",
    details: [
      "Color-coded events by subject for instant visual recognition",
      "Integrated view showing tasks, events, and exam countdowns together",
      "Quick-add events without leaving the calendar view",
      "Month navigation with today-highlighting and deadline badges",
    ],
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: Timer,
    title: "Focus Timer — Build Deep Work Habits",
    description:
      "StudySpark's Pomodoro-style focus timer helps you structure study sessions into productive blocks with timed breaks. Tag each session with a subject to automatically categorize your study hours. Build streaks, log every minute, and combine the timer with the integrated study radio for peak focus.",
    details: [
      "Customizable session lengths (25, 30, 45, or 60-minute Pomodoros)",
      "Subject tagging — automatically logs hours per subject in analytics",
      "Streak tracking to build and maintain consistent study habits",
      "Optional ambient sounds and lo-fi integration during focus sessions",
    ],
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Study Analytics — See Your Progress Clearly",
    description:
      "Turn effort into insight with beautiful, actionable analytics. StudySpark tracks your focus hours, task completion, subject distribution, and daily activity patterns. View weekly trends, identify your most productive days, and make data-driven decisions about how to study smarter.",
    details: [
      "Weekly study hour charts with day-by-day breakdown",
      "Subject performance comparison showing where your time goes",
      "Task completion rates and productivity score trends",
      "Contribution heatmap showing your study consistency over months",
    ],
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: GraduationCap,
    title: "Exam Tracker — Countdowns That Keep You Prepared",
    description:
      "Log every upcoming exam with its date, subject, and your preparation status. The exam tracker provides countdown timers so you always know exactly how many days you have left. Never be caught off guard by a test again — preparation becomes visible and manageable.",
    details: [
      "Add exams with subject, date, and preparation notes",
      "Automatic countdown timers for each upcoming exam",
      "Visual progress indicators showing your readiness level",
      "Dashboard integration showing nearest exams at a glance",
    ],
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: BookOpenCheck,
    title: "Revision Plan - Turn Exam Prep Into a Roadmap",
    description:
      "Plan exam revision topic by topic instead of guessing what to study next. StudySpark helps you organize chapters, set priorities, mark progress, and keep weak areas visible until they are ready.",
    details: [
      "Create revision topics for each exam and subject",
      "Prioritize difficult chapters before the exam gets close",
      "Track each topic from not started to confident",
      "Use a focused roadmap to decide what to revise next",
    ],
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    icon: StickyNote,
    title: "Notes — Capture Ideas While You Study",
    description:
      "Jot down quick notes, key concepts, and study reminders without leaving your workspace. StudySpark's notes feature keeps your thoughts organized alongside your tasks and study sessions. Rich text formatting helps you structure your notes clearly.",
    details: [
      "Rich text editor with formatting, lists, and headings",
      "Organize notes by subject or topic for easy retrieval",
      "Accessible from the dashboard for quick capture during study sessions",
      "Seamless integration with your task and subject system",
    ],
    gradient: "from-rose-500 to-fuchsia-500",
  },
  {
    icon: Keyboard,
    title: "Speed Typing - Practice WPM and Accuracy",
    description:
      "Build faster typing for notes, assignments, coding, and exams with a focused typing challenge. Practice by difficulty, hear responsive key feedback, track WPM and accuracy, and compete on a total-score leaderboard.",
    details: [
      "Easy, medium, and hard typing paragraphs",
      "Live WPM, accuracy, mistakes, time, and score tracking",
      "Mechanical key sounds with a separate wrong-key alert",
      "Leaderboard ranking based on total accumulated score",
    ],
    gradient: "from-violet-500 to-cyan-500",
  },
  {
    icon: Calculator,
    title: "Student Toolbox — Essential Academic Calculators",
    description:
      "Access frequently needed student utilities without leaving your study workspace. The Student Toolbox includes a CGPA/GPA calculator, percentage calculator, age calculator, and unit converter. No more searching the web for basic calculations — everything you need is built in.",
    details: [
      "CGPA/GPA calculator with support for multiple grading scales",
      "Percentage calculator for quick grade and mark calculations",
      "Age calculator with years, months, and days breakdown",
      "All tools accessible instantly from your dashboard sidebar",
    ],
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Music,
    title: "Study Radio — Ambient Music for Focus",
    description:
      "Built-in lo-fi and ambient music player that streams focus-enhancing audio right inside your workspace. Choose from curated stations or load your own playlists. The study radio is designed to help you enter and maintain a flow state during focused study sessions — no tab-switching needed.",
    details: [
      "Curated lo-fi hip-hop, ambient, and classical focus stations",
      "Integrated YouTube playlist support for custom music",
      "Controls accessible from the dashboard without breaking focus",
      "Volume control and station switching without leaving your workspace",
    ],
    gradient: "from-sky-500 to-indigo-500",
  },
];

export function FeatureDeepDives() {
  return (
    <section
      id="feature-details"
      className="relative scroll-mt-24 px-4 py-16 sm:py-24"
      aria-label="Feature details"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Deep Dive"
          title="Every Tool You Need,"
          highlight="Explained in Detail"
          description="A closer look at each feature in your StudySpark workspace. Every tool is designed to work together, creating a seamless study experience."
        />

        <div className="mt-12 flex flex-col gap-16 lg:gap-20">
          {FEATURE_DEEP_DIVES.map((feature, i) => {
            const reverse = i % 2 === 1;
            return (
              <m.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-12 ${reverse ? "" : ""}`}
              >
                {/* Text side */}
                <div className={reverse ? "lg:order-2" : "lg:order-1"}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}
                    >
                      <feature.icon className="size-5" strokeWidth={2.2} />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {feature.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {feature.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2">
                        <span
                          className={`mt-1.5 size-1.5 shrink-0 rounded-full bg-gradient-to-br ${feature.gradient}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          {detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual side */}
                <div className={reverse ? "lg:order-1" : "lg:order-2"}>
                  <GlassCard className="overflow-hidden p-5 sm:p-6">
                    <div className="flex flex-col items-center gap-3 py-8">
                      <div
                        className={`flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br ${feature.gradient} text-white shadow-xl`}
                      >
                        <feature.icon className="size-8" strokeWidth={1.8} />
                      </div>
                      <p className="text-lg font-bold">
                        {feature.title.split("—")[0].trim()}
                      </p>
                      <p className="max-w-xs text-center text-xs text-muted-foreground">
                        {feature.description.split(".")[0]}.
                      </p>
                    </div>
                  </GlassCard>
                </div>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
