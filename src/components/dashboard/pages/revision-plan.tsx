"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  GraduationCap,
  ListChecks,
  Plus,
  Sparkles,
  Target,
  Timer,
  Trash2,
} from "lucide-react";
import { format, isAfter, isToday, parseISO } from "date-fns";
import { toast } from "sonner";

import { apiFetch, handleError } from "@/lib/api";
import { readPageCache, writePageCache } from "@/lib/page-cache";
import {
  Exam,
  ExamRevisionTopic,
  RevisionTopicStatus,
  colorOf,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { PageTransition } from "@/components/shared/motion";
import { EmptyState, Skeleton } from "@/components/shared/feedback";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FORM_FIELD_CLASS =
  "rounded-lg border-border/75 bg-background/90 shadow-sm transition-colors hover:bg-card focus-visible:border-violet-400/70 focus-visible:ring-violet-500/20 dark:border-border/55 dark:bg-background/60 dark:hover:bg-background/75";
const MAX_REVISION_TOPICS_PER_EXAM = 5;

const STATUS_CONFIG: Record<
  RevisionTopicStatus,
  {
    label: string;
    weight: number;
    icon: typeof Circle;
    className: string;
    dotClassName: string;
  }
> = {
  "not-started": {
    label: "Not Started",
    weight: 0,
    icon: Circle,
    className: "bg-muted/60 text-muted-foreground",
    dotClassName: "bg-muted-foreground/40",
  },
  "in-progress": {
    label: "In Progress",
    weight: 35,
    icon: Timer,
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    dotClassName: "bg-amber-500",
  },
  revised: {
    label: "Revised",
    weight: 75,
    icon: CheckCircle2,
    className: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    dotClassName: "bg-violet-500",
  },
  mastered: {
    label: "Mastered",
    weight: 100,
    icon: CheckCircle2,
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    dotClassName: "bg-emerald-500",
  },
};

type TopicWithExam = ExamRevisionTopic & {
  exam: Exam;
  daysLeft: number;
};

function examDate(exam: Exam): Date {
  const base = parseISO(exam.date);
  if (exam.time) {
    const [h, m] = exam.time.split(":").map((v) => Number(v));
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      base.setHours(h, m, 0, 0);
    }
  }
  return base;
}

function daysUntilExam(exam: Exam): number {
  const target = examDate(exam);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000));
}

function revisionProgress(topics: ExamRevisionTopic[] | undefined, fallback: number) {
  if (!topics?.length) return fallback;
  return Math.round(
    topics.reduce((sum, topic) => sum + STATUS_CONFIG[topic.status].weight, 0) /
      topics.length
  );
}

function targetLabel(index: number) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return `Day ${index + 1}`;
}

function nextTopicsForExam(exam: Exam) {
  return (exam.revisionTopics ?? []).filter((topic) => topic.status !== "mastered");
}

function replaceTopic(
  exams: Exam[],
  examId: string,
  topicId: string,
  replacement: ExamRevisionTopic
) {
  return exams.map((exam) =>
    exam.id === examId
      ? {
          ...exam,
          revisionTopics: (exam.revisionTopics ?? []).map((topic) =>
            topic.id === topicId ? replacement : topic
          ),
        }
      : exam
  );
}

function appendTopic(exams: Exam[], examId: string, topicToAdd: ExamRevisionTopic) {
  return exams.map((exam) =>
    exam.id === examId
      ? {
          ...exam,
          revisionTopics: [...(exam.revisionTopics ?? []), topicToAdd],
        }
      : exam
  );
}

function removeTopic(exams: Exam[], examId: string, topicId: string) {
  return exams.map((exam) =>
    exam.id === examId
      ? {
          ...exam,
          revisionTopics: (exam.revisionTopics ?? []).filter(
            (topic) => topic.id !== topicId
          ),
        }
      : exam
  );
}

