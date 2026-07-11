"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  format,
  addDays,
  addMonths,
  addWeeks,
  parseISO,
  isValid,
  isAfter,
} from "date-fns";
import { motion } from "framer-motion";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Trash2,
  Pencil,
  AlertTriangle,
  Sparkles,
  CalendarIcon,
  ListChecks,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import {
  Event,
  EventColor,
  COLOR_MAP,
  colorOf,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type CalendarView = "month" | "week" | "day";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const COLOR_KEYS: EventColor[] = ["violet", "blue", "green", "amber", "rose", "cyan"];

// ---------- Helpers ----------
function eventOnDay(event: Event, day: Date): boolean {
  try {
    const ed = parseISO(event.date);
    return isValid(ed) && isSameDay(ed, day);
  } catch {
    return false;
  }
}

function sortEvents(list: Event[]): Event[] {
  return [...list].sort((a, b) => {
    const da = parseISO(a.date).getTime();
    const db = parseISO(b.date).getTime();
    if (da !== db) return da - db;
    // Empty time sorts last
    if (!a.time && b.time) return 1;
    if (a.time && !b.time) return -1;
    return a.time.localeCompare(b.time);
  });
}

// ---------- Main page ----------
export function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState<Date>(new Date());

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [formDate, setFormDate] = useState<Date | null>(null);
  const [deleting, setDeleting] = useState<Event | null>(null);
  // Day detail
  const [dayDetail, setDayDetail] = useState<Date | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ events: Event[] }>("/api/events");
      setEvents(res.events);
    } catch (err) {
      handleError(err, "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const sortedEvents = useMemo(() => sortEvents(events), [events]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return sortedEvents
      .filter((e) => {
        try {
          const ed = parseISO(e.date);
          return isValid(ed) && (isAfter(ed, now) || isSameDay(ed, now));
        } catch {
          return false;
        }
      })
      .slice(0, 5);
  }, [sortedEvents]);

  // ---------- Navigation ----------
  const goPrev = () => {
    if (view === "month") setCursor((d) => addMonths(d, -1));
    else if (view === "week") setCursor((d) => addWeeks(d, -1));
    else setCursor((d) => addDays(d, -1));
  };
  const goNext = () => {
    if (view === "month") setCursor((d) => addMonths(d, 1));
    else if (view === "week") setCursor((d) => addWeeks(d, 1));
    else setCursor((d) => addDays(d, 1));
  };
  const goToday = () => setCursor(new Date());

  // ---------- Mutations ----------
  const handleCreate = (date?: Date) => {
    setEditing(null);
    setFormDate(date ?? cursor);
    setFormOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEditing(event);
    try {
      setFormDate(parseISO(event.date));
    } catch {
      setFormDate(null);
    }
    setFormOpen(true);
  };

  const handleSave = async (data: EventFormData) => {
    try {
      if (editing) {
        const updated = await apiFetch<{ event: Event }>(
          `/api/events/${editing.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              title: data.title,
              date: data.date,
              time: data.time,
              description: data.description,
              color: data.color,
            }),
          }
        );
        setEvents((prev) =>
          prev.map((e) => (e.id === updated.event.id ? updated.event : e))
        );
        toast.success("Event updated");
      } else {
        const created = await apiFetch<{ event: Event }>("/api/events", {
          method: "POST",
          body: JSON.stringify({
            title: data.title,
            date: data.date,
            time: data.time,
            description: data.description,
            color: data.color,
          }),
        });
        setEvents((prev) => [...prev, created.event]);
        toast.success("Event created");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      handleError(err, "Failed to save event");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const id = deleting.id;
    const snapshot = deleting;
    setDeleting(null);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      await apiFetch<{ success: boolean }>(`/api/events/${id}`, {
        method: "DELETE",
      });
      toast.success("Event deleted");
    } catch (err) {
      setEvents((prev) => [...prev, snapshot]);
      handleError(err, "Failed to delete event");
    }
  };

  // ---------- Drag-and-drop move ----------
  const handleEventMove = useCallback(
    async (eventId: string, newDate: string) => {
      const target = events.find((e) => e.id === eventId);
      if (!target) return;

      // Skip no-op move (same day)
      let originalDate = "";
      try {
        originalDate = format(parseISO(target.date), "yyyy-MM-dd");
      } catch {
        originalDate = "";
      }
      if (originalDate === newDate) return;

      // Snapshot for revert on failure
      const snapshot = events;
      // Optimistically update local state — preserve time if present
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, date: newDate } : e))
      );

      const toastId = toast.loading("Moving event…");
      try {
        await apiFetch<{ event: Event }>(`/api/events/${eventId}`, {
          method: "PUT",
          body: JSON.stringify({ date: newDate }),
        });
        let formatted = newDate;
        try {
          formatted = format(parseISO(newDate), "MMM d");
        } catch {
          /* keep raw */
        }
        toast.success(`Event moved to ${formatted}`, { id: toastId });
      } catch (err) {
        setEvents(snapshot);
        toast.error("Failed to move event", { id: toastId });
        handleError(err, "Failed to move event");
      }
    },
    [events]
  );

  // ---------- Header label ----------
  const headerLabel = useMemo(() => {
    if (view === "month") return format(cursor, "MMMM yyyy");
    if (view === "week") {
      const ws = startOfWeek(cursor, { weekStartsOn: 0 });
      const we = endOfWeek(cursor, { weekStartsOn: 0 });
      if (isSameMonth(ws, we)) return `${format(ws, "MMM d")} – ${format(we, "d, yyyy")}`;
      return `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`;
    }
    return format(cursor, "EEEE, MMM d, yyyy");
  }, [view, cursor]);

  const stats = useMemo(() => {
    const monthEvents = events.filter((e) => {
      try {
        const ed = parseISO(e.date);
        return isValid(ed) && isSameMonth(ed, cursor);
      } catch {
        return false;
      }
    });
    return {
      monthCount: monthEvents.length,
      upcomingCount: upcoming.length,
      total: events.length,
    };
  }, [events, cursor, upcoming]);

  // ---------- Render ----------
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-500/5 dark:bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-950 ring-1 ring-violet-500/20 dark:text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Organize your life, day by day</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Calendar
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
              Keep track of your events, deadlines, and important dates.
            </p>
          </div>
          <Button
            onClick={() => handleCreate()}
            className="accent-gradient text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all rounded-xl h-11 px-5"
          >
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>

        {/* Stats */}
        <StaggerContainer className="grid grid-cols-3 gap-3 sm:gap-4">
          <StaggerItem>
            <MiniStat
              icon={CalendarDays}
              label="This Month"
              value={stats.monthCount}
              accent="bg-violet-500/15 text-violet-600 dark:text-violet-400"
            />
          </StaggerItem>
          <StaggerItem>
            <MiniStat
              icon={ListChecks}
              label="Upcoming"
              value={stats.upcomingCount}
              accent="bg-amber-500/15 text-amber-600 dark:text-amber-400"
            />
          </StaggerItem>
          <StaggerItem>
            <MiniStat
              icon={CalendarIcon}
              label="All Events"
              value={stats.total}
              accent="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            />
          </StaggerItem>
        </StaggerContainer>

        {/* Main grid: calendar + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          {/* Calendar card */}
          <GlassCard className="p-4 sm:p-5">
            {/* Calendar toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-semibold">
                  {headerLabel}
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToday}
                  className="rounded-xl"
                >
                  Today
                </Button>

                <div className="flex items-center gap-0.5 rounded-xl border bg-background/60 p-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goPrev}
                    className="h-8 w-8 rounded-lg"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goNext}
                    className="h-8 w-8 rounded-lg"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <Tabs
                  value={view}
                  onValueChange={(v) => setView(v as CalendarView)}
                >
                  <TabsList className="rounded-xl">
                    <TabsTrigger value="month" className="rounded-lg">
                      Month
                    </TabsTrigger>
                    <TabsTrigger value="week" className="rounded-lg">
                      Week
                    </TabsTrigger>
                    <TabsTrigger value="day" className="rounded-lg">
                      Day
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Calendar body */}
            {loading ? (
              <CalendarSkeleton view={view} />
            ) : view === "month" ? (
              <MonthView
                cursor={cursor}
                events={sortedEvents}
                onDayClick={(d) => setDayDetail(d)}
                onEventClick={handleEdit}
                onEventMove={handleEventMove}
              />
            ) : view === "week" ? (
              <WeekView
                cursor={cursor}
                events={sortedEvents}
                onDayClick={(d) => setDayDetail(d)}
                onEventClick={handleEdit}
                onEventMove={handleEventMove}
              />
            ) : (
              <DayView
                cursor={cursor}
                events={sortedEvents}
                onAdd={(d) => handleCreate(d)}
                onEventClick={handleEdit}
              />
            )}
          </GlassCard>

          {/* Upcoming events sidebar */}
          <GlassCard className="p-4 sm:p-5 lg:max-h-[calc(100vh-200px)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
                  <Clock className="h-4 w-4" />
                </span>
                Upcoming
              </h3>
              <Badge
                variant="secondary"
                className="rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400"
              >
                {upcoming.length}
              </Badge>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No upcoming events
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreate()}
                  className="mt-3 rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Event
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-260px)] min-h-[200px] pr-2">
                <div className="space-y-2.5">
                  {upcoming.map((event, i) => (
                    <UpcomingItem
                      key={event.id}
                      event={event}
                      index={i}
                      onClick={() => handleEdit(event)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </GlassCard>
        </div>

        {/* Event form dialog */}
        <EventFormDialog
          key={
            formOpen
              ? `open-${editing?.id || formDate?.toISOString() || "new"}`
              : "closed"
          }
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o);
            if (!o) {
              setEditing(null);
              setFormDate(null);
            }
          }}
          editing={editing}
          initialDate={formDate}
          onSave={handleSave}
        />

        {/* Day detail dialog */}
        <DayDetailDialog
          date={dayDetail}
          events={dayDetail ? sortedEvents.filter((e) => eventOnDay(e, dayDetail)) : []}
          onOpenChange={(o) => !o && setDayDetail(null)}
          onAdd={(d) => {
            setDayDetail(null);
            handleCreate(d);
          }}
          onEdit={(e) => {
            setDayDetail(null);
            handleEdit(e);
          }}
          onDelete={(e) => setDeleting(e)}
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
                Delete event?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleting
                  ? `"${deleting.title}" will be permanently removed. This action can't be undone.`
                  : "This event will be permanently removed."}
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

// ---------- Mini stat ----------
function MiniStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <GlassCard className="p-3 sm:p-4 flex items-center gap-3">
      <span
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          accent
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xl sm:text-2xl font-bold leading-tight">
          <AnimatedCounter value={value} />
        </div>
        <div className="text-[11px] sm:text-xs text-muted-foreground truncate">
          {label}
        </div>
      </div>
    </GlassCard>
  );
}

// ---------- Month view ----------
function MonthView({
  cursor,
  events,
  onDayClick,
  onEventClick,
  onEventMove,
}: {
  cursor: Date;
  events: Event[];
  onDayClick: (day: Date) => void;
  onEventClick: (event: Event) => void;
  onEventMove: (eventId: string, newDate: string) => void;
}) {
  // Drag state lifted here so all DayCells share a single source of truth.
  // `draggingEventId` (state) drives visual re-renders; `draggingEventIdRef`
  // (ref) provides a stable, always-current read for handlers without
  // triggering re-renders — and acts as a fallback if the dataTransfer
  // payload is unavailable.
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
  const draggingEventIdRef = useRef<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<Date | null>(null);

  const handleDraggingEventIdChange = useCallback((id: string | null) => {
    draggingEventIdRef.current = id;
    setDraggingEventId(id);
  }, []);

  const days = useMemo(() => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [cursor]);

  return (
    <div className="space-y-2">
      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] sm:text-xs font-semibold text-muted-foreground py-1"
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, idx) => (
          <DayCell
            key={day.toISOString()}
            day={day}
            isCurrentMonth={isSameMonth(day, cursor)}
            events={events.filter((e) => eventOnDay(e, day))}
            onDayClick={onDayClick}
            onEventClick={onEventClick}
            onEventMove={onEventMove}
            index={idx}
            draggingEventId={draggingEventId}
            draggingEventIdRef={draggingEventIdRef}
            dragOverDay={dragOverDay}
            onDraggingEventIdChange={handleDraggingEventIdChange}
            onDragOverDayChange={setDragOverDay}
          />
        ))}
      </div>
    </div>
  );
}

