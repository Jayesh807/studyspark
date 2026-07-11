"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CalendarClock,
  ClipboardList,
  Flame,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Clock,
  CalendarDays,
  AlertTriangle,
  ChevronDown,
  History,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { format, isAfter, isToday, parseISO } from "date-fns";

import { apiFetch, handleError } from "@/lib/api";
import {
  Exam,
  Subject,
  Priority,
  PRIORITY_CONFIG,
  colorOf,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { playBell } from "./focus-timer";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  PageTransition,
  GlassCard,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion";
import { Skeleton, EmptyState } from "@/components/shared/feedback";
import { AnimatedCounter } from "@/components/shared/animated-counter";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isPast: boolean;
}

function getCountdown(target: Date): CountdownParts {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, totalMs: diff, isPast: false };
}

function urgencyOf(target: Date): "critical" | "soon" | "normal" | "past" {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "past";
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 3) return "critical";
  if (days < 7) return "soon";
  return "normal";
}

function examDate(exam: Exam): Date {
  // Combine date + time if provided (ISO date string from input)
  const base = parseISO(exam.date);
  if (exam.time) {
    const [h, m] = exam.time.split(":").map((v) => Number(v));
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      base.setHours(h, m, 0, 0);
    }
  }
  return base;
}

// ---------------------------------------------------------------------------
// Countdown digit (animated flip-like)
// ---------------------------------------------------------------------------

function FlipDigit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-violet-500/10 to-fuchsia-500/10 px-2 py-1.5 ring-1 ring-violet-500/15 dark:from-violet-500/15 dark:to-fuchsia-500/15 sm:px-2.5 sm:py-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={display}
            initial={{ y: -14, opacity: 0, rotateX: -90 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: 14, opacity: 0, rotateX: 90 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="block text-base font-bold tabular-nums tracking-tight text-foreground sm:text-xl"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground sm:text-[10px]">
        {label}
      </span>
    </div>
  );
}

