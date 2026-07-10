"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  DragOverlay,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  format,
  parseISO,
  isBefore,
  startOfToday,
  isToday,
  isValid,
  differenceInDays,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  CircleDashed,
  Flag,
  Inbox,
  ListTodo,
  Sparkles,
  AlertTriangle,
  X,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  PageTransition,
  GlassCard,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion";
import { Skeleton, EmptyState } from "@/components/shared/feedback";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { apiFetch, handleError } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  Todo,
  Priority,
  TodoStatus,
  TodoCategory,
  Subject,
  PRIORITY_CONFIG,
  CATEGORY_CONFIG,
  colorOf,
} from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------- Column config ----------
type ColumnDef = {
  id: TodoStatus;
  label: string;
  icon: React.ElementType;
  dot: string;
  soft: string;
  text: string;
  ring: string;
};

const COLUMN_CONFIG: ColumnDef[] = [
  {
    id: "todo",
    label: "To Do",
    icon: CircleDashed,
    dot: "bg-slate-400",
    soft: "bg-slate-100 dark:bg-slate-500/15",
    text: "text-slate-600 dark:text-slate-300",
    ring: "ring-slate-400/30",
  },
  {
    id: "in-progress",
    label: "In Progress",
    icon: ClipboardList,
    dot: "bg-amber-500",
    soft: "bg-amber-100 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/30",
  },
  {
    id: "completed",
    label: "Completed",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
    soft: "bg-emerald-100 dark:bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
  },
];

// ---------- Helpers ----------
function isOverdue(dueDate: string | null, status: TodoStatus): boolean {
  if (!dueDate || status === "completed") return false;
  try {
    const d = parseISO(dueDate);
    if (!isValid(d)) return false;
    if (isToday(d)) return false;
    return isBefore(d, startOfToday());
  } catch {
    return false;
  }
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "";
  try {
    const d = parseISO(dueDate);
    if (!isValid(d)) return "";
    const days = differenceInDays(d, new Date());
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days === -1) return "Yesterday";
    if (days > 0 && days <= 7) return `In ${days} days`;
    return format(d, "MMM d");
  } catch {
    return "";
  }
}

