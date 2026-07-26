"use client";

import { m } from "framer-motion";
import {
  TrendingUp,
  Clock,
  Target,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { SectionHeading } from "./section-heading";

export function DashboardOverview() {
  return (
    <section
      id="dashboard-overview"
      className="relative scroll-mt-24 px-4 py-16 sm:py-24"
      aria-label="Dashboard overview"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Preview"
          title="Your Personal"
          highlight="Study Command Center"
          description="Everything you need to plan, focus, and track your academic progress — in one beautifully designed dashboard. Here's what your workspace looks like from day one."
        />

        <m.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-12 max-w-4xl"
        >
          {/* Glow behind */}
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-violet-500/20 via-fuchsia-500/15 to-purple-500/20 blur-3xl" />

          <div className="glass-strong overflow-hidden rounded-3xl shadow-2xl shadow-violet-500/15">
            {/* Window chrome */}
            <div className="flex items-center gap-2 border-b border-violet-500/10 bg-white/40 px-4 py-3 dark:bg-white/5">
              <span className="size-3 rounded-full bg-rose-400/80" />
              <span className="size-3 rounded-full bg-amber-400/80" />
              <span className="size-3 rounded-full bg-emerald-400/80" />
              <div className="ml-3 flex h-6 flex-1 items-center rounded-md bg-white/60 px-3 text-[10px] font-medium text-muted-foreground dark:bg-white/5">
                studysparks.cloud/dashboard
              </div>
            </div>

            {/* Dashboard body */}
            <div className="space-y-4 p-5 sm:p-6 md:p-8">
              {/* Greeting row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Good morning,
                  </p>
                  <p className="text-base font-semibold sm:text-lg">Alex 👋</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 sm:text-xs">
                  <TrendingUp className="size-3 sm:size-3.5" />
                  +12% this week
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <StatCard
                  icon={Target}
                  value="24"
                  label="Tasks to do"
                  tone="violet"
                />
                <StatCard
                  icon={Clock}
                  value="6.2h"
                  label="Focused today"
                  tone="fuchsia"
                />
                <StatCard
                  icon={Calendar}
                  value="3"
                  label="Exams soon"
                  tone="purple"
                />
              </div>

              {/* Weekly activity chart */}
              <div className="rounded-2xl border border-violet-500/10 bg-white/50 p-4 dark:bg-white/5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Activity
                    </p>
                    <p className="text-xs font-bold leading-none sm:text-sm">
                      Weekly study hours
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 sm:text-sm">
                    28.4 hrs
                  </p>
                </div>
                <div className="flex h-20 items-end gap-1.5 sm:h-24">
                  {[40, 65, 35, 80, 55, 90, 70].map((h, i) => (
                    <m.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.06 }}
                      className="flex-1 rounded-t bg-gradient-to-t from-violet-500 to-fuchsia-500"
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[9px] text-muted-foreground">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (d) => (
                      <span key={d}>{d}</span>
                    ),
                  )}
                </div>
              </div>

              {/* Tasks list */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Today's tasks
                </p>
                {[
                  {
                    t: "Calculus: Complete problem set #7",
                    c: "bg-violet-500",
                    done: false,
                  },
                  {
                    t: "Physics: Review lab report draft",
                    c: "bg-fuchsia-500",
                    done: false,
                  },
                  {
                    t: "Literature: Read chapters 4–6",
                    c: "bg-purple-500",
                    done: true,
                  },
                ].map((task, i) => (
                  <m.div
                    key={task.t}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="flex items-center gap-2.5 rounded-xl bg-white/50 px-3 py-2.5 dark:bg-white/5"
                  >
                    <span className={`size-2 rounded-full ${task.c}`} />
                    <span
                      className={`flex-1 text-xs font-medium ${task.done ? "text-muted-foreground line-through" : ""}`}
                    >
                      {task.t}
                    </span>
                    {task.done ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : (
                      <span className="size-4 rounded-full border-2 border-violet-500/30" />
                    )}
                  </m.div>
                ))}
              </div>
            </div>
          </div>
        </m.div>

        {/* Callout annotations */}
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Real-time analytics", color: "bg-violet-500" },
            { label: "Task management", color: "bg-fuchsia-500" },
            { label: "Focus tracking", color: "bg-emerald-500" },
            { label: "Exam countdowns", color: "bg-amber-500" },
          ].map((callout) => (
            <div
              key={callout.label}
              className="flex items-center gap-2 rounded-lg px-2 py-1"
            >
              <span className={`size-2 rounded-full ${callout.color}`} />
              <span className="text-xs font-medium text-muted-foreground">
                {callout.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  tone: "violet" | "fuchsia" | "purple";
}) {
  const tones = {
    violet:
      "from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-300",
    fuchsia:
      "from-fuchsia-500/15 to-fuchsia-500/5 text-fuchsia-600 dark:text-fuchsia-300",
    purple:
      "from-purple-500/15 to-purple-500/5 text-purple-600 dark:text-purple-300",
  } as const;
  return (
    <div className={`rounded-2xl bg-gradient-to-br p-3 sm:p-4 ${tones[tone]}`}>
      <Icon className="size-4" />
      <p className="mt-1.5 text-lg font-bold leading-none sm:text-xl">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] opacity-80 sm:text-xs">{label}</p>
    </div>
  );
}
