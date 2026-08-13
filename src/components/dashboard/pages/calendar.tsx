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
  Gift,
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

import { PageTransition } from "@/components/shared/motion";
import { Skeleton, EmptyState } from "@/components/shared/feedback";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { apiFetch, handleError } from "@/lib/api";
import { readPageCache, writePageCache } from "@/lib/page-cache";
import { useAppStore } from "@/lib/store";
import {
  Event,
  EventColor,
  COLOR_MAP,
  colorOf,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type CalendarView = "month" | "week" | "day";

interface FestivalHoliday {
  id: string;
  date: string;
  name: string;
  localName: string;
  type: string;
  source: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const COLOR_KEYS: EventColor[] = ["violet", "blue", "green", "amber", "rose", "cyan"];
const FORM_FIELD_CLASS =
  "rounded-lg border-border/75 bg-background/90 shadow-sm transition-colors hover:bg-card focus-visible:border-violet-400/70 focus-visible:ring-violet-500/20 dark:border-border/55 dark:bg-background/60 dark:hover:bg-background/75";
const FORM_LABEL_CLASS = "text-sm font-semibold text-foreground/90";
const FORM_DIALOG_CLASS =
  "dashboard-surface max-h-[90vh] overflow-y-auto rounded-lg p-0 shadow-2xl shadow-slate-950/15 backdrop-blur-2xl sm:max-w-[600px]";
const FORM_SECTION_CLASS = "dashboard-row space-y-2 p-3 sm:p-4";

// ---------- Helpers ----------
function eventOnDay(event: Event, day: Date): boolean {
  try {
    const ed = parseISO(event.date);
    return isValid(ed) && isSameDay(ed, day);
  } catch {
    return false;
  }
}

function festivalOnDay(festival: FestivalHoliday, day: Date): boolean {
  return festival.date === format(day, "yyyy-MM-dd");
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

function isOptimisticEvent(event: Event) {
  return event.id.startsWith("temp-");
}

// ---------- Main page ----------
export function CalendarPage() {
  const userId = useAppStore((s) => s.user?.id);
  const initialCache = useMemo(
    () => readPageCache<{ events: Event[] }>("calendar", userId),
    [userId]
  );
  const [events, setEvents] = useState<Event[]>(() => initialCache?.events ?? []);
  const [festivals, setFestivals] = useState<FestivalHoliday[]>([]);
  const [loading, setLoading] = useState(() => !initialCache);
  const [festivalsLoading, setFestivalsLoading] = useState(false);

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
    const cached = readPageCache<{ events: Event[] }>("calendar", userId);
    if (cached) {
      setEvents(cached.events);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const res = await apiFetch<{ events: Event[] }>("/api/events");
      setEvents(res.events);
      writePageCache("calendar", userId, { events: res.events });
    } catch (err) {
      handleError(err, "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchEvents();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchEvents]);

  useEffect(() => {
    let active = true;
    let loadingTimer: ReturnType<typeof window.setTimeout> | null = null;
    const year = cursor.getFullYear();
    const years = Array.from(new Set([year - 1, year, year + 1]));

    loadingTimer = window.setTimeout(() => {
      if (!active) return;
      setFestivalsLoading(true);
      Promise.all(
        years.map((targetYear) =>
          apiFetch<{ festivals: FestivalHoliday[] }>(
            `/api/festivals?country=IN&year=${targetYear}`
          )
        )
      )
        .then((results) => {
          if (!active) return;
          const byKey = new Map<string, FestivalHoliday>();
          results
            .flatMap((result) => result.festivals)
            .forEach((festival) => {
              byKey.set(`${festival.date}:${festival.name}`, festival);
            });
          setFestivals(
            [...byKey.values()].sort((a, b) => a.date.localeCompare(b.date))
          );
        })
        .catch((error) => {
          if (!active) return;
          setFestivals([]);
          handleError(error, "Failed to load festivals");
        })
        .finally(() => {
          if (active) {
            setFestivalsLoading(false);
          }
          });
    }, 0);

    return () => {
      active = false;
      if (loadingTimer) window.clearTimeout(loadingTimer);
    };
  }, [cursor]);

  useEffect(() => {
    if (!loading) {
      writePageCache("calendar", userId, { events });
    }
  }, [events, loading, userId]);

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

  const upcomingFestivals = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return festivals
      .filter((festival) => festival.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6);
  }, [festivals]);

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
    if (isOptimisticEvent(event)) return;
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
        const previousEvents = events;
        const now = new Date().toISOString();
        const optimisticEvent: Event = {
          id: `temp-${Date.now()}`,
          userId: userId ?? "",
          title: data.title.trim(),
          date: data.date,
          time: data.time,
          description: data.description,
          color: data.color,
          createdAt: now,
          updatedAt: now,
        };

        setEvents((prev) => [...prev, optimisticEvent]);
        setFormOpen(false);
        setEditing(null);

        void (async () => {
          try {
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
            setEvents((prev) =>
              prev.map((event) =>
                event.id === optimisticEvent.id ? created.event : event
              )
            );
            toast.success("Event created");
          } catch (err) {
            setEvents(previousEvents);
            writePageCache("calendar", userId, { events: previousEvents });
            handleError(err, "Failed to save event");
          }
        })();

        return;
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
      if (isOptimisticEvent(target)) return;

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
    const monthFestivals = festivals.filter((festival) => {
      try {
        const date = parseISO(festival.date);
        return isValid(date) && isSameMonth(date, cursor);
      } catch {
        return false;
      }
    });
    return {
      monthCount: monthEvents.length,
      upcomingCount: upcoming.length,
      total: events.length,
      festivalCount: monthFestivals.length,
    };
  }, [events, festivals, cursor, upcoming]);

  // ---------- Render ----------
  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        {/* Subtitle & Actions Bar */}
        <div className="dashboard-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="space-y-1">
            <div className="dashboard-chip dashboard-theme-glow-chip dashboard-theme-glow-text">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Organize your life, day by day</span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Keep track of your events, deadlines, and important dates.
            </p>
          </div>
          <Button
            onClick={() => handleCreate()}
            className="accent-gradient h-10 shrink-0 rounded-lg px-4 text-white shadow-md shadow-violet-500/20 transition-shadow hover:shadow-violet-500/30"
          >
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat
            icon={CalendarDays}
            label="This Month"
            value={stats.monthCount}
            accent="bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300"
          />
          <MiniStat
            icon={ListChecks}
            label="Upcoming"
            value={stats.upcomingCount}
            accent="bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300"
          />
          <MiniStat
            icon={CalendarIcon}
            label="All Events"
            value={stats.total}
            accent="bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
          />
          <MiniStat
            icon={Gift}
            label="Festivals"
            value={stats.festivalCount}
            accent="bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300"
          />
        </div>

        {/* Main grid: calendar + sidebar */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          {/* Calendar card */}
          <div className="dashboard-surface p-3 sm:p-4">
            {/* Calendar toolbar */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  className="h-9 rounded-lg border-border/70 bg-background/85 shadow-sm dark:border-border/60 dark:bg-background/60"
                >
                  Today
                </Button>

                <div className="flex items-center gap-0.5 rounded-lg border border-border/70 bg-background/85 p-0.5 shadow-sm dark:border-border/60 dark:bg-background/60">
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
                  <TabsList className="rounded-lg">
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
                festivals={festivals}
                onDayClick={(d) => setDayDetail(d)}
                onEventClick={handleEdit}
                onEventMove={handleEventMove}
              />
            ) : view === "week" ? (
              <WeekView
                cursor={cursor}
                events={sortedEvents}
                festivals={festivals}
                onDayClick={(d) => setDayDetail(d)}
                onEventClick={handleEdit}
                onEventMove={handleEventMove}
              />
            ) : (
              <DayView
                cursor={cursor}
                events={sortedEvents}
                festivals={festivals}
                onAdd={(d) => handleCreate(d)}
                onEventClick={handleEdit}
              />
            )}
          </div>

          {/* Upcoming events sidebar */}
          <div className="dashboard-surface p-3 sm:p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="dashboard-section-title">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 shadow-sm ring-1 ring-violet-500/15 dark:bg-violet-500/20 dark:text-violet-300">
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
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
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
                  className="mt-3 rounded-lg border-border/70 bg-background/85 shadow-sm dark:border-border/60 dark:bg-background/60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Event
                </Button>
              </div>
            ) : (
              <ScrollArea className="max-h-52 min-h-[180px] pr-2">
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

            <div className="mt-5 border-t border-border/50 pt-4">
              <div className="mb-3 flex shrink-0 items-center justify-between">
                <h3 className="dashboard-section-title">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 shadow-sm ring-1 ring-rose-500/15 dark:bg-rose-500/20 dark:text-rose-300">
                    <Gift className="h-4 w-4" />
                  </span>
                  Upcoming Festivals
                </h3>
                <Badge
                  variant="secondary"
                  className="rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400"
                >
                  {upcomingFestivals.length}
                </Badge>
              </div>
              {festivalsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : upcomingFestivals.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
                  No upcoming festivals loaded.
                </p>
              ) : (
                <ScrollArea className="h-[320px] overflow-hidden rounded-lg pr-3">
                  <div className="space-y-2 pr-1">
                    {upcomingFestivals.map((festival, i) => (
                      <FestivalUpcomingItem
                        key={`${festival.date}-${festival.name}`}
                        festival={festival}
                        index={i}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
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
          festivals={dayDetail ? festivals.filter((f) => festivalOnDay(f, dayDetail)) : []}
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
          <AlertDialogContent className="dashboard-surface rounded-lg border-border/70 shadow-2xl shadow-slate-950/20 dark:border-border/55">
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
              <AlertDialogCancel className="rounded-lg border-border/70 bg-background/85 shadow-sm hover:bg-muted/60 dark:border-border/60 dark:bg-background/60">
                Cancel
              </AlertDialogCancel>
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
    <div className="dashboard-surface flex items-center gap-3 p-3 sm:p-4">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-white/20",
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
    </div>
  );
}

// ---------- Month view ----------
function MonthView({
  cursor,
  events,
  festivals,
  onDayClick,
  onEventClick,
  onEventMove,
}: {
  cursor: Date;
  events: Event[];
  festivals: FestivalHoliday[];
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
            festivals={festivals.filter((f) => festivalOnDay(f, day))}
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
  festivals,
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
  festivals: FestivalHoliday[];
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
  const visibleFestivals = festivals.slice(0, 2);
  const visible = events.slice(0, Math.max(1, 3 - visibleFestivals.length));
  const overflow =
    events.length -
    visible.length +
    festivals.length -
    visibleFestivals.length;

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
        "dashboard-row group relative min-h-[76px] cursor-pointer rounded-xl p-1.5 transition-colors sm:min-h-[104px] sm:p-2",
        "hover:border-violet-500/30 hover:bg-violet-500/[0.04]",
        !isCurrentMonth && "opacity-40",
        today
          ? "border-violet-500/45 bg-violet-500/8 ring-1 ring-violet-500/20"
          : "",
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
        {visibleFestivals.map((festival) => (
          <div
            key={`${festival.date}-${festival.name}`}
            className="flex w-full items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-left text-[10px] font-semibold leading-tight text-rose-600 dark:text-rose-300 sm:text-[11px]"
            title={festival.name}
          >
            <Gift className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{festival.name}</span>
          </div>
        ))}
        {visible.map((event) => {
          const c = colorOf(event.color);
          const isThisDragging = draggingEventId === event.id;
          const saving = isOptimisticEvent(event);
          return (
            <button
              key={event.id}
              draggable={!saving}
              onDragStart={(e) => {
                if (saving) return;
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
                if (saving) return;
                onEventClick(event);
              }}
              className={cn(
                "flex w-full cursor-grab items-center gap-1 rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium leading-tight transition-colors hover:brightness-110 active:cursor-grabbing sm:text-[11px]",
                c.soft,
                c.text,
                saving && "cursor-default opacity-70",
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
  festivals,
  onDayClick,
  onEventClick,
  onEventMove,
}: {
  cursor: Date;
  events: Event[];
  festivals: FestivalHoliday[];
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
        const dayFestivals = festivals.filter((f) => festivalOnDay(f, day));
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
              "dashboard-row relative flex min-h-[150px] cursor-pointer flex-col rounded-2xl p-3 transition-colors hover:border-violet-500/30 hover:bg-violet-500/[0.04]",
              today && "border-violet-500/45 bg-violet-500/8 ring-1 ring-violet-500/20",
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
              {dayFestivals.map((festival) => (
                <div
                  key={`${festival.date}-${festival.name}`}
                  className="flex w-full items-center gap-1.5 rounded-lg bg-rose-500/10 px-2 py-1.5 text-left text-xs font-semibold text-rose-600 dark:text-rose-300"
                  title={festival.name}
                >
                  <Gift className="h-3 w-3 shrink-0" />
                  <span className="truncate">{festival.name}</span>
                </div>
              ))}
              {dayEvents.length === 0 && dayFestivals.length === 0 ? (
                <div className="text-[10px] text-muted-foreground/50 italic mt-1">
                  No events
                </div>
              ) : (
                dayEvents.map((event) => {
                  const c = colorOf(event.color);
                  const isThisDragging = draggingEventId === event.id;
                  const saving = isOptimisticEvent(event);
                  return (
                    <button
                      key={event.id}
                      draggable={!saving}
                      onDragStart={(e) => {
                        if (saving) return;
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
                        if (saving) return;
                        onEventClick(event);
                      }}
                      className={cn(
                        "flex w-full cursor-grab flex-col gap-0.5 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:brightness-110 active:cursor-grabbing",
                        c.soft,
                        saving && "cursor-default opacity-70",
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
  festivals,
  onAdd,
  onEventClick,
}: {
  cursor: Date;
  events: Event[];
  festivals: FestivalHoliday[];
  onAdd: (day: Date) => void;
  onEventClick: (event: Event) => void;
}) {
  const dayEvents = useMemo(
    () => events.filter((e) => eventOnDay(e, cursor)),
    [events, cursor]
  );
  const dayFestivals = useMemo(
    () => festivals.filter((f) => festivalOnDay(f, cursor)),
    [festivals, cursor]
  );
  const today = isToday(cursor);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-14 w-14 flex-col items-center justify-center rounded-lg",
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
              {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""} and{" "}
              {dayFestivals.length} festival{dayFestivals.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAdd(cursor)}
          className="rounded-lg border-border/70 bg-background/85 shadow-sm dark:border-border/60 dark:bg-background/60"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {dayEvents.length === 0 && dayFestivals.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing scheduled"
          description="You have a free day. Add an event to make the most of it."
          action={
            <Button
              size="sm"
              onClick={() => onAdd(cursor)}
              className="accent-gradient rounded-lg text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Event
            </Button>
          }
          className="py-12"
        />
      ) : (
        <div className="space-y-2">
          {dayFestivals.map((festival, i) => (
            <FestivalDayRow
              key={`${festival.date}-${festival.name}`}
              festival={festival}
              index={i}
            />
          ))}
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
  const saving = isOptimisticEvent(event);
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      onClick={() => {
        if (!saving) onClick();
      }}
      className={cn(
        "dashboard-row group flex w-full items-start gap-3 p-3 text-left transition-colors hover:border-violet-500/30 hover:bg-violet-500/[0.04]",
        saving && "cursor-default opacity-70"
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
          {saving && (
            <Badge
              variant="secondary"
              className="rounded-md h-5 px-1.5 text-[10px] bg-violet-500/10 text-violet-600 dark:text-violet-400"
            >
              Saving
            </Badge>
          )}
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

function FestivalDayRow({
  festival,
  index,
}: {
  festival: FestivalHoliday;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="dashboard-row flex w-full items-start gap-3 border-rose-500/25 bg-rose-500/[0.04] p-3 text-left"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-300">
        <Gift className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-sm font-semibold">{festival.name}</h4>
          <Badge
            variant="secondary"
            className="h-5 rounded-md bg-rose-500/10 px-1.5 text-[10px] text-rose-600 dark:text-rose-300"
          >
            Festival
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {festival.localName || festival.type}
        </p>
      </div>
    </motion.div>
  );
}

// ---------- Upcoming item ----------
function FestivalUpcomingItem({
  festival,
  index,
}: {
  festival: FestivalHoliday;
  index: number;
}) {
  let dateStr = festival.date;
  try {
    dateStr = format(parseISO(festival.date), "EEE, MMM d");
  } catch {
    // keep raw date
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="dashboard-row flex w-full items-start gap-3 border-rose-500/20 bg-rose-500/[0.035] p-3"
    >
      <span className="dashboard-icon-tile bg-rose-500/12 text-rose-600 dark:text-rose-300">
        <Gift className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-semibold">{festival.name}</h4>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">{dateStr}</span>
          <span className="text-[11px] text-muted-foreground/50">·</span>
          <span className="text-[11px] font-medium text-rose-600 dark:text-rose-300">
            {festival.type}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

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
  const saving = isOptimisticEvent(event);
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
      onClick={() => {
        if (!saving) onClick();
      }}
      className={cn(
        "dashboard-row group flex w-full items-start gap-3 p-3 text-left transition-colors hover:border-violet-500/30 hover:bg-violet-500/[0.04]",
        saving && "cursor-default opacity-70"
      )}
    >
      <span
        className={cn(
          "dashboard-icon-tile",
          c.soft
        )}
      >
        <span className={cn("h-2.5 w-2.5 rounded-full", c.dot)} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="min-w-0 flex-1 truncate text-sm font-semibold">
            {event.title}
          </h4>
          {saving && (
            <Badge
              variant="secondary"
              className="h-5 rounded-md px-1.5 text-[10px] bg-violet-500/10 text-violet-600 dark:text-violet-400"
            >
              Saving
            </Badge>
          )}
        </div>
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
  festivals,
  onOpenChange,
  onAdd,
  onEdit,
  onDelete,
}: {
  date: Date | null;
  events: Event[];
  festivals: FestivalHoliday[];
  onOpenChange: (open: boolean) => void;
  onAdd: (day: Date) => void;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
}) {
  return (
    <Dialog open={!!date} onOpenChange={onOpenChange}>
      <DialogContent className="dashboard-surface max-h-[90vh] overflow-y-auto rounded-lg p-0 shadow-2xl shadow-slate-950/15 sm:max-w-[500px]">
        <div className="border-b border-border/60 p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="dashboard-icon-tile dashboard-theme-glow-text">
                <CalendarDays className="h-4 w-4" />
              </span>
              {date ? format(date, "EEEE, MMMM d") : ""}
            </DialogTitle>
            <DialogDescription>
              {events.length === 0
                ? festivals.length === 0
                  ? "No events scheduled. Click below to add one."
                  : `${festivals.length} festival${festivals.length !== 1 ? "s" : ""} on this day.`
                : `${events.length} event${events.length !== 1 ? "s" : ""} and ${festivals.length} festival${festivals.length !== 1 ? "s" : ""} on this day.`}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto p-4 pr-5 scrollbar-thin sm:p-5">
          {events.length === 0 && festivals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Free day!</p>
            </div>
          ) : (
            <>
            {festivals.map((festival) => (
              <FestivalDayRow
                key={`${festival.date}-${festival.name}`}
                festival={festival}
                index={0}
              />
            ))}
            {events.map((event) => {
              const c = colorOf(event.color);
              return (
                <div
                  key={event.id}
                  className="dashboard-row group flex items-start gap-3 p-3"
                >
                  <span
                    className={cn(
                      "dashboard-icon-tile",
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
            })}
            </>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 bg-background/55 p-4 sm:p-5">
          <Button
            onClick={() => date && onAdd(date)}
            className="w-full rounded-lg accent-gradient text-white sm:w-auto"
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
      <DialogContent
        className={FORM_DIALOG_CLASS}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="border-b border-border/60 p-4 sm:p-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-3 text-xl tracking-tight">
              <span className="dashboard-icon-tile dashboard-theme-glow-text">
                {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </span>
              {isEdit ? "Edit Event" : "New Event"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {isEdit
                ? "Update the details of your event below."
                : "Add a new event to your calendar."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4 sm:p-5">
          {/* Title */}
          <div className={FORM_SECTION_CLASS}>
            <Label htmlFor="event-title" className={FORM_LABEL_CLASS}>
              Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="event-title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Calculus midterm review"
              className={cn(
                FORM_FIELD_CLASS,
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
            <div className={FORM_SECTION_CLASS}>
              <Label htmlFor="event-date" className={FORM_LABEL_CLASS}>
                Date <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="event-date"
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className={cn(
                  FORM_FIELD_CLASS,
                  error && !form.date && "border-rose-500"
                )}
              />
            </div>
            <div className={FORM_SECTION_CLASS}>
              <Label htmlFor="event-time" className={FORM_LABEL_CLASS}>
                Time
              </Label>
              <Input
                id="event-time"
                type="time"
                value={form.time}
                onChange={(e) => update("time", e.target.value)}
                className={FORM_FIELD_CLASS}
              />
            </div>
          </div>

          {/* Description */}
          <div className={FORM_SECTION_CLASS}>
            <Label htmlFor="event-desc" className={FORM_LABEL_CLASS}>
              Description
            </Label>
            <Textarea
              id="event-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Add notes or details (optional)"
              rows={3}
              className={cn(FORM_FIELD_CLASS, "resize-none scrollbar-thin")}
            />
          </div>

          {/* Color picker */}
          <div className={FORM_SECTION_CLASS}>
            <Label className={FORM_LABEL_CLASS}>Color</Label>
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
                      "relative h-9 w-9 rounded-lg shadow-sm transition-transform",
                      "hover:scale-105",
                      selected && "scale-105 ring-2 ring-offset-2 ring-offset-background",
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

        <DialogFooter className="gap-2 border-t border-border/60 bg-background/55 p-4 sm:p-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-lg border-border/70 bg-background/85 px-4 shadow-sm hover:bg-muted/60 dark:border-border/60 dark:bg-background/60"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !form.title.trim() || !form.date}
            className="h-10 min-w-[120px] rounded-lg accent-gradient px-4 text-white shadow-md shadow-violet-500/20"
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
          <Skeleton className="h-14 w-14 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
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
