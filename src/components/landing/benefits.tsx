"use client";

import { m } from "framer-motion";
import {
  Rocket,
  TrendingUp,
  CalendarCheck,
  Target,
  Heart,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "./section-heading";
import {
  StaggerContainer,
  StaggerItem,
  GlassCard,
} from "@/components/shared/motion";

interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

const BENEFITS: Benefit[] = [
  {
    icon: Rocket,
    title: "Save 5+ Hours Every Week",
    description:
      "By consolidating your study tools into one workspace, you eliminate the time lost to app-switching, re-entering information, and searching for scattered notes. Students who use an integrated planner consistently save five or more hours per week compared to juggling separate apps.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: CalendarCheck,
    title: "Never Miss a Deadline Again",
    description:
      "When your tasks, calendar, and exam tracker work together in one system, deadlines become visible weeks in advance. Color-coded subjects and countdown timers ensure every assignment, paper, and test is on your radar with plenty of time to prepare.",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: TrendingUp,
    title: "Build a Consistent Study Habit",
    description:
      "The Pomodoro timer, daily planning view, and streak tracking work together to help you build sustainable study habits. Small, consistent effort compounds over a semester — and StudySpark makes it easy to see that progress building day by day.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Target,
    title: "Understand Where Your Time Goes",
    description:
      "StudySpark's analytics show you exactly how your study hours are distributed across subjects, which days you're most productive, and how your effort translates to task completion. Data-driven insights replace guesswork and help you study smarter, not just harder.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Heart,
    title: "Reduce Study Anxiety & Stress",
    description:
      "Overwhelm often comes from not knowing what to do next. When every task has a priority, every exam has a countdown, and every subject has a plan, your brain can relax and focus on learning instead of worrying about what you might be forgetting.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Shield,
    title: "Achieve Better Academic Results",
    description:
      "Students who plan consistently, track their time, and study in focused blocks consistently outperform those who don't. StudySpark provides the structure and visibility needed to turn effort into grades — with evidence you can see in your analytics.",
    gradient: "from-rose-500 to-fuchsia-500",
  },
];

export function Benefits() {
  return (
    <section
      id="benefits"
      className="relative scroll-mt-24 px-4 py-16 sm:py-24"
      aria-label="Benefits"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Benefits"
          title="How StudySpark Transforms"
          highlight="Your Study Routine"
          description="It's not just about tools — it's about building habits that lead to better grades, less stress, and more confidence in your academic journey."
        />

        <StaggerContainer className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <StaggerItem key={benefit.title}>
              <GlassCard
                hover
                className="group relative h-full overflow-hidden p-5 sm:p-6"
              >
                <div className="relative flex flex-col gap-4">
                  <m.div
                    whileHover={{ rotate: -6, scale: 1.05 }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 15,
                    }}
                    className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${benefit.gradient} text-white shadow-lg`}
                  >
                    <benefit.icon className="size-6" strokeWidth={2.2} />
                  </m.div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