function toDateInput(dueDate: string | null): string {
  if (!dueDate) return "";
  try {
    const d = parseISO(dueDate);
    if (!isValid(d)) return "";
    return format(d, "yyyy-MM-dd");
  } catch {
    return "";
  }
}

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// ---------- Main page ----------
export function TodosPage() {
  const userId = useAppStore((s) => s.user?.id);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Toolbar state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TodoStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [sortBy, setSortBy] = useState<"due" | "priority" | "created">("due");

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [deleting, setDeleting] = useState<Todo | null>(null);

  // DnD
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [todosRes, subjectsRes] = await Promise.all([
        apiFetch<{ todos: Todo[] }>("/api/todos"),
        apiFetch<{ subjects: Subject[] }>("/api/subjects"),
      ]);
      setTodos(todosRes.todos);
      setSubjects(subjectsRes.subjects);
    } catch (err) {
      handleError(err, "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------- Derived: filtered & sorted todos per column ----------
  const filteredSortedTodos = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = todos.filter((t) => {
      if (q) {
        const inTitle = t.title.toLowerCase().includes(q);
        const inDesc = t.description?.toLowerCase().includes(q);
        if (!inTitle && !inDesc) return false;
      }
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      // Always order by order field first
      if (a.order !== b.order) return a.order - b.order;
      // Then by sort preference
      if (sortBy === "priority") {
        const pa = PRIORITY_ORDER[a.priority];
        const pb = PRIORITY_ORDER[b.priority];
        if (pa !== pb) return pa - pb;
      } else if (sortBy === "created") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      // due date sort (default)
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return ad - bd;
    });

    return sorted;
  }, [todos, search, priorityFilter, sortBy]);

  const columns = useMemo(() => {
    const map: Record<TodoStatus, Todo[]> = {
      todo: [],
      "in-progress": [],
      completed: [],
    };
    for (const t of filteredSortedTodos) {
      map[t.status].push(t);
    }
    return map;
  }, [filteredSortedTodos]);

  const visibleColumns = useMemo(
    () =>
      statusFilter === "all"
        ? COLUMN_CONFIG
        : COLUMN_CONFIG.filter((c) => c.id === statusFilter),
    [statusFilter]
  );

  // ---------- Stats ----------
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.status === "completed").length;
    const inProgress = todos.filter((t) => t.status === "in-progress").length;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, inProgress, pct };
  }, [todos]);

  // ---------- Mutations ----------
  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (todo: Todo) => {
    setEditing(todo);
    setFormOpen(true);
  };

  const handleSave = async (data: TodoFormData) => {
    try {
      if (editing) {
        // PUT
        const updated = await apiFetch<{ todo: Todo }>(
          `/api/todos/${editing.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              title: data.title,
              description: data.description,
              priority: data.priority,
              category: data.category,
              status: data.status,
              subject: data.subject,
              dueDate: data.dueDate ? data.dueDate : null,
            }),
          }
        );
        setTodos((prev) =>
          prev.map((t) => (t.id === updated.todo.id ? updated.todo : t))
        );
        toast.success("Task updated");
      } else {
        // POST
        const created = await apiFetch<{ todo: Todo }>("/api/todos", {
          method: "POST",
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            priority: data.priority,
            category: data.category,
            status: data.status,
            subject: data.subject,
            dueDate: data.dueDate ? data.dueDate : null,
            order: 0,
          }),
        });
        setTodos((prev) => [created.todo, ...prev]);
        toast.success("Task created");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      handleError(err, "Failed to save task");
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    const newStatus: TodoStatus =
      todo.status === "completed" ? "todo" : "completed";
    // Optimistic
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todo.id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
      )
    );
    try {
      await apiFetch<{ todo: Todo }>(`/api/todos/${todo.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      if (newStatus === "completed") {
        toast.success("Nice work! Task completed 🎉");
      }
    } catch (err) {
      // Revert
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, status: todo.status } : t))
      );
      handleError(err, "Failed to update task");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const id = deleting.id;
    const snapshot = deleting;
    setDeleting(null);
    // Optimistic remove
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await apiFetch<{ success: boolean }>(`/api/todos/${id}`, {
        method: "DELETE",
      });
      toast.success("Task deleted");
    } catch (err) {
      // Revert
      setTodos((prev) => [snapshot, ...prev]);
      handleError(err, "Failed to delete task");
    }
  };

  // ---------- DnD ----------
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    const activeTodo = todos.find((t) => t.id === activeIdStr);
    if (!activeTodo) return;

    // Determine target column
    let targetColumn: TodoStatus;
    let targetIndex: number;

    if (COLUMN_CONFIG.some((c) => c.id === overIdStr)) {
      // Dropped onto a column (empty area)
      targetColumn = overIdStr as TodoStatus;
      const colItems = columns[targetColumn];
      targetIndex = colItems.length;
    } else {
      // Dropped onto a card
      const overTodo = todos.find((t) => t.id === overIdStr);
      if (!overTodo) return;
      targetColumn = overTodo.status;
      const colItems = columns[targetColumn];
      const overIdx = colItems.findIndex((t) => t.id === overIdStr);
      targetIndex = overIdx === -1 ? colItems.length : overIdx;
    }

    if (activeTodo.status === targetColumn) {
      // Reorder within same column
      const colItems = columns[targetColumn];
      const oldIdx = colItems.findIndex((t) => t.id === activeIdStr);
      if (oldIdx === -1 || oldIdx === targetIndex) return;
      const reordered = arrayMove(colItems, oldIdx, targetIndex);
      // Update local state with new order values
      const reorderedWithOrder = reordered.map((t, idx) => ({
        ...t,
        order: idx,
      }));
      setTodos((prev) => {
        const others = prev.filter(
          (t) => t.status !== targetColumn || !reorderedWithOrder.some((r) => r.id === t.id)
        );
        return [...others, ...reorderedWithOrder];
      });
      // Persist all cards whose order changed
      const changed = reorderedWithOrder.filter((t, idx) => {
        const orig = colItems[idx];
        return !orig || orig.id !== t.id || orig.order !== t.order;
      });
      if (changed.length > 0) {
        try {
          await Promise.all(
            changed.map((t) =>
              apiFetch<{ todo: Todo }>(`/api/todos/${t.id}`, {
                method: "PUT",
                body: JSON.stringify({ order: t.order }),
              })
            )
          );
        } catch (err) {
          handleError(err, "Failed to save order");
        }
      }
    } else {
      // Cross-column move
      const newOrder = targetIndex;
      // Build new todo
      const updatedTodo: Todo = {
        ...activeTodo,
        status: targetColumn,
        order: newOrder,
        updatedAt: new Date().toISOString(),
      };
      // Optimistic update
      setTodos((prev) =>
        prev.map((t) => (t.id === activeIdStr ? updatedTodo : t))
      );
      try {
        await apiFetch<{ todo: Todo }>(`/api/todos/${activeIdStr}`, {
          method: "PUT",
          body: JSON.stringify({
            status: targetColumn,
            order: newOrder,
          }),
        });
        toast.success(
          `Moved to ${
            COLUMN_CONFIG.find((c) => c.id === targetColumn)?.label
          }`
        );
      } catch (err) {
        // Revert
        setTodos((prev) =>
          prev.map((t) =>
            t.id === activeIdStr ? { ...t, status: activeTodo.status, order: activeTodo.order } : t
          )
        );
        handleError(err, "Failed to move task");
      }
    }
  };

  const activeTodo = activeId
    ? todos.find((t) => t.id === activeId) ?? null
    : null;

  // ---------- Render ----------
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-2 text-xs font-medium text-violet-600 dark:text-violet-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Task Board</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Daily Tasks
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
              Plan, organize, and conquer your day — one task at a time.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="accent-gradient text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all rounded-xl h-11 px-5"
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>

        {/* Stats row */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StaggerItem>
            <StatCard
              icon={ListTodo}
              label="Total Tasks"
              value={stats.total}
              iconBg="bg-violet-500/15 text-violet-600 dark:text-violet-400"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              icon={CheckCircle2}
              label="Completed"
              value={stats.completed}
              iconBg="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              icon={ClipboardList}
              label="In Progress"
              value={stats.inProgress}
              iconBg="bg-amber-500/15 text-amber-600 dark:text-amber-400"
            />
          </StaggerItem>
          <StaggerItem>
            <CompletionCard pct={stats.pct} />
          </StaggerItem>
        </StaggerContainer>

        {/* Toolbar */}
        <GlassCard className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks by title or description..."
                className="pl-9 rounded-xl bg-background/60"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status tabs */}
            <Tabs
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "all" | TodoStatus)}
              className="w-full lg:w-auto"
            >
              <TabsList className="w-full lg:w-auto rounded-xl">
                <TabsTrigger value="all" className="flex-1 lg:flex-initial">
                  All
                </TabsTrigger>
                <TabsTrigger value="todo" className="flex-1 lg:flex-initial">
                  To Do
                </TabsTrigger>
                <TabsTrigger value="in-progress" className="flex-1 lg:flex-initial">
                  Active
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex-1 lg:flex-initial">
                  Done
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Priority filter */}
            <Select
              value={priorityFilter}
              onValueChange={(v) => setPriorityFilter(v as "all" | Priority)}
            >
              <SelectTrigger className="w-full lg:w-[150px] rounded-xl bg-background/60">
                <Flag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="high">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    High
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Medium
                  </span>
                </SelectItem>
                <SelectItem value="low">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    Low
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as "due" | "priority" | "created")}
            >
              <SelectTrigger className="w-full lg:w-[150px] rounded-xl bg-background/60">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due">Due date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="created">Recently added</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </GlassCard>

        {/* Board */}
        {loading ? (
          <BoardSkeleton />
        ) : todos.length === 0 ? (
          <GlassCard className="p-0 overflow-hidden">
            <EmptyState
              icon={Inbox}
              title="No tasks yet"
              description="You're all clear! Create your first task to start organizing your day and stay on top of your goals."
              action={
                <Button
                  onClick={handleCreate}
                  className="accent-gradient text-white rounded-xl h-11 px-5"
                >
                  <Plus className="h-4 w-4" />
                  Create your first task
                </Button>
              }
            />
          </GlassCard>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div
              className={cn(
                "grid gap-4",
                visibleColumns.length === 1
                  ? "grid-cols-1"
                  : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              )}
            >
              {visibleColumns.map((col) => (
                <BoardColumn
                  key={col.id}
                  column={col}
                  todos={columns[col.id]}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleEdit}
                  onDelete={(t) => setDeleting(t)}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
              {activeTodo ? (
                <TaskCardOverlay todo={activeTodo} />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Form dialog */}
        <TaskFormDialog
          key={formOpen ? `open-${editing?.id || "new"}` : "closed"}
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o);
            if (!o) setEditing(null);
          }}
          editing={editing}
          subjects={subjects}
          onSave={handleSave}
        />

        {/* Delete confirmation */}
        <AlertDialog
          open={!!deleting}
          onOpenChange={(o) => !o && setDeleting(null)}
        >
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                Delete task?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleting
                  ? `"${deleting.title}" will be permanently removed. This action can't be undone.`
                  : "This task will be permanently removed."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="rounded-xl bg-rose-500 text-white hover:bg-rose-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}

// ---------- Stat cards ----------
function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  iconBg: string;
}) {
  return (
    <GlassCard className={cn("p-4 sm:p-5 relative overflow-hidden")}>
      <div className="relative">
        <div
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3",
            iconBg
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-3xl font-bold tracking-tight">
          <AnimatedCounter value={value} />
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </GlassCard>
  );
}

