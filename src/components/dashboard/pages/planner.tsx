"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Sparkles,
  GripVertical,
  Target,
  Zap,
  Coffee,
  Sunrise,
  Sun,
  Moon,
  Pencil,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";

import { apiFetch, handleError } from "@/lib/api";
import { type Subject, type Event, colorOf } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import {
  PageTransition,
  GlassCard,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion";
import { EmptyState } from "@/components/shared/feedback";
import { AnimatedCounter } from "@/components/shared/animated-counter";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StudyBlockType = "study" | "break" | "revision" | "assignment" | "exam-prep";
type TimeSlot = "morning" | "afternoon" | "evening" | "night";

interface StudyBlock {
  id: string;
  day: string; // yyyy-MM-dd
  timeSlot: TimeSlot;
  type: StudyBlockType;
  subject: string;
  title: string;
  duration: number; // minutes
  notes: string;
  completed: boolean;
  color: string;
}

const TIME_SLOTS: { key: TimeSlot; label: string; icon: typeof Sunrise; hours: string }[] = [
  { key: "morning", label: "Morning", icon: Sunrise, hours: "6:00 – 12:00" },
  { key: "afternoon", label: "Afternoon", icon: Sun, hours: "12:00 – 17:00" },
  { key: "evening", label: "Evening", icon: Coffee, hours: "17:00 – 21:00" },
  { key: "night", label: "Night", icon: Moon, hours: "21:00 – 24:00" },
];

const BLOCK_TYPES: { key: StudyBlockType; label: string; icon: string; color: string }[] = [
  { key: "study", label: "Study", icon: "📚", color: "violet" },
  { key: "revision", label: "Revision", icon: "🔄", color: "blue" },
  { key: "assignment", label: "Assignment", icon: "✍️", color: "amber" },
  { key: "exam-prep", label: "Exam Prep", icon: "🎯", color: "rose" },
  { key: "break", label: "Break", icon: "☕", color: "green" },
];

const BLOCK_TYPE_MAP: Record<StudyBlockType, { label: string; icon: string; color: string }> =
  Object.fromEntries(BLOCK_TYPES.map((b) => [b.key, b])) as never;

// Local storage key
const STORAGE_KEY = "studyspark_planner_blocks";

function loadBlocks(): StudyBlock[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBlocks(blocks: StudyBlock[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
}

// ---------------------------------------------------------------------------
// Form Dialog
// ---------------------------------------------------------------------------

interface BlockFormData {
  day: string;
  timeSlot: TimeSlot;
  type: StudyBlockType;
  subject: string;
  title: string;
  duration: number;
  notes: string;
  color: string;
}

const EMPTY_FORM: BlockFormData = {
  day: format(new Date(), "yyyy-MM-dd"),
  timeSlot: "morning",
  type: "study",
  subject: "",
  title: "",
  duration: 60,
  notes: "",
  color: "violet",
};

interface BlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: StudyBlock | null;
  defaultDay?: string;
  defaultTimeSlot?: TimeSlot;
  subjects: Subject[];
  onSubmit: (data: BlockFormData) => void;
}

function BlockDialog({
  open,
  onOpenChange,
  initial,
  defaultDay,
  defaultTimeSlot,
  subjects,
  onSubmit,
}: BlockDialogProps) {
  const [form, setForm] = useState<BlockFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (initial) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          day: initial.day,
          timeSlot: initial.timeSlot,
          type: initial.type,
          subject: initial.subject,
          title: initial.title,
          duration: initial.duration,
          notes: initial.notes,
          color: initial.color,
        });
      } else {
        setForm({
          ...EMPTY_FORM,
          day: defaultDay ?? format(new Date(), "yyyy-MM-dd"),
          timeSlot: defaultTimeSlot ?? "morning",
          color: BLOCK_TYPE_MAP[EMPTY_FORM.type].color,
        });
      }
      setErrors({});
    }
  }, [open, initial, defaultDay, defaultTimeSlot]);

  const update = <K extends keyof BlockFormData>(key: K, value: BlockFormData[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "type") {
        next.color = BLOCK_TYPE_MAP[value as StudyBlockType].color;
      }
      return next;
    });
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Title is required";
    if (!form.day) next.day = "Day is required";
    if (form.duration < 5) next.duration = "At least 5 minutes";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
    onOpenChange(false);
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
              <CalendarRange className="h-4 w-4" />
            </span>
            {initial ? "Edit Study Block" : "Add Study Block"}
          </DialogTitle>
          <DialogDescription>
            {initial
              ? "Update this study block in your weekly plan."
              : "Plan a focused study session in your weekly schedule."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Day */}
          <div className="space-y-1.5">
            <Label>Day</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.day && "text-muted-foreground"
                  )}
                >
                  <CalendarRange className="mr-2 h-4 w-4" />
                  {form.day ? format(parseISO(form.day), "EEE, MMM d") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.day ? parseISO(form.day) : undefined}
                  onSelect={(d) => update("day", d ? format(d, "yyyy-MM-dd") : "")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.day && <p className="text-xs text-rose-500">{errors.day}</p>}
          </div>

          {/* Time Slot + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Time Slot</Label>
              <Select
                value={form.timeSlot}
                onValueChange={(v) => update("timeSlot", v as TimeSlot)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot.key} value={slot.key}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Block Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => update("type", v as StudyBlockType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_TYPES.map((bt) => (
                    <SelectItem key={bt.key} value={bt.key}>
                      {bt.icon} {bt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label>Subject</Label>
            {subjects.length > 0 ? (
              <Select value={form.subject} onValueChange={(v) => update("subject", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn("h-2 w-2 rounded-full", colorOf(s.color).bg)}
                        />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="e.g. Mathematics"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
              />
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>
              Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              placeholder="e.g. Chapter 5 – Integration"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="text-xs text-rose-500">{errors.title}</p>}
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label>Duration (minutes)</Label>
            <div className="flex items-center gap-2">
              {[25, 45, 60, 90, 120].map((d) => (
                <Button
                  key={d}
                  type="button"
                  size="sm"
                  variant={form.duration === d ? "default" : "outline"}
                  className={cn(
                    "rounded-lg text-xs",
                    form.duration === d &&
                      "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  )}
                  onClick={() => update("duration", d)}
                >
                  {d}m
                </Button>
              ))}
              <Input
                type="number"
                min={5}
                max={480}
                value={form.duration}
                onChange={(e) => update("duration", Math.max(5, parseInt(e.target.value) || 5))}
                className="w-20"
              />
            </div>
            {errors.duration && <p className="text-xs text-rose-500">{errors.duration}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              placeholder="Topics, resources, goals…"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600"
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              {initial ? "Save changes" : "Add block"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Study Block Card
// ---------------------------------------------------------------------------

function StudyBlockCard({
  block,
  onToggle,
  onEdit,
  onDelete,
}: {
  block: StudyBlock;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const bt = BLOCK_TYPE_MAP[block.type];
  const c = colorOf(block.color);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -1 }}
      className={cn(
        "group relative rounded-xl border p-3 transition-all cursor-pointer",
        block.completed
          ? "border-emerald-500/20 bg-emerald-500/5 opacity-75"
          : cn("border-border/60 bg-card/80 hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/5")
      )}
      onClick={onToggle}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
            block.completed
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-muted-foreground/30"
          )}
        >
          {block.completed && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path d="M5 13l4 4L19 7" />
            </motion.svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{bt.icon}</span>
            <span
              className={cn(
                "text-sm font-semibold truncate",
                block.completed && "line-through text-muted-foreground"
              )}
            >
              {block.title}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {block.duration}m
            </span>
            {block.subject && (
              <span className={cn("font-medium", c.text)}>{block.subject}</span>
            )}
          </div>
          {block.notes && (
            <p className="mt-1 text-[11px] text-muted-foreground/70 line-clamp-1">
              {block.notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function PlannerPage() {
  const [blocks, setBlocks] = useState<StudyBlock[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<StudyBlock | null>(null);
  const [defaultDay, setDefaultDay] = useState<string>("");
  const [defaultTimeSlot, setDefaultTimeSlot] = useState<TimeSlot>("morning");
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    (async () => {
      try {
        const subRes = await apiFetch<{ subjects: Subject[] }>("/api/subjects");
        if (subRes && subRes.subjects) {
          setSubjects(subRes.subjects);
        }
      } catch {
        // ignore
      }
      setBlocks(loadBlocks());
      setLoading(false);
    })();
  }, []);

  // Save to localStorage whenever blocks change
  useEffect(() => {
    if (!loading) saveBlocks(blocks);
  }, [blocks, loading]);

  // Current week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    if (weekDays.length < 2) return "";
    const from = format(weekDays[0], "MMM d");
    const to = format(weekDays[6], "MMM d, yyyy");
    return `${from} – ${to}`;
  }, [weekDays]);

  // Stats
  const weekBlocks = useMemo(
    () =>
      blocks.filter((b) =>
        weekDays.some((d) => isSameDay(d, parseISO(b.day)))
      ),
    [blocks, weekDays]
  );

  const totalMinutes = weekBlocks.reduce((s, b) => s + b.duration, 0);
  const completedMinutes = weekBlocks
    .filter((b) => b.completed)
    .reduce((s, b) => s + b.duration, 0);
  const completionPct = totalMinutes > 0 ? Math.round((completedMinutes / totalMinutes) * 100) : 0;

  // Handlers
  const handleAddBlock = useCallback(
    (data: BlockFormData) => {
      const newBlock: StudyBlock = {
        id: editingBlock?.id ?? `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        day: data.day,
        timeSlot: data.timeSlot,
        type: data.type,
        subject: data.subject,
        title: data.title,
        duration: data.duration,
        notes: data.notes,
        completed: editingBlock?.completed ?? false,
        color: data.color,
      };
      if (editingBlock) {
        setBlocks((prev) => prev.map((b) => (b.id === editingBlock.id ? newBlock : b)));
        toast.success("Study block updated");
      } else {
        setBlocks((prev) => [...prev, newBlock]);
        toast.success("Study block added");
      }
      setEditingBlock(null);
    },
    [editingBlock]
  );

  const handleToggle = useCallback((id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b))
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    toast.success("Study block removed");
  }, []);

  const openAddDialog = (day: string, timeSlot: TimeSlot) => {
    setEditingBlock(null);
    setDefaultDay(day);
    setDefaultTimeSlot(timeSlot);
    setDialogOpen(true);
  };

  const openEditDialog = (block: StudyBlock) => {
    setEditingBlock(block);
    setDialogOpen(true);
  };

  const clearWeek = () => {
    const dayStrings = weekDays.map((d) => format(d, "yyyy-MM-dd"));
    setBlocks((prev) => prev.filter((b) => !dayStrings.includes(b.day)));
    toast.success("Week cleared");
  };

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-500/5 dark:bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-950 ring-1 ring-violet-500/20 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Plan your success, week by week</span>
          </div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25">
              <CalendarRange className="h-5 w-5" />
            </span>
            Study Planner
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan your weekly study sessions and stay on track
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={clearWeek}
          >
            Clear Week
          </Button>
          <Button
            size="sm"
            className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
            onClick={() => openAddDialog(format(new Date(), "yyyy-MM-dd"), "morning")}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Block
          </Button>
        </div>
      </div>

      {/* Week nav */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => setWeekOffset((w) => w - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{weekLabel}</span>
          {weekOffset !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-lg text-xs"
              onClick={() => setWeekOffset(0)}
            >
              Today
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => setWeekOffset((w) => w + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Planned",
            value: totalMinutes,
            suffix: "min",
            icon: Target,
            gradient: "from-violet-500/10 to-fuchsia-500/10",
            ring: "ring-violet-500/15",
          },
          {
            label: "Completed",
            value: completedMinutes,
            suffix: "min",
            icon: Zap,
            gradient: "from-emerald-500/10 to-green-500/10",
            ring: "ring-emerald-500/15",
          },
          {
            label: "Progress",
            value: completionPct,
            suffix: "%",
            icon: Sparkles,
            gradient: "from-amber-500/10 to-orange-500/10",
            ring: "ring-amber-500/15",
          },
          {
            label: "Blocks",
            value: weekBlocks.length,
            suffix: "",
            icon: BookOpen,
            gradient: "from-cyan-500/10 to-blue-500/10",
            ring: "ring-cyan-500/15",
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-xl bg-gradient-to-br p-3 ring-1",
              stat.gradient,
              stat.ring
            )}
          >
            <div className="flex items-center gap-2">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-[11px] font-medium text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <p className="mt-1 text-xl font-bold tabular-nums">
              <AnimatedCounter value={stat.value} decimals={stat.suffix === "%" ? 0 : 0} />
              <span className="ml-0.5 text-sm font-medium text-muted-foreground">
                {stat.suffix}
              </span>
            </p>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      {totalMinutes > 0 && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 rounded-full progress-shimmer"
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ backgroundSize: "200% 100%" }}
            />
          </div>
        </div>
      )}

      {/* Weekly grid */}
      <div className="mt-6 space-y-3">
        {weekDays.map((day) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const dayBlocks = blocks.filter((b) => b.day === dayStr);
          const isToday = isSameDay(day, new Date());

          return (
            <motion.div
              key={dayStr}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-xl border p-4 transition-colors card-shimmer-border hover-lift",
                isToday
                  ? "border-violet-500/30 bg-violet-500/5 planner-slot-glow"
                  : "border-border/60 bg-card/50"
              )}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold",
                      isToday
                        ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div>
                    <p className={cn("text-sm font-semibold", isToday && "text-violet-600 dark:text-violet-400")}>
                      {format(day, "EEEE")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(day, "MMMM yyyy")}
                    </p>
                  </div>
                  {isToday && (
                    <Badge className="rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400 text-[10px] font-semibold border-0">
                      Today
                    </Badge>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-lg"
                  onClick={() => openAddDialog(dayStr, "morning")}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Time slots grid */}
              {dayBlocks.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {TIME_SLOTS.map((slot) => {
                    const slotBlocks = dayBlocks.filter((b) => b.timeSlot === slot.key);
                    return (
                      <div key={slot.key} className="min-h-[40px]">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <slot.icon className="h-3 w-3 text-muted-foreground/60" />
                          <span className="text-[10px] font-medium text-muted-foreground/60">
                            {slot.label}
                          </span>
                        </div>
                        <AnimatePresence>
                          {slotBlocks.map((b) => (
                            <StudyBlockCard
                              key={b.id}
                              block={b}
                              onToggle={() => handleToggle(b.id)}
                              onEdit={() => openEditDialog(b)}
                              onDelete={() => handleDelete(b.id)}
                            />
                          ))}
                        </AnimatePresence>
                        {slotBlocks.length === 0 && (
                          <button
                            onClick={() => openAddDialog(dayStr, slot.key)}
                            className="w-full rounded-lg border border-dashed border-border/40 py-1.5 text-[10px] text-muted-foreground/50 hover:border-violet-500/30 hover:text-violet-500/60 transition-colors"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <button
                  onClick={() => openAddDialog(dayStr, "morning")}
                  className="w-full rounded-lg border border-dashed border-border/40 py-3 text-xs text-muted-foreground/50 hover:border-violet-500/30 hover:text-violet-500/60 transition-colors"
                >
                  <Plus className="mr-1 inline h-3.5 w-3.5" />
                  Plan your study for {format(day, "EEEE")}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {!loading && weekBlocks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <EmptyState
            icon={CalendarRange}
            title="No study blocks planned"
            description="Start planning your week by adding study blocks for each day."
            action={
              <Button
                onClick={() => openAddDialog(format(new Date(), "yyyy-MM-dd"), "morning")}
                className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Plan your first study block
              </Button>
            }
          />
        </motion.div>
      )}

      {/* Dialog */}
      <BlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editingBlock}
        defaultDay={defaultDay}
        defaultTimeSlot={defaultTimeSlot}
        subjects={subjects}
        onSubmit={handleAddBlock}
      />
    </PageTransition>
  );
}
