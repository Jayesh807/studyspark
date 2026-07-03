"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlarmClock,
  ArrowRight,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  GraduationCap,
  ListTodo,
  MapPin,
  Quote,
  RefreshCw,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { apiFetch, handleError } from "@/lib/api";
import {
  type Analytics,
  type Exam,
  type Priority,
  type Todo,
  colorOf,
  PRIORITY_CONFIG,
} from "@/lib/types";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import {
  GlassCard,
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion";
import {
  CardSkeleton,
  EmptyState,
  Skeleton,
} from "@/components/shared/feedback";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

interface StatCardConfig {
  key: string;
  icon: LucideIcon;
  label: string;
  gradient: string; // tailwind gradient classes
  glow: string; // tailwind bg for blob
  suffix?: string;
  prefix?: string;
  decimals?: number;
  subtitle: (s: Analytics["stats"]) => string;
  value: (s: Analytics["stats"]) => number;
}

const STAT_CARDS: StatCardConfig[] = [
  {
    key: "todayTasks",
    icon: CheckCircle2,
    label: "Today's Tasks",
    gradient: "from-violet-500 to-purple-600",
    glow: "bg-violet-500",
    subtitle: () => "scheduled today",
    value: (s) => s.todayTasks,
  },
  {
    key: "completedTasks",
    icon: CheckCheck,
    label: "Completed Tasks",
    gradient: "from-emerald-500 to-teal-600",
    glow: "bg-emerald-500",
    subtitle: (s) => `of ${s.totalTasks} total`,
    value: (s) => s.completedTasks,
  },
  {
    key: "upcomingExams",
    icon: GraduationCap,
    label: "Upcoming Exams",
    gradient: "from-amber-500 to-orange-600",
    glow: "bg-amber-500",
    subtitle: () => "on the horizon",
    value: (s) => s.upcomingExams,
  },
  {
    key: "focusToday",
    icon: Timer,
    label: "Focus Time Today",
    gradient: "from-rose-500 to-pink-600",
    glow: "bg-rose-500",
    suffix: " min",
    subtitle: () => "today",
    value: (s) => s.focusTodayMinutes,
  },
  {
    key: "studyStreak",
    icon: Flame,
    label: "Study Streak",
    gradient: "from-cyan-500 to-teal-500",
    glow: "bg-cyan-500",
    suffix: " days",
    subtitle: () => "keep it up!",
    value: (s) => s.studyStreak,
  },
];

interface QuoteItem {
  text: string;
  author: string;
}

const QUOTES: QuoteItem[] = [
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    text: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
  },
  {
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
  },
  {
    text: "Learning never exhausts the mind.",
    author: "Leonardo da Vinci",
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
  },
  {
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
  },
  {
    text: "Push yourself, because no one else is going to do it for you.",
    author: "Anonymous",
  },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return Number.POSITIVE_INFINITY;
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function formatCountdown(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
}

/* -------------------------------------------------------------------------- */
/*  Recharts tooltip                                                           */
/* -------------------------------------------------------------------------- */

interface ChartTooltipPayloadItem {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: { day?: string; hours?: number };
}

function StudyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0]?.value;
  return (
    <div className="glass-strong rounded-xl border border-violet-500/20 px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {typeof value === "number" ? value.toFixed(1) : value}
        <span className="ml-1 text-xs text-muted-foreground">hrs</span>
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Greeting header with live clock                                            */
/* -------------------------------------------------------------------------- */

function GreetingHeader({ username }: { username: string }) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const greeting = greetingFor(now.getHours());

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Welcome back to your dashboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            {greeting},{" "}
            <span className="text-gradient capitalize">{username}</span>{" "}
            <motion.span
              animate={{ rotate: [0, 14, -8, 14, 0] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                repeatDelay: 1.6,
                ease: "easeInOut",
              }}
              className="inline-block origin-[70%_70%]"
            >
              👋
            </motion.span>
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-violet-500" />
              <span>{format(now, "EEEE, MMMM d, yyyy")}</span>
            </span>
            <span className="hidden sm:inline text-muted-foreground/40">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-violet-500" />
              <span className="tabular-nums font-medium text-foreground/80">
                {format(now, "HH:mm:ss")}
              </span>
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat card                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({ config, stats }: { config: StatCardConfig; stats: Analytics["stats"] }) {
  const Icon = config.icon;
  const value = config.value(stats);
  const subtitle = config.subtitle(stats);

  return (
    <StaggerItem className="h-full">
      <GlassCard
        hover
        className="group relative h-full overflow-hidden p-5"
      >
        {/* glow blob */}
        <div
          className={cn(
            "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 blur-2xl transition-opacity duration-300 group-hover:opacity-40",
            config.glow
          )}
        />
        <div className="relative flex items-start justify-between">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg shadow-black/5",
              config.gradient
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="relative mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {config.label}
          </p>
          <div className="mt-1 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <AnimatedCounter
              value={value}
              suffix={config.suffix}
              prefix={config.prefix}
              decimals={config.decimals}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </GlassCard>
    </StaggerItem>
  );
}

/* -------------------------------------------------------------------------- */
/*  Weekly study hours chart                                                   */
/* -------------------------------------------------------------------------- */

function WeeklyChart({ data }: { data: Analytics["weeklyData"] }) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            Weekly Study Hours
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Last 7 days focus time
          </p>
        </div>
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="weeklyStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeOpacity={0.08}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor", fillOpacity: 0.6 }}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor", fillOpacity: 0.6 }}
              width={40}
            />
            <Tooltip
              content={<StudyTooltip />}
              cursor={{ stroke: "#8b5cf6", strokeWidth: 1, strokeOpacity: 0.3 }}
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="url(#weeklyStroke)"
              strokeWidth={3}
              fill="url(#weeklyGrad)"
              dot={{
                r: 3,
                fill: "#8b5cf6",
                strokeWidth: 0,
              }}
              activeDot={{
                r: 5,
                fill: "#8b5cf6",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Monthly study hours chart                                                  */
/* -------------------------------------------------------------------------- */

function MonthlyChart({ data }: { data: Analytics["monthlyData"] }) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Timer className="h-4 w-4 text-fuchsia-500" />
            Monthly Study Hours
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Last 30 days focus time
          </p>
        </div>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            barCategoryGap="12%"
          >
            <defs>
              <linearGradient id="monthlyBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d946ef" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeOpacity={0.08}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "currentColor", fillOpacity: 0.6 }}
              interval={3}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor", fillOpacity: 0.6 }}
              width={40}
            />
            <Tooltip
              content={<StudyTooltip />}
              cursor={{ fill: "#8b5cf6", fillOpacity: 0.08 }}
            />
            <Bar
              dataKey="hours"
              fill="url(#monthlyBar)"
              radius={[6, 6, 0, 0]}
              maxBarSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Motivational quote card                                                    */
