"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  GraduationCap,
  User,
  TrendingUp,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Timer,
  StickyNote,
  AlertTriangle,
  Target,
  Flame,
} from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  type Subject,
  type Todo,
  type Exam,
  type FocusSession,
  type Priority,
  colorOf,
  PRIORITY_CONFIG,
  CATEGORY_CONFIG,
} from "@/lib/types";
import { apiFetch, handleError } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/shared/feedback";

interface SubjectDetailDrawerProps {
  subject: Subject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RelatedData {
  todos: Todo[];
  exams: Exam[];
  sessions: FocusSession[];
}

const STATUS_LABEL: Record<Todo["status"], { label: string; cls: string; icon: typeof Circle }> = {
  todo: { label: "To Do", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-300", icon: Circle },
  "in-progress": { label: "In Progress", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400", icon: Clock },
  completed: { label: "Done", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
};

function priorityChip(p: Priority) {
  const cfg = PRIORITY_CONFIG[p] ?? PRIORITY_CONFIG.medium;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
        cfg.soft,
        cfg.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Clock;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-muted/30 px-3 py-2 ring-1 ring-border/40">
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white",
          accent
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function SubjectDetailDrawer({
  subject,
  open,
  onOpenChange,
}: SubjectDetailDrawerProps) {
  const [related, setRelated] = useState<RelatedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"tasks" | "exams" | "focus" | "notes">("tasks");

  const loadRelated = useCallback(async () => {
    if (!subject) return;
    setLoading(true);
    try {
      const [todosRes, examsRes, sessionsRes] = await Promise.all([
        apiFetch<{ todos: Todo[] }>("/api/todos"),
        apiFetch<{ exams: Exam[] }>("/api/exams"),
        apiFetch<{ sessions: FocusSession[] }>("/api/focus-session"),
      ]);
      const subjectName = subject.name;
      setRelated({
        todos: (todosRes.todos ?? []).filter((t) => t.subject === subjectName),
        exams: (examsRes.exams ?? []).filter((e) => e.subject === subjectName),
        sessions: (sessionsRes.sessions ?? []).filter((s) => s.subject === subjectName),
      });
    } catch (err) {
      handleError(err, "Failed to load subject details");
    } finally {
      setLoading(false);
    }
  }, [subject]);

  useEffect(() => {
    if (open && subject) {
      setTab("tasks");
      void loadRelated();
    } else {
      setRelated(null);
    }
  }, [open, subject, loadRelated]);

  const color = subject ? colorOf(subject.color) : colorOf("violet");

  const stats = useMemo(() => {
    if (!related) return null;
    const completedTasks = related.todos.filter((t) => t.status === "completed").length;
    const totalFocusMin = related.sessions
      .filter((s) => s.type === "focus")
      .reduce((sum, s) => sum + s.duration, 0);
    const upcomingExams = related.exams.filter(
      (e) => new Date(e.date).getTime() >= Date.now() - 86_400_000
    ).length;
    return {
      taskCount: related.todos.length,
      completedTasks,
      examCount: related.exams.length,
      upcomingExams,
      focusMinutes: totalFocusMin,
      focusHours: Math.round((totalFocusMin / 60) * 10) / 10,
      sessions: related.sessions.filter((s) => s.type === "focus").length,
    };
  }, [related]);

  const tabs = [
    { id: "tasks" as const, label: "Tasks", count: related?.todos.length ?? 0 },
    { id: "exams" as const, label: "Exams", count: related?.exams.length ?? 0 },
    { id: "focus" as const, label: "Focus", count: related?.sessions.filter((s) => s.type === "focus").length ?? 0 },
    { id: "notes" as const, label: "Notes", count: subject?.notes ? 1 : 0 },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l-border/60 bg-background/95 p-0 backdrop-blur-xl sm:max-w-md"
      >
        {subject && (
          <>
            {/* Hero header with gradient accent */}
            <div className="relative overflow-hidden">
              {/* Color accent strip */}
              <div className={cn("h-1.5 w-full", color.bg)} />
              {/* Decorative blob */}
              <div
                className={cn(
                  "pointer-events-none absolute -right-12 -top-8 h-40 w-40 rounded-full opacity-30 blur-3xl",
                  color.bg
                )}
              />

              <SheetHeader className="relative px-5 pb-3 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-sm",
                          color.bg
                        )}
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                      </span>
                      <SheetTitle className="truncate text-xl font-bold tracking-tight">
                        {subject.name}
                      </SheetTitle>
                    </div>
                    <SheetDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {subject.teacher && (
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {subject.teacher}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {subject.credits} credit{subject.credits === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {subject.progress}% prepared
                      </span>
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* Stat pills */}
              <div className="relative grid grid-cols-2 gap-2 px-5 pb-3">
                <StatPill
                  icon={CheckCircle2}
                  label="Tasks"
                  value={stats ? `${stats.completedTasks}/${stats.taskCount}` : "—"}
                  accent="bg-gradient-to-br from-violet-500 to-fuchsia-500"
                />
                <StatPill
                  icon={Calendar}
                  label="Exams"
                  value={stats ? `${stats.examCount}` : "—"}
                  accent="bg-gradient-to-br from-amber-500 to-orange-500"
                />
                <StatPill
                  icon={Timer}
                  label="Focus hours"
                  value={stats ? stats.focusHours : "—"}
                  accent="bg-gradient-to-br from-emerald-500 to-teal-500"
                />
                <StatPill
                  icon={Flame}
                  label="Sessions"
                  value={stats ? stats.sessions : "—"}
                  accent="bg-gradient-to-br from-rose-500 to-pink-500"
                />
              </div>

              {/* Attendance ring + progress */}
              <div className="relative mx-5 mb-4 flex items-center gap-4 rounded-2xl bg-muted/30 p-3 ring-1 ring-border/40">
                <div className="relative h-14 w-14 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-muted/40" />
                    <motion.circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke={color.chart}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${(subject.attendance / 100) * 97.4} 97.4`}
                      initial={{ strokeDasharray: "0 97.4" }}
                      animate={{ strokeDasharray: `${(subject.attendance / 100) * 97.4} 97.4` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums">
                    {subject.attendance}%
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Attendance
                    </span>
                    {subject.attendance >= 75 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Good
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-3 w-3" /> At risk
                      </span>
                    )}
                  </div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Course progress
                    </span>
                    <span className="text-xs font-semibold tabular-nums">
                      {subject.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color.chart }}
                      initial={{ width: 0 }}
                      animate={{ width: `${subject.progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="relative flex gap-1 border-b border-border/40 px-3">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors",
                      tab === t.id
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums",
                        tab === t.id
                          ? cn("text-white", color.bg)
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {t.count}
                    </span>
                    {tab === t.id && (
                      <motion.div
                        layoutId="subject-tab-underline"
                        className={cn(
                          "absolute inset-x-2 -bottom-px h-0.5 rounded-full",
                          color.bg
                        )}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="min-h-[40vh] p-4">
              {loading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    {tab === "tasks" && (
                      <TaskList todos={related?.todos ?? []} />
                    )}
                    {tab === "exams" && (
                      <ExamList exams={related?.exams ?? []} />
                    )}
                    {tab === "focus" && (
                      <FocusList sessions={related?.sessions ?? []} />
                    )}
                    {tab === "notes" && (
                      <NotesPanel notes={subject.notes} />
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab panels                                                                 */
/* -------------------------------------------------------------------------- */

function EmptyTab({
  icon: Icon,
  message,
}: {
  icon: typeof Circle;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40">
        <Icon className="h-5 w-5 text-muted-foreground/60" />
      </span>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

function TaskList({ todos }: { todos: Todo[] }) {
  if (todos.length === 0) {
    return <EmptyTab icon={CheckCircle2} message="No tasks linked to this subject yet." />;
  }
  return (
    <ul className="space-y-2">
      {todos.map((t) => {
        const StatusIcon = STATUS_LABEL[t.status].icon;
        const cat = CATEGORY_CONFIG[t.category];
        return (
          <li
            key={t.id}
            className="group flex items-start gap-3 rounded-2xl border border-border/40 bg-background/40 p-3 transition-colors hover:bg-muted/30"
          >
            <StatusIcon
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                t.status === "completed"
                  ? "text-emerald-500"
                  : t.status === "in-progress"
                    ? "text-amber-500"
                    : "text-muted-foreground"
              )}
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-sm font-medium",
                  t.status === "completed" && "text-muted-foreground line-through"
                )}
              >
                {t.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">
                  {cat.icon} {cat.label}
                </span>
                {t.dueDate && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="h-2.5 w-2.5" />
                    {format(parseISO(t.dueDate), "MMM d")}
                  </span>
                )}
                {priorityChip(t.priority)}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ExamList({ exams }: { exams: Exam[] }) {
  if (exams.length === 0) {
    return <EmptyTab icon={Calendar} message="No exams scheduled for this subject." />;
  }
  return (
    <ul className="space-y-2">
      {exams.map((e) => {
        const days = Math.ceil(
          (parseISO(e.date).getTime() - Date.now()) / 86_400_000
        );
        return (
          <li
            key={e.id}
            className="rounded-2xl border border-border/40 bg-background/40 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-tight">{e.examName}</p>
              {priorityChip(e.priority)}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5" />
                {format(parseISO(e.date), "MMM d, yyyy")}
              </span>
              {e.time && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {e.time}
                </span>
              )}
              {e.location && (
                <span className="inline-flex items-center gap-1">
                  <Target className="h-2.5 w-2.5" />
                  {e.location}
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  style={{ width: `${e.progress}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold tabular-nums">
                {e.progress}%
              </span>
            </div>
            <div className="mt-2">
              {days < 0 ? (
                <Badge variant="outline" className="border-muted text-muted-foreground">
                  Past exam
                </Badge>
              ) : days === 0 ? (
                <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  Today!
                </Badge>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  in {days} day{days === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function FocusList({ sessions }: { sessions: FocusSession[] }) {
  const focusSessions = sessions.filter((s) => s.type === "focus");
  if (focusSessions.length === 0) {
    return <EmptyTab icon={Timer} message="No focus sessions logged for this subject." />;
  }
  const totalMin = focusSessions.reduce((sum, s) => sum + s.duration, 0);
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-3 ring-1 ring-violet-500/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Total focus time
          </span>
          <span className="text-lg font-bold tabular-nums">
            {Math.floor(totalMin / 60)}h {totalMin % 60}m
          </span>
        </div>
      </div>
      <ul className="space-y-2">
        {focusSessions.slice(0, 20).map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-3 rounded-2xl border border-border/40 bg-background/40 p-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
              <Timer className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tabular-nums">
                {s.duration} min
              </p>
              <p className="text-[10px] text-muted-foreground">
                {format(parseISO(s.date), "MMM d, yyyy")} ·{" "}
                {formatDistanceToNow(parseISO(s.createdAt), { addSuffix: true })}
              </p>
            </div>
            {s.completed && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotesPanel({ notes }: { notes: string }) {
  if (!notes.trim()) {
    return <EmptyTab icon={StickyNote} message="No notes for this subject yet." />;
  }
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <StickyNote className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          Notes
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {notes}
      </p>
    </div>
  );
}
