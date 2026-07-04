"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  ListChecks,
  Timer,
  BarChart3,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

interface Benefit {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const BENEFITS: Benefit[] = [
  {
    icon: ListChecks,
    title: "Track tasks & exams",
    desc: "Never miss a deadline again",
  },
  {
    icon: Timer,
    title: "Pomodoro focus timer",
    desc: "Stay in the zone, distraction-free",
  },
  {
    icon: BarChart3,
    title: "Beautiful analytics",
    desc: "See your progress at a glance",
  },
];

/** Mini sparkline of bars for the floating mock stat card. */
const SPARK_BARS = [40, 65, 50, 80, 60, 95, 72];

export function AuthLeftPanel() {
  return (
    <div className="relative hidden lg:flex lg:flex-col lg:justify-between overflow-hidden p-12 xl:p-16 text-white">
      {/* Gradient backdrop */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600" />
      {/* Soft secondary wash */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(244,114,182,0.35),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(167,139,250,0.45),transparent_55%)]" />

      {/* Floating blobs (localized, no indigo/blue) */}
      <motion.div
        className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-fuchsia-400/40 blur-3xl"
        animate={{ x: [0, 40, -20, 0], y: [0, 30, -15, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 -right-24 h-96 w-96 rounded-full bg-violet-300/40 blur-3xl"
        animate={{ x: [0, -50, 25, 0], y: [0, -30, 20, 0], scale: [1, 0.9, 1.15, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/3 h-72 w-72 rounded-full bg-rose-300/30 blur-3xl"
        animate={{ x: [0, 30, -40, 0], y: [0, -25, 15, 0], scale: [1, 1.08, 0.92, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Top: brand */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex items-center gap-3"
      >
        <div className="grid size-12 place-items-center rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/30 shadow-lg">
          <Sparkles className="size-6" />
        </div>
        <span className="text-2xl font-semibold tracking-tight">StudySpark</span>
      </motion.div>

      {/* Middle: tagline + benefits */}
      <div className="relative z-10 max-w-md">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight"
        >
          Study smarter,
          <br />
          not harder.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-lg text-white/80"
        >
          Your all-in-one student analytics workspace. Plan, focus, and watch
          your progress soar.
        </motion.p>

        <ul className="mt-10 space-y-4">
          {BENEFITS.map((b, i) => (
            <motion.li
              key={b.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-4"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
                <b.icon className="size-5" />
              </div>
              <div>
                <div className="font-medium leading-tight">{b.title}</div>
                <div className="text-sm text-white/70">{b.desc}</div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Bottom: floating mock stat card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-fit"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="glass-strong rounded-2xl p-5 shadow-2xl ring-1 ring-white/40 w-72"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-white/70">
                Focus this week
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-bold">12.5</span>
                <span className="text-sm text-white/70">hours</span>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-1 text-xs font-medium text-emerald-100 ring-1 ring-emerald-300/30">
              <TrendingUp className="size-3" />
              +18%
            </div>
          </div>
          {/* Mini bar sparkline */}
          <div className="mt-4 flex h-12 items-end gap-1.5">
            {SPARK_BARS.map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.6, delay: 0.8 + i * 0.07, ease: "easeOut" }}
                className="flex-1 rounded-t-md bg-gradient-to-t from-white/40 to-white/80"
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