/* -------------------------------------------------------------------------- */

function QuoteCard() {
  const [index, setIndex] = useState<number>(() =>
    Math.floor(Math.random() * QUOTES.length)
  );

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % QUOTES.length);
  }, []);

  const quote = QUOTES[index];

  return (
    <GlassCard className="relative flex h-full flex-col overflow-hidden p-6">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -right-6 h-32 w-32 rounded-full bg-fuchsia-500/15 blur-3xl" />

      <div className="relative flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
          <Quote className="h-5 w-5" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={next}
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-violet-500"
          aria-label="Next quote"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative mt-4 flex-1">
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <p className="text-base font-medium italic leading-relaxed text-foreground/90 sm:text-lg">
              &ldquo;{quote.text}&rdquo;
            </p>
            <footer className="text-sm font-medium text-violet-600 dark:text-violet-300">
              — {quote.author}
            </footer>
          </motion.blockquote>
        </AnimatePresence>
      </div>

      <div className="relative mt-4 flex items-center gap-1.5">
        {QUOTES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Quote ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index
                ? "w-6 bg-violet-500"
                : "w-1.5 bg-violet-500/25 hover:bg-violet-500/50"
            )}
          />
        ))}
      </div>
    </GlassCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Subject progress list                                                      */
/* -------------------------------------------------------------------------- */