function TopicStatusSelect({
  topic,
  busy,
  onChange,
}: {
  topic: ExamRevisionTopic;
  busy: boolean;
  onChange: (status: RevisionTopicStatus) => void;
}) {
  return (
    <Select
      value={topic.status}
      disabled={busy}
      onValueChange={(value) => onChange(value as RevisionTopicStatus)}
    >
      <SelectTrigger className="h-8 w-[132px] rounded-lg border-border/70 bg-background/85 text-xs shadow-sm dark:border-border/60 dark:bg-background/60">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="dashboard-menu-surface p-1">
        {(Object.keys(STATUS_CONFIG) as RevisionTopicStatus[]).map((key) => (
          <SelectItem key={key} value={key}>
            <span className="flex items-center gap-2">
              <span
                className={cn("h-1.5 w-1.5 rounded-full", STATUS_CONFIG[key].dotClassName)}
              />
              {STATUS_CONFIG[key].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix = "",
  gradient,
}: {
  icon: typeof Target;
  label: string;
  value: number;
  suffix?: string;
  gradient: string;
}) {
  return (
    <div className="dashboard-surface relative overflow-hidden p-3 sm:p-4">
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">
            <AnimatedCounter value={value} suffix={suffix} />
          </p>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ring-1 ring-white/20 dark:ring-white/10",
            gradient
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </div>
  );
}

function TodayTargets({
  targets,
  onViewExam,
}: {
  targets: TopicWithExam[];
  onViewExam: () => void;
}) {
  return (
    <div className="dashboard-surface overflow-hidden p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="dashboard-chip border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <Target className="h-3.5 w-3.5" />
            Today&apos;s Revision
          </div>
          <h2 className="text-lg font-bold tracking-tight">Study targets for today</h2>
        </div>
        <Button variant="outline" size="sm" onClick={onViewExam} className="rounded-lg border-border/70 bg-background/85 shadow-sm hover:bg-muted/60 dark:border-border/60 dark:bg-background/60">
          <GraduationCap className="h-4 w-4" />
          Exams
        </Button>
      </div>

      {targets.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No revision target today"
          description="Add topics to upcoming exams and StudySpark will surface your next targets here."
          className="dashboard-row border-dashed py-8"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {targets.map((topic) => (
            <div
              key={topic.id}
              className="dashboard-row bg-gradient-to-br from-emerald-500/12 to-cyan-500/8 p-4 ring-1 ring-emerald-500/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{topic.title}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {topic.exam.subject || "General"} · {topic.exam.examName}
                  </p>
                </div>
                <Badge className="shrink-0 border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Clock className="h-3 w-3" />
                  {topic.estimatedMinutes} min
                </Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Exam {topic.daysLeft === 0 ? "today" : `in ${topic.daysLeft} day${topic.daysLeft === 1 ? "" : "s"}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExamRevisionCard({
  exam,
  busyTopicId,
  onAddTopic,
  onStatusChange,
  onDeleteTopic,
}: {
  exam: Exam;
  busyTopicId: string | null;
  onAddTopic: (exam: Exam, title: string) => Promise<void>;
  onStatusChange: (exam: Exam, topic: ExamRevisionTopic, status: RevisionTopicStatus) => Promise<void>;
  onDeleteTopic: (exam: Exam, topic: ExamRevisionTopic) => Promise<void>;
}) {
  const [topicTitle, setTopicTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const topics = exam.revisionTopics ?? [];
  const hasReachedTopicLimit = topics.length >= MAX_REVISION_TOPICS_PER_EXAM;
  const nextTopics = nextTopicsForExam(exam);
  const readiness = revisionProgress(topics, exam.progress);
  const daysLeft = daysUntilExam(exam);
  const color = colorOf("violet");

  const submitTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = topicTitle.trim();
    if (!title) return;
    if (hasReachedTopicLimit) {
      toast.error(`You can add up to ${MAX_REVISION_TOPICS_PER_EXAM} revision topics per exam`);
      return;
    }
    setAdding(true);
    try {
      setTopicTitle("");
      await onAddTopic(exam, title);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="dashboard-surface flex h-full flex-col gap-4 p-4 transition-colors hover:border-violet-500/30 hover:bg-violet-500/[0.03] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge className={cn("mb-2 border-transparent text-white", color.bg)}>
            <GraduationCap className="h-3 w-3" />
            {exam.subject || "General"}
          </Badge>
          <h3 className="truncate text-lg font-bold tracking-tight">{exam.examName}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {format(examDate(exam), "MMM d, yyyy")} ·{" "}
            {daysLeft === 0 ? "Today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums">{readiness}%</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Ready
          </p>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${readiness}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "h-full rounded-full bg-gradient-to-r",
            readiness >= 80
              ? "from-emerald-500 to-teal-500"
              : readiness >= 40
                ? "from-violet-500 to-fuchsia-500"
                : "from-amber-500 to-orange-500"
          )}
        />
      </div>

      {nextTopics.length > 0 && (
        <div className="dashboard-row p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <ListChecks className="h-3.5 w-3.5" />
            Suggested targets
          </p>
          <div className="space-y-1.5">
            {nextTopics.slice(0, Math.min(nextTopics.length, Math.max(daysLeft, 1))).map((topic, index) => (
              <div key={topic.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="shrink-0 font-semibold text-violet-600 dark:text-violet-400">
                  {targetLabel(index)}
                </span>
                <span className="min-w-0 flex-1 truncate text-right text-muted-foreground">
                  {topic.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submitTopic} className="flex gap-2">
        <Input
          value={topicTitle}
          onChange={(e) => setTopicTitle(e.target.value)}
          disabled={hasReachedTopicLimit}
          placeholder={
            hasReachedTopicLimit
              ? "Topic limit reached"
              : "Add revision topic"
          }
          className={FORM_FIELD_CLASS}
        />
        <Button
          type="submit"
          disabled={adding || hasReachedTopicLimit || !topicTitle.trim()}
          className="shrink-0 rounded-lg accent-gradient text-white shadow-md shadow-violet-500/20"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </form>
      <p className="text-[11px] text-muted-foreground">
        {topics.length}/{MAX_REVISION_TOPICS_PER_EXAM} revision topics used
      </p>

      <div className="min-h-0 flex-1 space-y-2">
        {topics.length === 0 ? (
          <div className="dashboard-row border-dashed px-3 py-5 text-center">
            <p className="text-sm font-medium">No topics yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add chapters or question sets for this exam.
            </p>
          </div>
        ) : (
          topics.map((topic) => {
            const status = STATUS_CONFIG[topic.status];
            const StatusIcon = status.icon;
            return (
              <div
                key={topic.id}
                className="dashboard-row flex items-center gap-2 p-2.5"
              >
                <StatusIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {topic.title}
                </span>
                <TopicStatusSelect
                  topic={topic}
                  busy={busyTopicId === topic.id}
                  onChange={(status) => onStatusChange(exam, topic, status)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={busyTopicId === topic.id}
                  onClick={() => onDeleteTopic(exam, topic)}
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-rose-500"
                  aria-label={`Delete ${topic.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatusBoard({
  topics,
}: {
  topics: TopicWithExam[];
}) {
  const columns = Object.keys(STATUS_CONFIG) as RevisionTopicStatus[];

  return (
    <div className="dashboard-surface p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
          <BookOpenCheck className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Topic Board</h2>
          <p className="text-xs text-muted-foreground">All revision topics grouped by status</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((statusKey) => {
          const config = STATUS_CONFIG[statusKey];
          const items = topics.filter((topic) => topic.status === statusKey);
          return (
            <div key={statusKey} className="dashboard-row p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <Badge className={cn("border-transparent", config.className)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClassName)} />
                  {config.label}
                </Badge>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="dashboard-row border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                    Empty
                  </p>
                ) : (
                  items.slice(0, 5).map((topic) => (
                    <div key={topic.id} className="dashboard-row p-3">
                      <p className="truncate text-sm font-medium">{topic.title}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {topic.exam.examName}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RevisionPlanPage() {
  const setView = useAppStore((s) => s.setView);
  const userId = useAppStore((s) => s.user?.id);
  const initialCache = useMemo(
    () => readPageCache<{ exams: Exam[] }>("revision-plan", userId),
    [userId]
  );
  const [exams, setExams] = useState<Exam[]>(() => initialCache?.exams ?? []);
  const [loading, setLoading] = useState(() => !initialCache);
  const [busyTopicId, setBusyTopicId] = useState<string | null>(null);

  const loadExams = useCallback(async () => {
    const cached = readPageCache<{ exams: Exam[] }>("revision-plan", userId);
    if (cached) {
      setExams(cached.exams);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const res = await apiFetch<{ exams: Exam[] }>("/api/exams");
      setExams(res.exams ?? []);
      writePageCache("revision-plan", userId, { exams: res.exams ?? [] });
    } catch (err) {
      handleError(err, "Failed to load revision plans");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadExams();
  }, [loadExams]);

  useEffect(() => {
    if (!loading) {
      writePageCache("revision-plan", userId, { exams });
    }
  }, [exams, loading, userId]);

  const upcomingExams = useMemo(() => {
    const now = new Date();
    return [...exams]
      .filter((exam) => isToday(examDate(exam)) || isAfter(examDate(exam), now))
      .sort((a, b) => examDate(a).getTime() - examDate(b).getTime());
  }, [exams]);

  const allTopics = useMemo<TopicWithExam[]>(() => {
    return upcomingExams.flatMap((exam) =>
      (exam.revisionTopics ?? []).map((topic) => ({
        ...topic,
        exam,
        daysLeft: daysUntilExam(exam),
      }))
    );
  }, [upcomingExams]);

  const todayTargets = useMemo(() => {
    return upcomingExams
      .map((exam) => {
        const next = nextTopicsForExam(exam)[0];
        return next ? { ...next, exam, daysLeft: daysUntilExam(exam) } : null;
      })
      .filter((topic): topic is TopicWithExam => Boolean(topic))
      .slice(0, 6);
  }, [upcomingExams]);

  const stats = useMemo(() => {
    const mastered = allTopics.filter((topic) => topic.status === "mastered").length;
    const active = allTopics.filter((topic) => topic.status === "in-progress").length;
    const avgReadiness =
      upcomingExams.length === 0
        ? 0
        : Math.round(
            upcomingExams.reduce(
              (sum, exam) => sum + revisionProgress(exam.revisionTopics, exam.progress),
              0
            ) / upcomingExams.length
          );
    return {
      exams: upcomingExams.length,
      topics: allTopics.length,
      active,
      mastered,
      avgReadiness,
    };
  }, [allTopics, upcomingExams]);

  const commitExams = useCallback(
    (updater: (current: Exam[]) => Exam[]) => {
      setExams((current) => {
        const next = updater(current);
        writePageCache("revision-plan", userId, { exams: next });
        return next;
      });
    },
    [userId]
  );

  const addTopic = async (exam: Exam, title: string) => {
    const previousExams = exams;
    const now = new Date().toISOString();
    const optimisticTopic: ExamRevisionTopic = {
      id: `temp-${Date.now()}`,
      examId: exam.id,
      title,
      status: "not-started",
      targetDate: null,
      estimatedMinutes: 45,
      order: exam.revisionTopics?.length ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    commitExams((current) => appendTopic(current, exam.id, optimisticTopic));
    setBusyTopicId(optimisticTopic.id);
    try {
      const res = await apiFetch<{ topic: ExamRevisionTopic }>(
        `/api/exams/${exam.id}/revision-topics`,
        {
          method: "POST",
          body: JSON.stringify({ title }),
        }
      );
      commitExams((current) =>
        replaceTopic(current, exam.id, optimisticTopic.id, res.topic)
      );
      toast.success("Revision topic added");
    } catch (err) {
      setExams(previousExams);
      writePageCache("revision-plan", userId, { exams: previousExams });
      handleError(err, "Failed to add revision topic");
    } finally {
      setBusyTopicId(null);
    }
  };

  const updateTopicStatus = async (
    exam: Exam,
    topic: ExamRevisionTopic,
    status: RevisionTopicStatus
  ) => {
    if (topic.status === status) return;

    const previousExams = exams;
    const optimisticTopic = {
      ...topic,
      status,
      updatedAt: new Date().toISOString(),
    };

    commitExams((current) =>
      replaceTopic(current, exam.id, topic.id, optimisticTopic)
    );
    setBusyTopicId(topic.id);
    try {
      const res = await apiFetch<{ topic: ExamRevisionTopic }>(
        `/api/exams/${exam.id}/revision-topics/${topic.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ status }),
        }
      );
      commitExams((current) => replaceTopic(current, exam.id, topic.id, res.topic));
    } catch (err) {
      setExams(previousExams);
      writePageCache("revision-plan", userId, { exams: previousExams });
      handleError(err, "Failed to update topic");
    } finally {
      setBusyTopicId(null);
    }
  };

  const deleteTopic = async (exam: Exam, topic: ExamRevisionTopic) => {
    const previousExams = exams;
    commitExams((current) => removeTopic(current, exam.id, topic.id));
    setBusyTopicId(topic.id);
    try {
      await apiFetch(`/api/exams/${exam.id}/revision-topics/${topic.id}`, {
        method: "DELETE",
      });
      toast.success("Revision topic removed");
    } catch (err) {
      setExams(previousExams);
      writePageCache("revision-plan", userId, { exams: previousExams });
      handleError(err, "Failed to remove topic");
    } finally {
      setBusyTopicId(null);
    }
  };

  return (
    <PageTransition className="space-y-4">
      {/* Subtitle & Actions Bar */}
      <header className="dashboard-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="space-y-1">
          <div className="dashboard-chip dashboard-theme-glow-chip dashboard-theme-glow-text">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Your exam roadmap</span>
          </div>
          <p className="text-sm text-muted-foreground">
            See every exam topic, today&apos;s revision targets, and progress in one place.
          </p>
        </div>
        <Button
          onClick={() => setView("exams")}
          className="h-10 rounded-lg accent-gradient text-white shadow-md shadow-violet-500/20"
        >
          <GraduationCap className="h-4 w-4" />
          Manage Exams
        </Button>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))
        ) : (
          <>
            <StatCard icon={GraduationCap} label="Upcoming exams" value={stats.exams} gradient="bg-gradient-to-br from-violet-500 to-fuchsia-500" />
            <StatCard icon={ListChecks} label="Revision topics" value={stats.topics} gradient="bg-gradient-to-br from-fuchsia-500 to-pink-500" />
            <StatCard icon={Timer} label="In progress" value={stats.active} gradient="bg-gradient-to-br from-amber-500 to-orange-500" />
            <StatCard icon={CheckCircle2} label="Mastered" value={stats.mastered} gradient="bg-gradient-to-br from-emerald-500 to-teal-500" />
            <StatCard icon={Target} label="Avg. ready" value={stats.avgReadiness} suffix="%" gradient="bg-gradient-to-br from-cyan-500 to-blue-500" />
          </>
        )}
      </section>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      ) : upcomingExams.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No upcoming exams"
          description="Add an exam first, then come back here to build a revision plan."
          action={
            <Button
              onClick={() => setView("exams")}
              className="rounded-lg accent-gradient text-white shadow-md shadow-violet-500/20"
            >
              <Plus className="h-4 w-4" />
              Add exam
            </Button>
          }
          className="dashboard-surface"
        />
      ) : (
        <>
          <TodayTargets targets={todayTargets} onViewExam={() => setView("exams")} />

          <div className="grid gap-4 lg:grid-cols-2">
            {upcomingExams.map((exam) => (
              <div key={exam.id}>
                <ExamRevisionCard
                  exam={exam}
                  busyTopicId={busyTopicId}
                  onAddTopic={addTopic}
                  onStatusChange={updateTopicStatus}
                  onDeleteTopic={deleteTopic}
                />
              </div>
            ))}
          </div>

          <StatusBoard topics={allTopics} />
        </>
      )}
    </PageTransition>
  );
}

export default RevisionPlanPage;