function DayCell({
  day,
  isCurrentMonth,
  events,
  onDayClick,
  onEventClick,
  onEventMove,
  index,
  draggingEventId,
  draggingEventIdRef,
  dragOverDay,
  onDraggingEventIdChange,
  onDragOverDayChange,
}: {
  day: Date;
  isCurrentMonth: boolean;
  events: Event[];
  onDayClick: (day: Date) => void;
  onEventClick: (event: Event) => void;
  onEventMove: (eventId: string, newDate: string) => void;
  index: number;
  draggingEventId: string | null;
  draggingEventIdRef: React.RefObject<string | null>;
  dragOverDay: Date | null;
  onDraggingEventIdChange: (id: string | null) => void;
  onDragOverDayChange: (day: Date | null) => void;
}) {
  const today = isToday(day);
  const visible = events.slice(0, 3);
  const overflow = events.length - visible.length;

  // Drag state — this DayCell shows drop affordance only when an active drag
  // is in progress AND the pointer is hovering over THIS day.
  const isDragOver =
    !!draggingEventId && !!dragOverDay && isSameDay(dragOverDay, day);
  const newDateStr = format(day, "yyyy-MM-dd");

  // Drop-target handlers (live on the cell root).
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggingEventIdRef.current && !draggingEventId) return;
    e.preventDefault(); // required to allow drop
    e.dataTransfer.dropEffect = "move";
    e.stopPropagation();
    if (!dragOverDay || !isSameDay(dragOverDay, day)) {
      onDragOverDayChange(day);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggingEventIdRef.current && !draggingEventId) return;
    e.stopPropagation();
    // Only clear when the pointer truly leaves this cell (not when entering
    // a child element). `relatedTarget` is the element entering; if it's
    // null or outside the cell, we treat this as a real leave.
    const related = e.relatedTarget as Node | null;
    if (!related || !e.currentTarget.contains(related)) {
      if (dragOverDay && isSameDay(dragOverDay, day)) {
        onDragOverDayChange(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const current = draggingEventIdRef.current || draggingEventId;
    if (!current) return;
    e.preventDefault();
    e.stopPropagation();
    // Prefer the dataTransfer payload; fall back to the lifted ref.
    const eventId = e.dataTransfer.getData("text/plain") || current;
    onEventMove(eventId, newDateStr);
    onDraggingEventIdChange(null);
    onDragOverDayChange(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.01, 0.2) }}
      onClick={() => onDayClick(day)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "group relative min-h-[80px] sm:min-h-[110px] rounded-xl p-1.5 sm:p-2 cursor-pointer transition-all border",
        "hover:border-violet-500/30 hover:shadow-sm",
        !isCurrentMonth && "opacity-40",
        today
          ? "border-violet-500/50 bg-violet-500/5 ring-1 ring-violet-500/30"
          : "border-border/40 bg-background/40",
        today && "today-cell-pulse",
        isDragOver && "drag-over"
      )}
    >
      {/* Date number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            "inline-flex items-center justify-center text-xs font-semibold",
            today
              ? "h-6 w-6 rounded-full bg-violet-500 text-white"
              : "h-6 w-6 rounded-full text-foreground"
          )}
        >
          {format(day, "d")}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDayClick(day);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-violet-500"
          aria-label="Add event"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Events */}
      <div className="space-y-1 relative">
        {isDragOver && (
          <div
            className="drop-line"
            style={{ top: 0 }}
            aria-hidden="true"
          />
        )}
        {visible.map((event) => {
          const c = colorOf(event.color);
          const isThisDragging = draggingEventId === event.id;
          return (
            <button
              key={event.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", event.id);
                e.dataTransfer.effectAllowed = "move";
                // Update both lifted state (visual feedback) and the ref
                // (stable read for any drop handler in the grid).
                onDraggingEventIdChange(event.id);
                // Prevent the cell's click handler from firing during drag.
                e.stopPropagation();
              }}
              onDragEnd={() => {
                onDraggingEventIdChange(null);
                onDragOverDayChange(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onEventClick(event);
              }}
              className={cn(
                "flex items-center gap-1 w-full text-left rounded-md px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium leading-tight truncate transition-colors hover:brightness-110 cursor-grab active:cursor-grabbing",
                c.soft,
                c.text,
                isThisDragging && "event-dragging"
              )}
              title={`${event.title}${event.time ? ` · ${event.time}` : ""} · Drag to move to another day`}
              aria-label={`Event: ${event.title}. Drag to move to another day.`}
            >
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.dot)} />
              <span className="truncate">{event.title}</span>
            </button>
          );
        })}
        {overflow > 0 && (
          <div className="text-[10px] text-muted-foreground px-1.5 font-medium">
            +{overflow} more
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------- Week view ----------
function WeekView({
  cursor,
  events,
  onDayClick,
  onEventClick,
  onEventMove,
}: {
  cursor: Date;
  events: Event[];
  onDayClick: (day: Date) => void;
  onEventClick: (event: Event) => void;
  onEventMove: (eventId: string, newDate: string) => void;
}) {
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<Date | null>(null);

  const days = useMemo(() => {
    const ws = startOfWeek(cursor, { weekStartsOn: 0 });
    return Array.from({ length: 7 }).map((_, i) => addDays(ws, i));
  }, [cursor]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {days.map((day, idx) => {
        const dayEvents = events.filter((e) => eventOnDay(e, day));
        const today = isToday(day);
        const isDragOver =
          !!draggingEventId && !!dragOverDay && isSameDay(dragOverDay, day);
        const newDateStr = format(day, "yyyy-MM-dd");

        const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
          if (!draggingEventId) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          e.stopPropagation();
          if (!dragOverDay || !isSameDay(dragOverDay, day)) {
            setDragOverDay(day);
          }
        };
        const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
          if (!draggingEventId) return;
          e.stopPropagation();
          const related = e.relatedTarget as Node | null;
          if (!related || !e.currentTarget.contains(related)) {
            if (dragOverDay && isSameDay(dragOverDay, day)) {
              setDragOverDay(null);
            }
          }
        };
        const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
          if (!draggingEventId) return;
          e.preventDefault();
          e.stopPropagation();
          const eventId = e.dataTransfer.getData("text/plain") || draggingEventId;
          onEventMove(eventId, newDateStr);
          setDraggingEventId(null);
          setDragOverDay(null);
        };

        return (
          <motion.div
            key={day.toISOString()}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.03 }}
            onClick={() => onDayClick(day)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative rounded-2xl border p-3 min-h-[160px] cursor-pointer transition-all hover:border-violet-500/30 hover:shadow-sm flex flex-col",
              today
                ? "border-violet-500/50 bg-violet-500/5 ring-1 ring-violet-500/30"
                : "border-border/40 bg-background/40",
              today && "today-cell-pulse",
              isDragOver && "drag-over"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "text-lg font-bold leading-none",
                    today && "text-violet-600 dark:text-violet-400"
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDayClick(day);
                }}
                className="text-muted-foreground hover:text-violet-500 transition-colors"
                aria-label="Add event"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-thin relative">
              {isDragOver && (
                <div
                  className="drop-line"
                  style={{ top: 0 }}
                  aria-hidden="true"
                />
              )}
              {dayEvents.length === 0 ? (
                <div className="text-[10px] text-muted-foreground/50 italic mt-1">
                  No events
                </div>
              ) : (
                dayEvents.map((event) => {
                  const c = colorOf(event.color);
                  const isThisDragging = draggingEventId === event.id;
                  return (
                    <button
                      key={event.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", event.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingEventId(event.id);
                        e.stopPropagation();
                      }}
                      onDragEnd={() => {
                        setDraggingEventId(null);
                        setDragOverDay(null);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className={cn(
                        "flex flex-col gap-0.5 w-full text-left rounded-lg px-2 py-1.5 text-xs transition-colors hover:brightness-110 cursor-grab active:cursor-grabbing",
                        c.soft,
                        isThisDragging && "event-dragging"
                      )}
                      title={`${event.title}${event.time ? ` · ${event.time}` : ""} · Drag to move to another day`}
                      aria-label={`Event: ${event.title}. Drag to move to another day.`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full shrink-0", c.dot)} />
                        <span className={cn("font-medium truncate", c.text)}>
                          {event.title}
                        </span>
                      </div>
                      {event.time && (
                        <span className="text-[10px] text-muted-foreground pl-3.5">
                          {event.time}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ---------- Day view ----------
function DayView({
  cursor,
  events,
  onAdd,
  onEventClick,
}: {
  cursor: Date;
  events: Event[];
  onAdd: (day: Date) => void;
  onEventClick: (event: Event) => void;
}) {
  const dayEvents = useMemo(
    () => events.filter((e) => eventOnDay(e, cursor)),
    [events, cursor]
  );
  const today = isToday(cursor);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-14 w-14 flex-col items-center justify-center rounded-2xl",
              today
                ? "accent-gradient text-white"
                : "bg-muted text-foreground"
            )}
          >
            <span className="text-[10px] uppercase font-semibold opacity-80">
              {format(cursor, "EEE")}
            </span>
            <span className="text-xl font-bold leading-none">
              {format(cursor, "d")}
            </span>
          </div>
          <div>
            <h3 className="font-semibold">
              {format(cursor, "EEEE, MMMM d")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""} scheduled
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAdd(cursor)}
          className="rounded-xl"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {dayEvents.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing scheduled"
          description="You have a free day. Add an event to make the most of it."
          action={
            <Button
              size="sm"
              onClick={() => onAdd(cursor)}
              className="accent-gradient text-white rounded-xl"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Event
            </Button>
          }
          className="py-12"
        />
      ) : (
        <div className="space-y-2">
          {dayEvents.map((event, i) => (
            <DayEventRow
              key={event.id}
              event={event}
              index={i}
              onClick={() => onEventClick(event)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DayEventRow({
  event,
  index,
  onClick,
}: {
  event: Event;
  index: number;
  onClick: () => void;
}) {
  const c = colorOf(event.color);
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border border-border/40 bg-background/40 p-3.5 text-left transition-all hover:border-violet-500/30 hover:shadow-md group"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-1.5 shrink-0 rounded-full self-stretch",
          c.dot
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-sm">{event.title}</h4>
          {event.time && (
            <Badge
              variant="secondary"
              className={cn("rounded-md h-5 px-1.5 text-[10px]", c.soft, c.text)}
            >
              <Clock className="h-2.5 w-2.5" />
              {event.time}
            </Badge>
          )}
        </div>
        {event.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
      <Pencil className="h-4 w-4 text-muted-foreground/40 group-hover:text-violet-500 transition-colors mt-1" />
    </motion.button>
  );
}

// ---------- Upcoming item ----------
function UpcomingItem({
  event,
  index,
  onClick,
}: {
  event: Event;
  index: number;
  onClick: () => void;
}) {
  const c = colorOf(event.color);
  let dateStr = "";
  let timeStr = "";
  try {
    const d = parseISO(event.date);
    dateStr = format(d, "EEE, MMM d");
    timeStr = event.time || "All day";
  } catch {
    dateStr = "—";
  }

  return (
    <motion.button
      initial={{ opacity: 0, x: 6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-2xl border border-border/40 bg-background/40 p-3 text-left transition-all hover:border-violet-500/30 hover:shadow-md group"
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          c.soft
        )}
      >
        <span className={cn("h-2.5 w-2.5 rounded-full", c.dot)} />
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm truncate">{event.title}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground">{dateStr}</span>
          {timeStr && (
            <>
              <span className="text-[11px] text-muted-foreground/50">·</span>
              <span className={cn("text-[11px] font-medium", c.text)}>
                {timeStr}
              </span>
            </>
          )}
        </div>
      </div>
      <Pencil className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-violet-500 transition-colors mt-1" />
    </motion.button>
  );
}

// ---------- Day detail dialog ----------
function DayDetailDialog({
  date,
  events,
  onOpenChange,
  onAdd,
  onEdit,
  onDelete,
}: {
  date: Date | null;
  events: Event[];
  onOpenChange: (open: boolean) => void;
  onAdd: (day: Date) => void;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
}) {
  return (
    <Dialog open={!!date} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl max-h-[90vh] overflow-y-auto scrollbar-thin border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
              <CalendarDays className="h-4 w-4" />
            </span>
            {date ? format(date, "EEEE, MMMM d") : ""}
          </DialogTitle>
          <DialogDescription>
            {events.length === 0
              ? "No events scheduled. Click below to add one."
              : `${events.length} event${events.length !== 1 ? "s" : ""} on this day.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto scrollbar-thin pr-1">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Free day!</p>
            </div>
          ) : (
            events.map((event) => {
              const c = colorOf(event.color);
              return (
                <div
                  key={event.id}
                  className="group flex items-start gap-3 rounded-2xl border border-border/40 bg-background/40 p-3"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      c.soft
                    )}
                  >
                    <span className={cn("h-2.5 w-2.5 rounded-full", c.dot)} />
                  </span>
                  <button
                    onClick={() => onEdit(event)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <h4 className="font-semibold text-sm truncate">
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      {event.time && (
                        <span
                          className={cn(
                            "text-[11px] font-medium",
                            c.text
                          )}
                        >
                          {event.time}
                        </span>
                      )}
                      {!event.time && (
                        <span className="text-[11px] text-muted-foreground">
                          All day
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(event)}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(event)}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md text-rose-500 hover:bg-rose-500/10"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => date && onAdd(date)}
            className="rounded-xl accent-gradient text-white w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Event form dialog ----------
interface EventFormData {
  title: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm or ""
  description: string;
  color: EventColor;
}

function EventFormDialog({
  open,
  onOpenChange,
  editing,
  initialDate,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Event | null;
  initialDate: Date | null;
  onSave: (data: EventFormData) => Promise<void>;
}) {
  const isEdit = !!editing;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormData>(() => ({
    title: editing?.title ?? "",
    date: editing
      ? toDateInput(editing.date)
      : initialDate
      ? format(initialDate, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    time: editing?.time ?? "",
    description: editing?.description ?? "",
    color:
      editing && COLOR_MAP[editing.color] ? editing.color : "violet",
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.date) {
      setError("Date is required");
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const update = <K extends keyof EventFormData>(
    key: K,
    value: EventFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "title" && error) setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl max-h-[90vh] overflow-y-auto scrollbar-thin border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
              {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </span>
            {isEdit ? "Edit Event" : "New Event"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of your event below."
              : "Add a new event to your calendar."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="event-title" className="text-sm font-medium">
              Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="event-title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Calculus midterm review"
              className={cn(
                "rounded-xl",
                error && !form.title.trim() && "border-rose-500 focus-visible:ring-rose-500/30"
              )}
              autoFocus
            />
            {error && !form.title.trim() && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Title is required
              </p>
            )}
          </div>

          {/* Date + time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-date" className="text-sm font-medium">
                Date <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="event-date"
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className={cn(
                  "rounded-xl",
                  error && !form.date && "border-rose-500"
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-time" className="text-sm font-medium">
                Time
              </Label>
              <Input
                id="event-time"
                type="time"
                value={form.time}
                onChange={(e) => update("time", e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="event-desc" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="event-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Add notes or details (optional)"
              rows={3}
              className="rounded-xl resize-none scrollbar-thin"
            />
          </div>

          {/* Color picker */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_KEYS.map((color) => {
                const c = colorOf(color);
                const selected = form.color === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => update("color", color)}
                    className={cn(
                      "relative h-9 w-9 rounded-xl transition-all",
                      "hover:scale-110",
                      selected && "ring-2 ring-offset-2 ring-offset-background scale-110",
                      c.bg
                    )}
                    style={
                      selected
                        ? ({ "--tw-ring-color": c.chart } as React.CSSProperties)
                        : undefined
                    }
                    aria-label={`Color ${color}`}
                  >
                    {selected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <svg
                          className="h-4 w-4 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </motion.span>
                    )}
                  </button>
                );
              })}
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
            disabled={saving || !form.title.trim() || !form.date}
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
              "Create Event"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Helpers ----------
function toDateInput(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return format(new Date(), "yyyy-MM-dd");
    return format(d, "yyyy-MM-dd");
  } catch {
    return format(new Date(), "yyyy-MM-dd");
  }
}

// ---------- Skeleton ----------
function CalendarSkeleton({ view }: { view: CalendarView }) {
  if (view === "day") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-5 rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: view === "week" ? 7 : 35 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "rounded-xl",
              view === "week" ? "min-h-[160px]" : "min-h-[80px] sm:min-h-[110px]"
            )}
          />
        ))}
      </div>
    </div>
  );
}
