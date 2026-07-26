"use client";

import { m } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Frown,
  CalendarX2,
  Brain,
  CheckCircle2,
  ListTodo,
  Timer,
  BarChart3,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "./section-heading";
import {
  StaggerContainer,
  StaggerItem,
  GlassCard,
} from "@/components/shared/motion";

/* -------------------------------------------------------------------------- */
/*  Problems Section                                                          */
/* -------------------------------------------------------------------------- */

interface Problem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PROBLEMS: Problem[] = [
  {
    icon: AlertTriangle,
    title: "Too Many Apps, Not Enough Time",
    description:
      "You're switching between Google Calendar, Notion, a timer app, a grade tracker, and sticky notes. Each app only handles one part of your student life, and nothing talks to anything else. By the time you've set everything up, you've lost the energy to actually study.",
  },
  {
    icon: CalendarX2,
    title: "Losing Track of Deadlines",
    description:
      "Assignments pile up, exam dates blur together, and that paper you swore was due next week is actually due tomorrow. Without a centralized system that connects your tasks, calendar, and exams, important deadlines slip through the cracks regularly.",
  },
  {
    icon: Clock,
    title: "Can't Focus in Study Sessions",
    description:
      "You sit down to study for three hours, but between phone notifications, social media, and the constant urge to check email, you end up with maybe forty-five minutes of real work. Without a structured approach to focus, study sessions feel unproductive and frustrating.",
  },
  {
    icon: Frown,
    title: "No Idea Where Your Time Goes",
    description:
      "You feel like you've been studying all week, but your grades don't reflect the effort. Without tracking which subjects get your attention and how your study hours are actually distributed, it's impossible to know if you're spending time on the right things.",
  },
  {
    icon: Brain,
    title: "Exam Prep Feels Overwhelming",
    description:
      "Finals week approaches and you have five exams, three papers, and no plan. You don't know what to study first, how much time each subject needs, or how ready you actually are. The overwhelm leads to cramming, stress, and underperformance.",
  },
];

export function ProblemsSection() {
  return (
    <section
      id="problems"
      className="relative scroll-mt-24 px-4 py-16 sm:py-24"
      aria-label="Problems students face"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="The Challenge"
          title="The Daily Struggles"
          highlight="Every Student Knows"
          description="If any of these sound familiar, you're not alone — and StudySpark was built specifically to solve them."
        />

        <StaggerContainer className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEMS.map((problem) => (
            <StaggerItem key={problem.title}>
              <GlassCard className="group relative h-full overflow-hidden p-5 sm:p-6">
                <div className="relative flex flex-col gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500 dark:text-rose-400">
                    <problem.icon className="size-5" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {problem.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {problem.description}
                  </p>
                </div>
              </GlassCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Solutions Section                                                         */
/* -------------------------------------------------------------------------- */

interface Solution {
  problem: string;
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

const SOLUTIONS: Solution[] = [
  {
    problem: "Too many apps",
    icon: CheckCircle2,
    title: "One Connected Workspace",
    description:
      "StudySpark replaces your scattered toolkit with a single dashboard where tasks, calendar events, focus sessions, exams, and analytics are all connected. Add a task in one view and it appears in your calendar. Complete a focus session and your analytics update automatically. Everything stays in sync without any manual effort.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    problem: "Losing deadlines",
    icon: CalendarDays,
    title: "Smart Calendar & Exam Tracker",
    description:
      "StudySpark's calendar shows your tasks, events, and exam countdowns in one unified view. Color-coded subjects make it easy to spot conflicts. The built-in exam tracker counts down to every test date and helps you plan preparation time, so deadlines never sneak up on you again.",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    problem: "Can't focus",
    icon: Timer,
    title: "Built-in Pomodoro Focus Timer",
    description:
      "StudySpark's Pomodoro timer structures your study sessions into focused work blocks with timed breaks. Tag each session with a subject to see where your focus goes. Combine it with the integrated study radio for ambient lo-fi beats that help you enter and maintain a flow state.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    problem: "Where does time go",
    icon: BarChart3,
    title: "Detailed Study Analytics",
    description:
      "StudySpark tracks every focus session, completed task, and study hour automatically. View beautiful charts showing your weekly study distribution, subject breakdown, completion rates, and productivity trends. For the first time, you can see exactly where your time goes and adjust your strategy accordingly.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    problem: "Overwhelmed by exams",
    icon: ListTodo,
    title: "Task Planner with Priorities",
    description:
      "Break big exam preparation goals into manageable daily tasks with priorities and categories. StudySpark surfaces what matters today so you always know your next step. Track completion trends over time and build the confidence that comes from steady, visible progress toward your goals.",
    gradient: "from-cyan-500 to-blue-500",
  },
];

export function SolutionsSection() {
  return (
    <section
      id="solutions"
      className="relative scroll-mt-24 px-4 py-16 sm:py-24"
      aria-label="How StudySpark solves student problems"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="The Solution"
          title="How StudySpark Makes"
          highlight="Student Life Easier"
          description="Every problem has a purpose-built tool. Every tool works together seamlessly. Here's how StudySpark turns daily struggles into daily wins."
        />

        <div className="mt-12 flex flex-col gap-5">
          {SOLUTIONS.map((solution, i) => (
            <m.div
              key={solution.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
                delay: i * 0.06,
              }}
            >
              <GlassCard
                hover
                className="group relative overflow-hidden p-5 sm:p-7"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                  <m.div
                    whileHover={{ rotate: -6, scale: 1.05 }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 15,
                    }}
                    className={`flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${solution.gradient} text-white shadow-lg`}
                  >
                    <solution.icon className="size-6" strokeWidth={2.2} />
                  </m.div>
                  <div className="flex-1">
                    <span className="inline-block rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                      Solves: {solution.problem}
                    </span>
                    <h3 className="mt-2 text-lg font-semibold tracking-tight">
                      {solution.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {solution.description}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
