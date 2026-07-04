"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ListTodo,
  Timer,
  BarChart3,
  CalendarDays,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import {
  StaggerContainer,
  StaggerItem,
  GlassCard,
} from "@/components/shared/motion";
import { SectionHeading } from "./section-heading";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

const FEATURES: Feature[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "A calm overview of your day — tasks, focus hours, upcoming exams and events, all in one beautifully organized space.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: ListTodo,
    title: "Smart Tasks",
    description:
      "Capture tasks with priority and category, track completion trends, and let StudySpark surface what matters today.",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: Timer,
    title: "Focus Timer",
    description:
      "Pomodoro-style focus sessions with subject tagging. Build streaks, log every minute, and watch your hours add up.",
    gradient: "from-rose-500 to-orange-500",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Beautiful charts for weekly study hours, subject performance, task breakdowns and exam progress — insights, not noise.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    description:
      "Plan lectures, deadlines and life events. A clean month view with color-coded subjects keeps everything in reach.",
    gradient: "from-teal-500 to-cyan-500",
  },
  {
    icon: GraduationCap,
    title: "Exam Tracker",
    description:
      "Countdown to every exam with preparation progress. Never lose track of what's coming or how ready you are.",
    gradient: "from-amber-500 to-yellow-500",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="relative scroll-mt-24 px-4 py-20 sm:py-28"
      aria-label="Features"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to"
          highlight="study smarter"
          description="Six tightly integrated tools that replace the dozen apps you're juggling today. No setup, no clutter — just clarity."
        />

        <StaggerContainer className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.title}>
              <GlassCard hover className="group relative h-full overflow-hidden p-6 sm:p-7">
                <div
                  className={`pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-gradient-to-br ${feature.gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20`}
                />
                <div className="relative flex flex-col gap-4">
                  <motion.div
                    whileHover={{ rotate: -6, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 350, damping: 15 }}
                    className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}
                  >
                    <feature.icon className="size-6" strokeWidth={2.2} />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
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
