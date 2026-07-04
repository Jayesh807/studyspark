"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Clock,
  Target,
  Calendar,
  Zap,
  Shield,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { AnimatedBlobs } from "@/components/shared/animated-blobs";
import { scrollToSection } from "./scroll-helpers";
import { cn } from "@/lib/utils";

const TRUST_BADGES = [
  { label: "Free forever", icon: Zap },
  { label: "No credit card", icon: CheckCircle2 },
  { label: "Privacy-first", icon: Shield },
];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function Hero() {
  const setView = useAppStore((s) => s.setView);

  return (
    <section
      className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28"
      aria-label="Hero"
    >
      <AnimatedBlobs variant="landing" />
      {/* Floating decorative shapes */}
      <FloatingShapes />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2 lg:gap-8">
        {/* Left column */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-start gap-6"
        >
          <motion.div variants={item}>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-300">
              <Sparkles className="size-3.5" />
              Your all-in-one student workspace
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-[3.75rem]"
          >
            Your studies,{" "}
            <span className="text-gradient">beautifully organized.</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            StudySpark brings tasks, calendar, focus sessions, subjects and
            exams into one calm, beautifully crafted dashboard — so you can stop
            juggling apps and start making real progress.
          </motion.p>

          <motion.div
            variants={item}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Button
              size="lg"
              onClick={() => setView("signup")}
              className="h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-7 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/45 hover:brightness-110"
            >
              Start for free
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection("features")}
              className="h-12 rounded-xl px-7 text-base font-semibold"
            >
              See features
            </Button>
          </motion.div>

          <motion.ul
            variants={container}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2"
          >
            {TRUST_BADGES.map(({ label, icon: Icon }, i) => (
              <motion.li
                key={label}
                custom={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.12, ease: [0.22, 1, 0.36, 1] as const }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <Icon className="size-4 text-violet-500" />
                <span>{label}</span>
                {label === "Free forever" && (
                  <span className="glow-dot ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-violet-500" />
                )}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Right column — floating dashboard preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          className="relative mx-auto w-full max-w-md lg:max-w-lg"
        >
          <FloatingDashboard />
        </motion.div>
      </div>
    </section>
  );
}

function FloatingDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = (e.clientX - centerX) / rect.width;
    const dy = (e.clientY - centerY) / rect.height;
    setOffset({ x: dx * 12, y: dy * 8 });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <motion.div
      ref={containerRef}
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      className="relative transition-transform duration-200 ease-out"
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
            studyspark.app/dashboard
          </div>
        </div>

        {/* Dashboard body */}
        <div className="space-y-4 p-5">
          {/* Greeting */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Good morning,</p>
              <p className="text-base font-semibold">Alex 👋</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-3" />
              +12% this week
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <MiniStat
              icon={Target}
              label="Tasks"
              value="24"
              tone="violet"
            />
            <MiniStat icon={Clock} label="Focus" value="6.2h" tone="fuchsia" />
            <MiniStat
              icon={Calendar}
              label="Events"
              value="8"
              tone="purple"
            />
          </div>

          {/* Fake chart */}
          <div className="rounded-2xl border border-violet-500/10 bg-white/50 p-4 dark:bg-white/5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold">Study hours</p>
              <p className="text-[10px] text-muted-foreground">Last 7 days</p>
            </div>
            <FakeAreaChart />
          </div>

          {/* Mini task list */}
          <div className="space-y-1.5">
            {[
              { t: "Calculus problem set", c: "bg-violet-500" },
              { t: "Read Ch. 4 — Algorithms", c: "bg-fuchsia-500" },
              { t: "Physics lab report", c: "bg-purple-500" },
            ].map((task, i) => (
              <motion.div
                key={task.t}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.12 }}
                className="flex items-center gap-2.5 rounded-xl bg-white/50 px-3 py-2 dark:bg-white/5"
              >
                <span className={cn("size-2 rounded-full", task.c)} />
                <span className="flex-1 text-xs font-medium">{task.t}</span>
                <span className="size-4 rounded-full border-2 border-violet-500/30" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating chip — Focus timer */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -right-3 -top-4 hidden rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-3.5 py-2.5 text-white shadow-xl shadow-violet-500/30 sm:block"
      >
        <div className="flex items-center gap-2">
          <Clock className="size-4" />
          <div>
            <p className="text-[9px] uppercase tracking-wide opacity-80">
              Focus
            </p>
            <p className="text-sm font-bold leading-none">25:00</p>
          </div>
        </div>
      </motion.div>

      {/* Floating chip — Streak */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-2xl glass-strong px-3.5 py-2.5 shadow-xl sm:flex"
      >
        <Heart className="size-4 text-fuchsia-500" />
        <div>
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Streak
          </p>
          <p className="text-sm font-bold leading-none">14 days 🔥</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "violet" | "fuchsia" | "purple";
}) {
  const tones = {
    violet: "from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-300",
    fuchsia:
      "from-fuchsia-500/15 to-fuchsia-500/5 text-fuchsia-600 dark:text-fuchsia-300",
    purple:
      "from-purple-500/15 to-purple-500/5 text-purple-600 dark:text-purple-300",
  } as const;
  return (
    <div
      className={cn(
        "rounded-2xl bg-gradient-to-br p-3",
        tones[tone]
      )}
    >
      <Icon className="size-4" />
      <p className="mt-1.5 text-lg font-bold leading-none">{value}</p>
      <p className="mt-0.5 text-[10px] opacity-80">{label}</p>
    </div>
  );
}

function FakeAreaChart() {
  // Stable fake data for an area chart look.
  const points = [
    [0, 38],
    [25, 24],
    [50, 30],
    [75, 12],
    [100, 22],
    [125, 8],
    [150, 16],
    [175, 4],
  ] as const;
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`)
    .join(" ");
  const area = `${path} L175,50 L0,50 Z`;
  return (
    <svg
      viewBox="0 0 175 50"
      preserveAspectRatio="none"
      className="h-16 w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.6 0.2 300)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="oklch(0.6 0.2 300)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="heroLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.55 0.21 277)" />
          <stop offset="100%" stopColor="oklch(0.62 0.24 16)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#heroArea)" />
      <path
        d={path}
        fill="none"
        stroke="url(#heroLine)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r={i === points.length - 1 ? 3 : 0}
          fill="oklch(0.62 0.24 16)"
        />
      ))}
    </svg>
  );
}

function FloatingShapes() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute left-[8%] top-[18%] size-16 rounded-3xl bg-gradient-to-br from-violet-400/30 to-fuchsia-400/20 blur-[1px]"
      />
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [-12, 8, -12] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[12%] top-[12%] size-10 rounded-full bg-gradient-to-br from-fuchsia-400/30 to-rose-400/20"
      />
      <motion.div
        animate={{ y: [0, -16, 0], rotate: [0, 18, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[14%] left-[14%] size-12 rotate-12 rounded-2xl bg-gradient-to-br from-purple-400/30 to-violet-400/20"
      />
      <motion.div
        animate={{ y: [0, 14, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[22%] right-[6%] size-8 rounded-full bg-gradient-to-br from-emerald-400/25 to-teal-400/15"
      />
    </div>
  );
}