function SubjectProgressList({
  data,
}: {
  data: Analytics["subjectPerformance"];
}) {
  const top = useMemo(() => [...data].sort((a, b) => b.progress - a.progress).slice(0, 4), [data]);

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <GraduationCap className="h-4 w-4 text-violet-500" />
          Subject Progress
        </h3>
        <span className="text-xs text-muted-foreground">Top {top.length}</span>
      </div>
      {top.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No subjects tracked yet.
        </div>
      ) : (
        <ul className="space-y-4">
          {top.map((subject, i) => {
            const c = colorOf(subject.color);
            return (
              <motion.li
                key={`${subject.name}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              >
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: c.chart }}
                    />
                    {subject.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {subject.progress}%
                  </span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={subject.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${subject.progress}%` }}
                    transition={{ duration: 0.8, delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: c.chart }}
                  />
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Upcoming exams preview                                                     */
/* -------------------------------------------------------------------------- */

function ExamsPreview({
  exams,
  onViewAll,
}: {
  exams: Exam[];
  onViewAll: () => void;
}) {
  const next = useMemo(
    () =>
      [...exams]
        .filter((e) => daysUntil(e.date) >= 0)
        .sort(
          (a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        .slice(0, 3),
    [exams]
  );

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <AlarmClock className="h-4 w-4 text-amber-500" />
          Upcoming Exams
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAll}
          className="gap-1 text-muted-foreground hover:text-violet-500"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {next.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No upcoming exams"
          description="Enjoy the calm — schedule a new exam and we'll help you prepare."
          className="py-10"
        />
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {next.map((exam, i) => {
              const days = daysUntil(exam.date);
              const priority = exam.priority as Priority;
              const pc = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
              const dateObj = new Date(exam.date);

              return (
                <motion.li
                  key={exam.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="group flex items-center gap-3 rounded-2xl border border-violet-500/10 bg-violet-500/[0.03] p-3 transition-colors hover:border-violet-500/25 hover:bg-violet-500/[0.06]"
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-white shadow-md",
                      "bg-gradient-to-br from-amber-500 to-orange-600"
                    )}
                  >
                    <span className="text-sm font-bold leading-none">
                      {Number.isNaN(dateObj.getTime()) ? "--" : dateObj.getDate()}
                    </span>
                    <span className="text-[9px] font-medium uppercase leading-none mt-0.5">
                      {Number.isNaN(dateObj.getTime())
                        ? "--"
                        : format(dateObj, "MMM")}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {exam.examName}
                      </p>
                      <span
                        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", pc.dot)}
                        title={`${pc.label} priority`}
                      />
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/70">
                        {exam.subject || "General"}
                      </span>
                      {exam.location && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {exam.location}
                          </span>
                        </>
                      )}
                      {exam.time && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="inline-flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {exam.time}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                        days <= 1
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                          : days <= 7
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                            : "bg-violet-500/15 text-violet-600 dark:text-violet-300"
                      )}
                    >
                      {formatCountdown(days)}
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </GlassCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Today's tasks preview                                                      */
/* -------------------------------------------------------------------------- */

function TodayTasksPreview({
  todos,
  onViewAll,
}: {
  todos: Todo[];
  onViewAll: () => void;
}) {
  const todays = useMemo(() => {
    const today = new Date();
    return todos
      .filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return Number.isNaN(d.getTime()) ? false : isSameDay(d, today);
      })
      .slice(0, 5);
  }, [todos]);

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <ListTodo className="h-4 w-4 text-violet-500" />
          Today's Tasks
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAll}
          className="gap-1 text-muted-foreground hover:text-violet-500"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {todays.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Nothing due today"
          description="You're all caught up. Add a task or take a well-deserved break."
          className="py-10"
        />
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {todays.map((todo, i) => {
              const priority = todo.priority as Priority;
              const pc = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
              const isDone = todo.status === "completed";

              return (
                <motion.li
                  key={todo.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                  className="group flex items-center gap-3 rounded-xl border border-violet-500/5 bg-violet-500/[0.02] px-3 py-2.5 transition-colors hover:border-violet-500/20 hover:bg-violet-500/[0.06]"
                >
                  <span
                    className={cn("h-2 w-2 shrink-0 rounded-full", pc.dot)}
                    title={`${pc.label} priority`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        isDone && "text-muted-foreground line-through"
                      )}
                    >
                      {todo.title}
                    </p>
                    {todo.subject && (
                      <p className="truncate text-xs text-muted-foreground">
                        {todo.subject}
                      </p>
                    )}
                  </div>
                  {isDone ? (
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <CheckCheck className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-transparent">
                      <Circle className="h-3 w-3" />
                    </span>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </GlassCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading skeletons                                                          */
/* -------------------------------------------------------------------------- */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-[260px] w-full rounded-3xl" />
          <Skeleton className="h-[240px] w-full rounded-3xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[240px] w-full rounded-3xl" />
          <Skeleton className="h-[200px] w-full rounded-3xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-[260px] w-full rounded-3xl" />
        <Skeleton className="h-[260px] w-full rounded-3xl" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export function DashboardHome() {
  const user = useAppStore((s) => s.user);
  const setView = useAppStore((s) => s.setView);

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [a, t] = await Promise.all([
          apiFetch<Analytics>("/api/analytics"),
          apiFetch<{ todos: Todo[] }>("/api/todos")
            .then((r) => r.todos ?? [])
            .catch(() => [] as Todo[]),
        ]);
        if (!active) return;
        setAnalytics(a);
        setTodos(t);
      } catch (err) {
        handleError(err, "Failed to load dashboard");
        toast.error("Could not load your dashboard. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const username = user?.username ?? "there";

  return (
    <PageTransition className="space-y-6 sm:space-y-8">
      <GreetingHeader username={username} />

      {loading || !analytics ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Stat cards */}
          <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {STAT_CARDS.map((cfg) => (
              <StatCard
                key={cfg.key}
                config={cfg}
                stats={analytics.stats}
              />
            ))}
          </StaggerContainer>

          {/* Two-column section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <WeeklyChart data={analytics.weeklyData} />
              <MonthlyChart data={analytics.monthlyData} />
            </div>
            <div className="space-y-6">
              <QuoteCard />
              <SubjectProgressList data={analytics.subjectPerformance} />
            </div>
          </div>

          {/* Exams + Today's tasks */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ExamsPreview
              exams={analytics.upcomingExams}
              onViewAll={() => setView("exams")}
            />
            <TodayTasksPreview
              todos={todos}
              onViewAll={() => setView("todos")}
            />
          </div>
        </>
      )}
    </PageTransition>
  );
}

export default DashboardHome;