function CompletionCard({ pct }: { pct: number }) {
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <GlassCard className="relative flex h-full min-h-[116px] items-center overflow-hidden p-4 sm:min-h-[124px] sm:p-5">
      <div className="relative flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              strokeWidth="6"
              className="stroke-muted/40"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className="stroke-violet-500"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
            <AnimatedCounter value={pct} suffix="%" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-0.5">
            Completion
          </div>
          <div className="text-sm text-muted-foreground">of all tasks done</div>
        </div>
      </div>
    </GlassCard>
  );
}

// ---------- Board column ----------
function BoardColumn({
  column,
  todos,
  onToggleComplete,
  onEdit,
  onDelete,
}: {
  column: ColumnDef;
  todos: Todo[];
  onToggleComplete: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const Icon = column.icon;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-2xl border transition-colors min-h-[200px]",
        isOver
          ? "border-violet-500/40 bg-violet-500/5"
          : "border-border/60 bg-muted/20"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-lg",
              column.soft
            )}
          >
            <Icon className={cn("h-4 w-4", column.text)} />
          </span>
          <h3 className="font-semibold text-sm">{column.label}</h3>
          <Badge
            variant="secondary"
            className={cn("rounded-full h-5 px-2 text-xs", column.soft, column.text)}
          >
            {todos.length}
          </Badge>
        </div>
      </div>

      {/* Column body */}
      <ScrollArea className="flex-1 max-h-[60vh]">
        <div className="p-3 space-y-2.5 min-h-[100px]">
          <SortableContext
            items={todos.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence mode="popLayout">
              {todos.map((todo) => (
                <SortableTaskCard
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </AnimatePresence>
          </SortableContext>

          {todos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Icon className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">Drop tasks here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ---------- Sortable task card ----------
function SortableTaskCard({
  todo,
  onToggleComplete,
  onEdit,
  onDelete,
}: {
  todo: Todo;
  onToggleComplete: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      {...attributes}
      {...listeners}
    >
      <TaskCardInner
        todo={todo}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
        dragging={isDragging}
      />
    </motion.div>
  );
}

// Drag overlay version (no DnD listeners)
function TaskCardOverlay({ todo }: { todo: Todo }) {
  return (
    <div className="cursor-grabbing">
      <TaskCardInner todo={todo} dragging overlay />
    </div>
  );
}

function TaskCardInner({
  todo,
  onToggleComplete,
  onEdit,
  onDelete,
  dragging,
  overlay,
}: {
  todo: Todo;
  onToggleComplete?: (todo: Todo) => void;
  onEdit?: (todo: Todo) => void;
  onDelete?: (todo: Todo) => void;
  dragging?: boolean;
  overlay?: boolean;
}) {
  const priority = PRIORITY_CONFIG[todo.priority];
  const category = CATEGORY_CONFIG[todo.category];
  const overdue = isOverdue(todo.dueDate, todo.status);
  const dueStr = formatDueDate(todo.dueDate);
  const completed = todo.status === "completed";

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-card/80 backdrop-blur-sm p-3.5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/10 hover:border-violet-500/40",
        dragging && !overlay && "opacity-40",
        overlay && "shadow-xl shadow-violet-500/20 rotate-2 cursor-grabbing",
        completed && "opacity-75",
        overdue && "border-rose-500/40"
      )}
    >
      {/* Priority stripe */}
      <div
        className={cn(
          "absolute left-0 top-3 bottom-3 w-1 rounded-r-full",
          priority.dot
        )}
      />

      <div className="pl-2">
        {/* Top row: checkbox + title + menu */}
        <div className="flex items-start gap-2.5">
          <motion.div
            whileTap={{ scale: 0.85 }}
            className="pt-0.5 shrink-0"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={completed}
              onCheckedChange={() => onToggleComplete?.(todo)}
              className={cn(
                "h-5 w-5 rounded-md data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500",
                !completed && "border-muted-foreground/30"
              )}
            />
          </motion.div>

          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                "text-sm font-semibold leading-snug break-words",
                completed && "line-through text-muted-foreground"
              )}
            >
              {todo.title}
            </h4>
            {todo.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
                {todo.description}
              </p>
            )}
          </div>

          {!overlay && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Task actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="rounded-xl"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuItem
                  onClick={() => onEdit?.(todo)}
                  className="rounded-md cursor-pointer"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(todo)}
                  className="rounded-md cursor-pointer text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pl-7">
          <Badge
            variant="secondary"
            className={cn(
              "rounded-md h-5 px-1.5 text-[10px] font-medium",
              priority.soft,
              priority.text
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
            {priority.label}
          </Badge>

          <Badge
            variant="secondary"
            className="rounded-md h-5 px-1.5 text-[10px] font-medium bg-muted text-muted-foreground"
          >
            <span>{category.icon}</span>
            {category.label}
          </Badge>

          {todo.subject && (
            <Badge
              variant="secondary"
              className="rounded-md h-5 px-1.5 text-[10px] font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400"
            >
              {todo.subject}
            </Badge>
          )}

          {dueStr && (
            <Badge
              variant="secondary"
              className={cn(
                "rounded-md h-5 px-1.5 text-[10px] font-medium gap-1",
                overdue
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {dueStr}
              {overdue && (
                <AlertTriangle className="h-2.5 w-2.5 fill-current" />
              )}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Task form dialog ----------
interface TodoFormData {
  title: string;
  description: string;
  priority: Priority;
  category: TodoCategory;
  status: TodoStatus;
  subject: string;
  dueDate: string; // yyyy-MM-dd or ""
}

function TaskFormDialog({
  open,
  onOpenChange,
  editing,
  subjects,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Todo | null;
  subjects: Subject[];
  onSave: (data: TodoFormData) => Promise<void>;
}) {
  const isEdit = !!editing;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TodoFormData>(() => ({
    title: editing?.title ?? "",
    description: editing?.description ?? "",
    priority: editing?.priority ?? "medium",
    category: editing?.category ?? "general",
    status: editing?.status ?? "todo",
    subject: editing?.subject ?? "",
    dueDate: editing ? toDateInput(editing.dueDate) : "",
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const update = <K extends keyof TodoFormData>(key: K, value: TodoFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "title" && error) setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
              {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </span>
            {isEdit ? "Edit Task" : "New Task"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of your task below."
              : "Fill in the details below to create a new task."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-sm font-medium">
              Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="What needs to be done?"
              className={cn(
                "rounded-xl",
                error && "border-rose-500 focus-visible:ring-rose-500/30"
              )}
              autoFocus
            />
            {error && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-desc" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="task-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Add more details (optional)"
              rows={3}
              className="rounded-xl resize-none scrollbar-thin"
            />
          </div>

          {/* Grid: Priority, Category, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => update("priority", v as Priority)}
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      High
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="low">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      Low
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => update("category", v as TodoCategory)}
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_CONFIG) as TodoCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      <span className="inline-flex items-center gap-2">
                        <span>{CATEGORY_CONFIG[c].icon}</span>
                        {CATEGORY_CONFIG[c].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => update("status", v as TodoStatus)}
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid: Subject, Due date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Subject</Label>
              <Select
                value={form.subject || "__none__"}
                onValueChange={(v) =>
                  update("subject", v === "__none__" ? "" : v)
                }
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">None</span>
                  </SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            colorOf(s.color).dot
                          )}
                        />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-due" className="text-sm font-medium">
                Due date
              </Label>
              <Input
                id="task-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => update("dueDate", e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !form.title.trim()}
            className="rounded-xl accent-gradient text-white min-w-[100px]"
          >
            {saving ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full"
                />
                Saving...
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Create Task"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Skeleton ----------
function BoardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {COLUMN_CONFIG.map((col) => (
        <div
          key={col.id}
          className="rounded-2xl border border-border/60 bg-muted/20 p-3 space-y-2.5"
        >
          <div className="flex items-center gap-2 px-1 py-2">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ))}
    </div>
  );
}
