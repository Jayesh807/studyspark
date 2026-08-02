"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  User,
  Sparkles,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  StickyNote,
} from "lucide-react";

import { apiFetch, handleError } from "@/lib/api";
import { readPageCache, writePageCache } from "@/lib/page-cache";
import {
  Subject,
  EventColor,
  COLOR_MAP,
  colorOf,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

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
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion";
import { Skeleton, EmptyState } from "@/components/shared/feedback";
import { SubjectDetailDrawer } from "@/components/dashboard/subject-detail-drawer";
import { AnimatedCounter } from "@/components/shared/animated-counter";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FORM_FIELD_CLASS =
  "rounded-lg border-border/75 bg-background/90 shadow-sm transition-colors hover:bg-card focus-visible:border-violet-400/70 focus-visible:ring-violet-500/20 dark:border-border/55 dark:bg-background/60 dark:hover:bg-background/75";
const FORM_LABEL_CLASS = "text-sm font-semibold text-foreground/90";
const FORM_DIALOG_CLASS =
  "dashboard-surface max-h-[90vh] overflow-y-auto rounded-lg p-0 shadow-2xl shadow-slate-950/15 backdrop-blur-2xl sm:max-w-lg";
const FORM_SECTION_CLASS = "dashboard-row space-y-2 p-3 sm:p-4";

const COLOR_SWATCHES: EventColor[] = [
  "violet",
  "blue",
  "green",
  "amber",
  "rose",
  "cyan",
];

function isOptimisticSubject(subject: Subject) {
  return subject.id.startsWith("temp-");
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

function StatCard({
  icon: Icon,
  label,
  value,
  decimals = 0,
  suffix,
  gradient,
}: StatCardProps) {
  return (
    <div className="dashboard-surface relative overflow-hidden p-3 sm:p-4">
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">
            <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
          </p>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ring-1 ring-white/20 dark:ring-white/10",
            gradient
          )}
        >
          <Icon className="h-4.5 w-4.5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Circular progress ring (attendance)
// ---------------------------------------------------------------------------

function attendanceColor(pct: number): {
  stroke: string;
  text: string;
  soft: string;
} {
  if (pct >= 75)
    return {
      stroke: "#10b981",
      text: "text-emerald-600 dark:text-emerald-400",
      soft: "bg-emerald-500/15",
    };
  if (pct >= 60)
    return {
      stroke: "#f59e0b",
      text: "text-amber-600 dark:text-amber-400",
      soft: "bg-amber-500/15",
    };
  return {
    stroke: "#f43f5e",
    text: "text-rose-600 dark:text-rose-400",
    soft: "bg-rose-500/15",
  };
}

interface RingProps {
  value: number;
  size?: number;
  stroke?: number;
}

function AttendanceRing({ value, size = 64, stroke = 6 }: RingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const colors = attendanceColor(value);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Attendance ${value}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/60"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-sm font-bold tabular-nums", colors.text)}>
          {value}%
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subject card
// ---------------------------------------------------------------------------

interface SubjectCardProps {
  subject: Subject;
  onEdit: (s: Subject) => void;
  onDelete: (s: Subject) => void;
  onOpenDetail: (s: Subject) => void;
}

function SubjectCard({ subject, onEdit, onDelete, onOpenDetail }: SubjectCardProps) {
  const color = colorOf(subject.color);
  const saving = isOptimisticSubject(subject);

  return (
    <div className="dashboard-surface group relative overflow-hidden p-4 transition-colors hover:border-violet-500/30 hover:bg-violet-500/[0.03] sm:p-5">
      {/* Make the main area clickable to open the detail drawer */}
      <button
        type="button"
        onClick={() => {
          if (!saving) onOpenDetail(subject);
        }}
        aria-label={`View details for ${subject.name}`}
        className={cn(
          "absolute inset-0 z-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
          saving ? "cursor-default" : "cursor-pointer"
        )}
      />
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1.5",
          color.bg
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-offset-0",
              color.bg,
              color.ring
            )}
          />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold leading-tight tracking-tight sm:text-xl">
              {subject.name}
            </h3>
            {subject.teacher && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                {subject.teacher}
              </p>
            )}
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            disabled={saving}
            className="h-8 w-8 -mt-1.5 shrink-0 rounded-lg opacity-70 transition-opacity hover:bg-muted/60 hover:opacity-100"
            aria-label="Open subject details"
            onClick={() => onOpenDetail(subject)}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          {!saving && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mr-1.5 -mt-1.5 shrink-0 rounded-lg opacity-70 transition-opacity hover:bg-muted/60 hover:opacity-100"
                aria-label="Subject actions"
                onClick={(e) => e.stopPropagation()}
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
            <DropdownMenuContent align="end" className="dashboard-menu-surface w-40 p-1">
              <DropdownMenuItem onSelect={() => onEdit(subject)} className="cursor-pointer rounded-lg">
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(subject)}
                className="cursor-pointer rounded-lg text-rose-600 focus:bg-rose-500/10 focus:text-rose-600 dark:text-rose-300 dark:focus:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="relative mt-3 flex flex-wrap items-center gap-2">
        {saving && (
          <Badge
            className="border-transparent bg-violet-500/10 text-violet-600 dark:text-violet-400"
            variant="default"
          >
            Saving
          </Badge>
        )}
        <Badge
          className={cn("border-transparent text-white", color.bg)}
          variant="default"
        >
          <GraduationCap className="h-3 w-3" />
          {subject.credits} credit{subject.credits === 1 ? "" : "s"}
        </Badge>
        <Badge
          className="border-border/60 bg-card/60 text-foreground"
          variant="outline"
        >
          <TrendingUp className="h-3 w-3" />
          {subject.progress}% prep
        </Badge>
      </div>

      {/* Attendance + Progress row */}
      <div className="dashboard-row relative mt-3 flex items-center gap-4 p-3">
        <AttendanceRing value={subject.attendance} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Attendance
            </span>
            {subject.attendance >= 75 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Good
              </span>
            ) : subject.attendance >= 60 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" /> At risk
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-3 w-3" /> Low
              </span>
            )}
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Course progress
              </span>
              <span className="text-xs font-semibold tabular-nums">
                {subject.progress}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color.chart }}
                initial={{ width: 0 }}
                animate={{ width: `${subject.progress}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notes preview */}
      {subject.notes && (
        <div className="dashboard-row relative mt-3 flex items-start gap-2 px-3 py-2">
          <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {subject.notes}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subject card skeleton
// ---------------------------------------------------------------------------

function SubjectCardSkeleton() {
  return (
    <div className="dashboard-surface relative overflow-hidden p-5 sm:p-6">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-muted" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-2.5 w-2.5 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="mt-3 h-3 w-24" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="dashboard-row mt-4 flex items-center gap-4 p-3">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form dialog
// ---------------------------------------------------------------------------

interface SubjectFormData {
  name: string;
  teacher: string;
  credits: number;
  attendance: number;
  color: EventColor;
  progress: number;
  notes: string;
}

const EMPTY_FORM: SubjectFormData = {
  name: "",
  teacher: "",
  credits: 3,
  attendance: 80,
  color: "violet",
  progress: 0,
  notes: "",
};

interface SubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Subject | null;
  onSubmit: (data: SubjectFormData) => Promise<void>;
}

function SubjectDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: SubjectDialogProps) {
  const [form, setForm] = useState<SubjectFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof SubjectFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          name: initial.name ?? "",
          teacher: initial.teacher ?? "",
          credits: initial.credits ?? 3,
          attendance: initial.attendance ?? 80,
          color: (initial.color as EventColor) ?? "violet",
          progress: initial.progress ?? 0,
          notes: initial.notes ?? "",
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [open, initial]);

  const update = <K extends keyof SubjectFormData>(
    key: K,
    value: SubjectFormData[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof SubjectFormData, string>> = {};
    if (!form.name.trim()) next.name = "Subject name is required";
    if (form.credits < 1 || form.credits > 10)
      next.credits = "Credits must be between 1 and 10";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      onOpenChange(false);
      await onSubmit(form);
    } catch (err) {
      handleError(err, "Failed to save subject");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={FORM_DIALOG_CLASS}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="border-b border-border/60 p-4 sm:p-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-3 text-xl tracking-tight">
              <span className="dashboard-icon-tile dashboard-theme-glow-text">
                <BookOpen className="h-4 w-4" />
              </span>
              {initial ? "Edit Subject" : "Add New Subject"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {initial
                ? "Update the details for this subject."
                : "Organize your courses with attendance, progress, and notes."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4 sm:p-5">
          {/* Name */}
          <div className={FORM_SECTION_CLASS}>
            <Label htmlFor="subject-name" className={FORM_LABEL_CLASS}>
              Subject Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="subject-name"
              placeholder="e.g. Linear Algebra"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              aria-invalid={!!errors.name}
              className={FORM_FIELD_CLASS}
            />
            {errors.name && (
              <p className="text-xs text-rose-500">{errors.name}</p>
            )}
          </div>

          {/* Teacher + Credits */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className={FORM_SECTION_CLASS}>
              <Label htmlFor="subject-teacher" className={FORM_LABEL_CLASS}>Teacher</Label>
              <Input
                id="subject-teacher"
                placeholder="e.g. Dr. Smith"
                value={form.teacher}
                onChange={(e) => update("teacher", e.target.value)}
                className={FORM_FIELD_CLASS}
              />
            </div>
            <div className={FORM_SECTION_CLASS}>
              <Label htmlFor="subject-credits" className={FORM_LABEL_CLASS}>Credits (1-10)</Label>
              <Input
                id="subject-credits"
                type="number"
                min={1}
                max={10}
                value={form.credits}
                onChange={(e) =>
                  update("credits", Number(e.target.value) || 0)
                }
                aria-invalid={!!errors.credits}
                className={FORM_FIELD_CLASS}
              />
              {errors.credits && (
                <p className="text-xs text-rose-500">{errors.credits}</p>
              )}
            </div>
          </div>

          {/* Color picker */}
          <div className={FORM_SECTION_CLASS}>
            <Label className={FORM_LABEL_CLASS}>Color</Label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_SWATCHES.map((c) => {
                const isActive = form.color === c;
                const cm = COLOR_MAP[c];
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update("color", c)}
                    aria-label={`Color ${c}`}
                    aria-pressed={isActive}
                    className={cn(
                      "relative h-9 w-9 rounded-lg ring-2 ring-offset-2 ring-offset-background shadow-sm transition-transform",
                      cm.bg,
                      isActive
                        ? "scale-110 ring-foreground/40"
                        : "ring-transparent hover:scale-105"
                    )}
                  >
                    {isActive && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attendance */}
          <div className={FORM_SECTION_CLASS}>
            <div className="flex items-center justify-between">
              <Label className={FORM_LABEL_CLASS}>Attendance</Label>
              <span className="text-sm font-semibold tabular-nums">
                {form.attendance}%
              </span>
            </div>
            <Slider
              value={[form.attendance]}
              onValueChange={(v) => update("attendance", v[0] ?? 0)}
              min={0}
              max={100}
              step={1}
            />
          </div>

          {/* Progress */}
          <div className={FORM_SECTION_CLASS}>
            <div className="flex items-center justify-between">
              <Label className={FORM_LABEL_CLASS}>Course progress</Label>
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
          <div className={FORM_SECTION_CLASS}>
            <Label htmlFor="subject-notes" className={FORM_LABEL_CLASS}>Notes</Label>
            <Textarea
              id="subject-notes"
              placeholder="Syllabus, key topics, anything important..."
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className={cn(FORM_FIELD_CLASS, "resize-none")}
            />
          </div>

          <DialogFooter className="gap-2 border-t border-border/60 bg-background/55 p-4 sm:p-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="h-10 rounded-lg border-border/70 bg-background/85 px-4 shadow-sm hover:bg-muted/60 dark:border-border/60 dark:bg-background/60"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-10 rounded-lg accent-gradient px-4 text-white shadow-md shadow-violet-500/20"
            >
              {submitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {initial ? "Save changes" : "Add subject"}
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
// Main page
// ---------------------------------------------------------------------------

export function SubjectsPage() {
  const userId = useAppStore((s) => s.user?.id);
  const initialCache = useMemo(
    () => readPageCache<{ subjects: Subject[] }>("subjects", userId),
    [userId]
  );
  const [subjects, setSubjects] = useState<Subject[]>(
    () => initialCache?.subjects ?? []
  );
  const [loading, setLoading] = useState(() => !initialCache);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState<Subject | null>(null);
  const [detailSubject, setDetailSubject] = useState<Subject | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadSubjects = useCallback(async () => {
    const cached = readPageCache<{ subjects: Subject[] }>("subjects", userId);
    if (cached) {
      setSubjects(cached.subjects);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const res = await apiFetch<{ subjects: Subject[] }>("/api/subjects");
      setSubjects(res.subjects ?? []);
      writePageCache("subjects", userId, { subjects: res.subjects ?? [] });
    } catch (err) {
      handleError(err, "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    if (!loading) {
      writePageCache("subjects", userId, { subjects });
    }
  }, [loading, subjects, userId]);

  const commitSubjects = useCallback(
    (updater: (current: Subject[]) => Subject[]) => {
      setSubjects((current) => {
        const next = updater(current);
        writePageCache("subjects", userId, { subjects: next });
        return next;
      });
    },
    [userId]
  );

  const stats = useMemo(() => {
    const total = subjects.length;
    const credits = subjects.reduce((sum, s) => sum + (s.credits ?? 0), 0);
    const avgAttendance =
      total === 0
        ? 0
        : Math.round(
            subjects.reduce((sum, s) => sum + (s.attendance ?? 0), 0) / total
          );
    const avgProgress =
      total === 0
        ? 0
        : Math.round(
            subjects.reduce((sum, s) => sum + (s.progress ?? 0), 0) / total
          );
    return { total, credits, avgAttendance, avgProgress };
  }, [subjects]);

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (s: Subject) => {
    setEditing(s);
    setDialogOpen(true);
  };

  const handleDelete = (s: Subject) => setDeleting(s);

  const handleOpenDetail = (s: Subject) => {
    setDetailSubject(s);
    setDetailOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const target = deleting;
    const previousSubjects = subjects;
    setDeleting(null);
    commitSubjects((prev) => prev.filter((s) => s.id !== target.id));
    try {
      await apiFetch(`/api/subjects/${target.id}`, { method: "DELETE" });
      toast.success("Subject deleted");
    } catch (err) {
      handleError(err, "Failed to delete subject");
      setSubjects(previousSubjects);
      writePageCache("subjects", userId, { subjects: previousSubjects });
    }
  };

  const handleSubmit = async (data: SubjectFormData) => {
    const payload = {
      name: data.name.trim(),
      teacher: data.teacher.trim(),
      credits: data.credits,
      attendance: data.attendance,
      color: data.color,
      progress: data.progress,
      notes: data.notes.trim(),
    };

    if (editing) {
      const previousSubjects = subjects;
      const editingId = editing.id;
      commitSubjects((list) =>
        list.map((s) => (s.id === editingId ? { ...s, ...payload } : s))
      );
      setEditing(null);
      void (async () => {
        try {
          const res = await apiFetch<{ subject: Subject }>(
            `/api/subjects/${editingId}`,
            {
              method: "PUT",
              body: JSON.stringify(payload),
            }
          );
          commitSubjects((list) =>
            list.map((s) => (s.id === editingId ? res.subject : s))
          );
          toast.success("Subject updated");
        } catch (err) {
          handleError(err, "Failed to update subject");
          setSubjects(previousSubjects);
          writePageCache("subjects", userId, { subjects: previousSubjects });
        }
      })();
    } else {
      const previousSubjects = subjects;
      const now = new Date().toISOString();
      const optimisticSubject: Subject = {
        id: `temp-${Date.now()}`,
        userId: userId ?? "",
        ...payload,
        createdAt: now,
        updatedAt: now,
      };

      commitSubjects((list) => [...list, optimisticSubject]);
      setEditing(null);
      void (async () => {
        try {
          const res = await apiFetch<{ subject: Subject }>("/api/subjects", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          commitSubjects((list) =>
            list.map((s) =>
              s.id === optimisticSubject.id ? res.subject : s
            )
          );
          toast.success("Subject added");
        } catch (err) {
          handleError(err, "Failed to add subject");
          setSubjects(previousSubjects);
          writePageCache("subjects", userId, { subjects: previousSubjects });
        }
      })();
      return;
    }
  };

  return (
    <PageTransition className="space-y-4">
      {/* Subtitle & Actions Bar */}
      <header className="dashboard-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="space-y-1">
          <div className="dashboard-chip dashboard-theme-glow-chip dashboard-theme-glow-text">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Your knowledge universe</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Keep every course organized — attendance, progress, and notes in one place.
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="h-10 rounded-lg accent-gradient text-white shadow-md shadow-violet-500/20"
        >
          <Plus className="h-4 w-4" />
          Add Subject
        </Button>
      </header>

      {/* Overview stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))
        ) : (
          <>
            <StatCard
              icon={BookOpen}
              label="Total subjects"
              value={stats.total}
              gradient="bg-gradient-to-br from-violet-500 to-fuchsia-500"
            />
            <StatCard
              icon={GraduationCap}
              label="Total credits"
              value={stats.credits}
              gradient="bg-gradient-to-br from-fuchsia-500 to-pink-500"
            />
            <StatCard
              icon={CheckCircle2}
              label="Avg. attendance"
              value={stats.avgAttendance}
              suffix="%"
              gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
            />
            <StatCard
              icon={TrendingUp}
              label="Avg. progress"
              value={stats.avgProgress}
              suffix="%"
              gradient="bg-gradient-to-br from-amber-500 to-orange-500"
            />
          </>
        )}
      </section>

      {/* Subjects grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SubjectCardSkeleton key={i} />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No subjects yet"
            description="Add your first subject to start tracking attendance, progress, and notes."
            action={
              <Button
                onClick={handleAdd}
                className="rounded-lg accent-gradient text-white shadow-md shadow-violet-500/20"
              >
                <Plus className="h-4 w-4" />
                Add your first subject
              </Button>
            }
            className="dashboard-surface"
          />
        ) : (
          <StaggerContainer className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {subjects.map((subject) => (
                <StaggerItem key={subject.id}>
                  <SubjectCard
                    subject={subject}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onOpenDetail={handleOpenDetail}
                  />
                </StaggerItem>
              ))}
            </AnimatePresence>
          </StaggerContainer>
        )}
      </section>

      {/* Dialogs */}
      <SubjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent className="dashboard-surface rounded-lg border-border/70 p-5 shadow-2xl shadow-slate-950/20 dark:border-border/45 sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/15 text-rose-500">
                <AlertTriangle className="h-4 w-4" />
              </span>
              Delete subject?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {deleting?.name}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-lg border-border/70 bg-background/85 shadow-sm hover:bg-muted/60 dark:border-border/60 dark:bg-background/60">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-lg bg-rose-500 text-white shadow-md shadow-rose-500/20 hover:bg-rose-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Subject detail drawer */}
      <SubjectDetailDrawer
        subject={detailSubject}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </PageTransition>
  );
}

export default SubjectsPage;
