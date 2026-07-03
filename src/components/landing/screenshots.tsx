"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Clock, Target, CheckCircle2 } from "lucide-react";
import { SectionHeading } from "./section-heading";

interface Preview {
  caption: string;
  title: string;
  description: string;
  delay: number;
  render: () => ReactNode;
}

const PREVIEWS: Preview[] = [
  {
    caption: "Dashboard",
    title: "Your day at a glance",
    description:
      "Tasks, focus hours, exams and events — composed into one calm, glanceable surface.",
    delay: 0,
    render: () => <DashboardPreview />,
  },
  {
    caption: "Analytics",
    title: "Insights that drive progress",
    description:
      "Weekly study hours, subject performance and exam readiness — visualized beautifully.",
    delay: 0.12,
    render: () => <AnalyticsPreview />,
  },
  {
    caption: "Focus Timer",
    title: "Deep work, gently tracked",
    description:
      "Start a Pomodoro, tag a subject, and watch your focused hours add up across the week.",
    delay: 0.24,
    render: () => <FocusPreview />,
  },
];

export function Screenshots() {
  return (
    <section
      id="screenshots"
      className="relative scroll-mt-24 px-4 py-20 sm:py-28"
      aria-label="Product preview"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Preview"
          title="A closer look at the"
          highlight="StudySpark workspace"
          description="Three of the many surfaces you'll use every day. Designed to fade into the background so you can focus on the work."
        />

        <div className="mt-14 flex flex-col gap-16 lg:gap-24">
          {PREVIEWS.map((preview, i) => (
            <PreviewRow key={preview.caption} preview={preview} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PreviewRow({ preview, index }: { preview: Preview; index: number }) {
  const reverse = index % 2 === 1;
  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <motion.div
        initial={{ opacity: 0, x: reverse ? 40 : -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className={reverse ? "lg:order-2" : "lg:order-1"}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
          {preview.caption}
        </span>
        <h3 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          {preview.title}
        </h3>
        <p className="mt-3 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
          {preview.description}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: preview.delay }}
        className={reverse ? "lg:order-1" : "lg:order-2"}
      >
        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-purple-500/15 blur-3xl" />
          <div className="glass-strong overflow-hidden rounded-3xl p-2 shadow-2xl shadow-violet-500/10">
            <div className="overflow-hidden rounded-2xl border border-violet-500/10 bg-background/60">
              {preview.render()}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ChromeBar({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-violet-500/10 bg-white/40 px-4 py-2.5 dark:bg-white/5">
      <span className="size-2.5 rounded-full bg-rose-400/80" />
      <span className="size-2.5 rounded-full bg-amber-400/80" />
      <span className="size-2.5 rounded-full bg-emerald-400/80" />
      <span className="ml-2 text-[10px] font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div>
      <ChromeBar label="studyspark.app/dashboard" />
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground">Tuesday, Oct 21</p>
            <p className="text-sm font-bold">Good morning, Alex</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="size-3" />
            +12% this week
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Tasks", value: "24", tone: "bg-violet-500" },
            { label: "Focus", value: "6.2h", tone: "bg-fuchsia-500" },
            { label: "Events", value: "8", tone: "bg-purple-500" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-white/50 p-3 dark:bg-white/5"
            >
              <span
                className={`inline-block size-1.5 rounded-full ${s.tone}`}
              />
              <p className="mt-1.5 text-base font-bold leading-none">{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-violet-500/10 bg-white/40 p-3 dark:bg-white/5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold">This week</p>
            <p className="text-[9px] text-muted-foreground">28.4h</p>
          </div>
          <div className="flex h-16 items-end gap-1.5">
            {[40, 65, 35, 80, 55, 90, 70].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                className="flex-1 rounded-t bg-gradient-to-t from-violet-500 to-fuchsia-500"
              />
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            { t: "Calculus problem set", c: "bg-violet-500" },
            { t: "Read Ch.4 — Algorithms", c: "bg-fuchsia-500" },
            { t: "Physics lab report", c: "bg-purple-500" },
          ].map((task) => (
            <div
              key={task.t}
              className="flex items-center gap-2 rounded-lg bg-white/50 px-2.5 py-1.5 dark:bg-white/5"
            >
              <span className={`size-1.5 rounded-full ${task.c}`} />
              <span className="flex-1 text-[10px] font-medium">{task.t}</span>
              <CheckCircle2 className="size-3.5 text-violet-500/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsPreview() {
  return (
    <div>
      <ChromeBar label="studyspark.app/analytics" />
      <div className="space-y-3 p-5">
        <div>
          <p className="text-[10px] text-muted-foreground">Subject performance</p>
          <p className="text-sm font-bold">Top performers this month</p>
        </div>
        <div className="space-y-2">
          {[
            { name: "Mathematics", value: 92, tone: "from-violet-500 to-purple-500" },
            { name: "Computer Science", value: 86, tone: "from-fuchsia-500 to-pink-500" },
            { name: "Physics", value: 74, tone: "from-emerald-500 to-teal-500" },
            { name: "Literature", value: 68, tone: "from-amber-500 to-orange-500" },
          ].map((s, i) => (
            <div key={s.name}>
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground">{s.value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-violet-500/10">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${s.value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-full rounded-full bg-gradient-to-r ${s.tone}`}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 p-3">
            <p className="text-[9px] text-muted-foreground">Total focus</p>
            <p className="text-lg font-bold">128h</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-fuchsia-500/15 to-fuchsia-500/5 p-3">
            <p className="text-[9px] text-muted-foreground">Completion</p>
            <p className="text-lg font-bold">94%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FocusPreview() {
  return (
    <div>
      <ChromeBar label="studyspark.app/focus" />
      <div className="flex flex-col items-center gap-3 p-6">
        <div className="relative flex size-32 items-center justify-center">
          <svg viewBox="0 0 120 120" className="size-32 -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="oklch(0.55 0.21 277 / 0.12)"
              strokeWidth="8"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="url(#focusRing)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 52}
              initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
              whileInView={{ strokeDashoffset: 2 * Math.PI * 52 * 0.35 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
            <defs>
              <linearGradient id="focusRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.55 0.21 277)" />
                <stop offset="100%" stopColor="oklch(0.62 0.24 16)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center">
            <p className="text-2xl font-bold tabular-nums">25:00</p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Focus
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500" />
          <p className="text-xs font-medium">Mathematics</p>
        </div>
        <div className="grid w-full grid-cols-3 gap-2">
          {[
            { icon: Clock, label: "Today", value: "3.2h" },
            { icon: Target, label: "Sessions", value: "8" },
            { icon: TrendingUp, label: "Streak", value: "14d" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-xl bg-white/50 p-2.5 dark:bg-white/5"
            >
              <s.icon className="size-3.5 text-violet-500" />
              <p className="mt-1 text-xs font-bold">{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