function CountdownTimer({ target }: { target: Date }) {
  const [parts, setParts] = useState<CountdownParts>(() => getCountdown(target));
  const urgency = urgencyOf(target);

  useEffect(() => {
    setParts(getCountdown(target));
    const id = setInterval(() => {
      setParts(getCountdown(target));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (parts.isPast) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-xl bg-muted/60 px-3 py-2 text-xs font-semibold text-muted-foreground ring-1 ring-border">
        <History className="h-3.5 w-3.5" />
        Exam window passed
      </div>
    );
  }

  const urgencyStyles =
    urgency === "critical"
      ? "from-rose-500/15 to-rose-500/5 ring-rose-500/30"
      : urgency === "soon"
        ? "from-amber-500/15 to-amber-500/5 ring-amber-500/30"
        : "from-violet-500/10 to-fuchsia-500/10 ring-violet-500/20";

  const dotColor =
    urgency === "critical"
      ? "bg-rose-500"
      : urgency === "soon"
        ? "bg-amber-500"
        : "bg-violet-500";

  return (
    <div
      className={cn(
        "relative rounded-2xl bg-gradient-to-br p-3 ring-1",
        urgencyStyles
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
          Time remaining
        </span>
        {urgency === "critical" && (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400" variant="secondary">
            <Flame className="h-3 w-3" />
            Urgent
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        <FlipDigit value={parts.days} label="Days" />
        <FlipDigit value={parts.hours} label="Hrs" />
        <FlipDigit value={parts.minutes} label="Min" />
        <FlipDigit value={parts.seconds} label="Sec" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  gradient: string;
}

function StatCard({ icon: Icon, label, value, decimals = 0, suffix, gradient }: StatCardProps) {
  return (
    <GlassCard className="relative overflow-hidden p-4 sm:p-5">
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
            <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
          </p>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
            gradient,
            "ring-white/20 dark:ring-white/10"
          )}
        >
          <Icon className="h-4.5 w-4.5 text-white" />
        </div>
      </div>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Exam card
// ---------------------------------------------------------------------------

interface ExamCardProps {
  exam: Exam;
  subjects: Subject[];
  onEdit: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
}

function ExamCard({ exam, subjects, onEdit, onDelete }: ExamCardProps) {
  const target = useMemo(() => examDate(exam), [exam]);
  const date = target;

  // Map subject name → color from subjects list (fallback violet)
  const matchedSubject = subjects.find((s) => s.name === exam.subject);
  const colorKey = matchedSubject?.color ?? "violet";
  const color = colorOf(colorKey);

  const priority = PRIORITY_CONFIG[exam.priority];

  return (
    <GlassCard hover className="group relative flex flex-col gap-4 p-5 sm:p-6">
      {/* Top row: subject badge + menu */}
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={cn("border-transparent text-white", color.bg)}
            variant="default"
          >
            <GraduationCap className="h-3 w-3" />
            {exam.subject || "General"}
          </Badge>
          <Badge
            className={cn(priority.soft, priority.text, "border-transparent")}
            variant="secondary"
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
            {priority.label} priority
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mr-1.5 -mt-1.5 opacity-60 transition-opacity hover:opacity-100"
              aria-label="Exam actions"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={() => onEdit(exam)}>
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onDelete(exam)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Exam name */}
      <div className="relative">
        <h3 className="text-lg font-bold leading-tight tracking-tight sm:text-xl">
          {exam.examName}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {format(date, "EEE, MMM d, yyyy")}
          </span>
          {exam.time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {exam.time}
            </span>
          )}
          {exam.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {exam.location}
            </span>
          )}
        </div>
      </div>

      {/* Countdown */}
      <CountdownTimer target={target} />

      {/* Progress */}
      <div className="relative space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">
            Preparation progress
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {exam.progress}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn(
              "h-full rounded-full bg-gradient-to-r",
              exam.progress >= 80
                ? "from-emerald-500 to-teal-500"
                : exam.progress >= 40
                  ? "from-violet-500 to-fuchsia-500"
                  : "from-amber-500 to-orange-500"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${exam.progress}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Notes */}
      {exam.notes && (
        <p className="relative line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {exam.notes}
        </p>
      )}
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Past exam row
// ---------------------------------------------------------------------------

function PastExamRow({ exam }: { exam: Exam }) {
  const target = examDate(exam);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 transition-colors hover:bg-accent/40">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <History className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{exam.examName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {exam.subject} · {format(target, "MMM d, yyyy")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Progress
          </p>
          <p className="text-sm font-semibold tabular-nums">{exam.progress}%</p>
        </div>
        <div className="h-8 w-16 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-violet-500/70"
            initial={{ width: 0 }}
            animate={{ width: `${exam.progress}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form dialog
// ---------------------------------------------------------------------------

interface ExamFormData {
  subject: string;
  examName: string;
  date: string;
  time: string;
  location: string;
  priority: Priority;
  progress: number;
  notes: string;
}

const EMPTY_FORM: ExamFormData = {
  subject: "",
  examName: "",
  date: "",
  time: "",
  location: "",
  priority: "medium",
  progress: 0,
  notes: "",
};

interface ExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Exam | null;
  subjects: Subject[];
  onSubmit: (data: ExamFormData) => Promise<void>;
}

function ExamDialog({
  open,
  onOpenChange,
  initial,
  subjects,
  onSubmit,
}: ExamDialogProps) {
  const [form, setForm] = useState<ExamFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ExamFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          subject: initial.subject ?? "",
          examName: initial.examName ?? "",
          date: initial.date ? initial.date.slice(0, 10) : "",
          time: initial.time ?? "",
          location: initial.location ?? "",
          priority: initial.priority ?? "medium",
          progress: initial.progress ?? 0,
          notes: initial.notes ?? "",
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [open, initial]);

  const update = <K extends keyof ExamFormData>(key: K, value: ExamFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof ExamFormData, string>> = {};
    if (!form.examName.trim()) next.examName = "Exam name is required";
    if (!form.date) next.date = "Date is required";
    if (form.progress < 0 || form.progress > 100)
      next.progress = "Progress must be between 0 and 100";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      handleError(err, "Failed to save exam");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg border-border/50"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              <ClipboardList className="h-4 w-4" />
            </span>
            {initial ? "Edit Exam" : "Add New Exam"}
          </DialogTitle>
          <DialogDescription>
            {initial
              ? "Update the details for this exam."
              : "Track an upcoming exam with a live countdown and prep progress."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="exam-subject">Subject</Label>
            {subjects.length > 0 ? (
              <Select
                value={form.subject}
                onValueChange={(v) => update("subject", v)}
              >
                <SelectTrigger id="exam-subject" className="w-full">
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            colorOf(s.color).bg
                          )}
                        />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="exam-subject"
                placeholder="e.g. Mathematics"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
              />
            )}
          </div>

          {/* Exam name */}
          <div className="space-y-1.5">
            <Label htmlFor="exam-name">
              Exam Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="exam-name"
              placeholder="e.g. Midterm Examination"
              value={form.examName}
              onChange={(e) => update("examName", e.target.value)}
              aria-invalid={!!errors.examName}
            />
            {errors.examName && (
              <p className="text-xs text-rose-500">{errors.examName}</p>
            )}
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exam-date">
                Date <span className="text-rose-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="exam-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.date && "text-muted-foreground"
                    )}
                    aria-invalid={!!errors.date}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {form.date
                      ? format(parseISO(form.date), "MMM d, yyyy")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.date ? parseISO(form.date) : undefined}
                    onSelect={(d) =>
                      update("date", d ? format(d, "yyyy-MM-dd") : "")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-xs text-rose-500">{errors.date}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exam-time">Time</Label>
              <Input
                id="exam-time"
                type="time"
                value={form.time}
                onChange={(e) => update("time", e.target.value)}
              />
            </div>
          </div>

          {/* Location + Priority */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="exam-location">Location</Label>
              <Input
                id="exam-location"
                placeholder="e.g. Hall A, Room 204"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => update("priority", v as Priority)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            PRIORITY_CONFIG[p].dot
                          )}
                        />
                        {PRIORITY_CONFIG[p].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Preparation progress</Label>
              <span className="text-sm font-semibold tabular-nums">
                {form.progress}%
              </span>
            </div>
            <Slider
              value={[form.progress]}
              onValueChange={(v) => update("progress", v[0] ?? 0)}
              min={0}
              max={100}
              step={1}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="exam-notes">Notes</Label>
            <Textarea
              id="exam-notes"
              placeholder="Topics to revise, materials to bring, anything…"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600"
            >
              {submitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {initial ? "Save changes" : "Add exam"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Exam card skeleton
// ---------------------------------------------------------------------------

function ExamCardSkeleton() {
  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-3 w-2/3" />
      <Skeleton className="mt-4 h-20 w-full rounded-2xl" />
      <Skeleton className="mt-4 h-2 w-full rounded-full" />
      <Skeleton className="mt-3 h-3 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState<Exam | null>(null);
  const [pastOpen, setPastOpen] = useState(false);

  const reduceMotion = useAppStore((s) => s.reduceMotion);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [examsRes, subjectsRes] = await Promise.all([
        apiFetch<{ exams: Exam[] }>("/api/exams"),
        apiFetch<{ subjects: Subject[] }>("/api/subjects").catch(() => ({
          subjects: [] as Subject[],
        })),
      ]);
      setExams(examsRes.exams ?? []);
      setSubjects(subjectsRes.subjects ?? []);
    } catch (err) {
      handleError(err, "Failed to load exams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    // Request desktop notification permission on mount
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const sorted = [...exams].sort(
      (a, b) => examDate(a).getTime() - examDate(b).getTime()
    );
    const upcoming = sorted.filter((e) => {
      const d = examDate(e);
      return isAfter(d, now) || isToday(d);
    });
    const past = sorted
      .filter((e) => !isToday(examDate(e)) && !isAfter(examDate(e), now))
      .reverse();
    return { upcoming, past };
  }, [exams]);

  const stats = useMemo(() => {
    const total = exams.length;
    const high = exams.filter((e) => e.priority === "high").length;
    const avgProgress =
      total === 0
        ? 0
        : Math.round(
            exams.reduce((sum, e) => sum + (e.progress ?? 0), 0) / total
          );
    return { total, upcoming: upcoming.length, high, avgProgress };
  }, [exams, upcoming]);

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (exam: Exam) => {
    setEditing(exam);
    setDialogOpen(true);
  };

  const handleDelete = (exam: Exam) => setDeleting(exam);

  const confirmDelete = async () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    // Optimistic remove
    setExams((prev) => prev.filter((e) => e.id !== target.id));
    try {
      await apiFetch(`/api/exams/${target.id}`, { method: "DELETE" });
      toast.success("Exam deleted");
    } catch (err) {
      handleError(err, "Failed to delete exam");
      // Roll back
      setExams((prev) => [...prev, target]);
    }
  };

  const handleSubmit = async (data: ExamFormData) => {
    const payload = {
      subject: data.subject.trim(),
      examName: data.examName.trim(),
      date: data.date,
      time: data.time,
      location: data.location.trim(),
      priority: data.priority,
      progress: data.progress,
      notes: data.notes.trim(),
    };

    if (editing) {
      // Optimistic update
      const prev = exams;
      setExams((list) =>
        list.map((e) => (e.id === editing.id ? { ...e, ...payload } : e))
      );
      try {
        const res = await apiFetch<{ exam: Exam }>(
          `/api/exams/${editing.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
        setExams((list) =>
          list.map((e) => (e.id === editing.id ? res.exam : e))
        );
        toast.success("Exam updated");
      } catch (err) {
        handleError(err, "Failed to update exam");
        setExams(prev);
      }
    } else {
      try {
        const res = await apiFetch<{ exam: Exam }>("/api/exams", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setExams((list) => [...list, res.exam]);
        toast.success("Exam added — let's ace it! 🚀");
      } catch (err) {
        handleError(err, "Failed to add exam");
      }
    }
  };

  return (
    <PageTransition className="space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-500/5 dark:bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-950 ring-1 ring-violet-500/20 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Crush your next exam</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Upcoming Exams
          </h1>
          <p className="text-sm text-muted-foreground">
            Stay ahead with live countdowns and prep progress for every exam.
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600"
        >
          <Plus className="h-4 w-4" />
          Add Exam
        </Button>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={ClipboardList}
              label="Total exams"
              value={stats.total}
              gradient="bg-gradient-to-br from-violet-500 to-fuchsia-500"
            />
            <StatCard
              icon={CalendarClock}
              label="Upcoming"
              value={stats.upcoming}
              gradient="bg-gradient-to-br from-fuchsia-500 to-pink-500"
            />
            <StatCard
              icon={Flame}
              label="High priority"
              value={stats.high}
              gradient="bg-gradient-to-br from-rose-500 to-orange-500"
            />
            <StatCard
              icon={Sparkles}
              label="Avg. progress"
              value={stats.avgProgress}
              suffix="%"
              gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
            />
          </>
        )}
      </section>

      {/* Upcoming exams grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ExamCardSkeleton key={i} />
            ))}
          </div>
        ) : upcoming.length === 0 && past.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No exams yet"
            description="Add your first exam and watch the countdown begin. You've got this!"
            action={
              <Button
                onClick={handleAdd}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600"
              >
                <Plus className="h-4 w-4" />
                Add your first exam
              </Button>
            }
            className="glass rounded-3xl"
          />
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No upcoming exams"
            description="All clear for now. Add a future exam to start tracking your countdown."
            action={
              <Button
                onClick={handleAdd}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600"
              >
                <Plus className="h-4 w-4" />
                Add exam
              </Button>
            }
            className="glass rounded-3xl"
          />
        ) : (
          <StaggerContainer
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {upcoming.map((exam) => (
              <StaggerItem key={exam.id}>
                <ExamCard
                  exam={exam}
                  subjects={subjects}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>

      {/* Past exams */}
      {!loading && past.length > 0 && (
        <section>
          <Collapsible open={pastOpen} onOpenChange={setPastOpen}>
            <GlassCard className="overflow-hidden p-0">
              <CollapsibleTrigger asChild>
                <button
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-accent/40"
                  aria-expanded={pastOpen}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <History className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        Past exams
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {past.length} completed exam{past.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: pastOpen ? 180 : 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2 }}
                    className="text-muted-foreground"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 border-t border-border/60 px-5 py-4">
                  <AnimatePresence initial={false}>
                    {past.map((exam) => (
                      <PastExamRow key={exam.id} exam={exam} />
                    ))}
                  </AnimatePresence>
                </div>
              </CollapsibleContent>
            </GlassCard>
          </Collapsible>
        </section>
      )}

      {/* Dialogs */}
      <ExamDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        subjects={subjects}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500">
                <AlertTriangle className="h-4 w-4" />
              </span>
              Delete exam?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {deleting?.examName}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}

export default ExamsPage;
