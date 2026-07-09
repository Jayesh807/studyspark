"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Flame, X, Clock, TrendingUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { FocusSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/shared/motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addDays, format, formatDistanceToNow, isSameDay, parseISO, startOfWeek, subDays } from "date-fns";

interface DayCell {
  date: Date;
  minutes: number;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

const WEEKS = 17; // ~4 months
const DAYS_PER_WEEK = 7;

function levelFor(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 25) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

const LEVEL_BG = [
  "bg-muted/60 dark:bg-white/5",
  "bg-violet-500/25 dark:bg-violet-400/25",
  "bg-violet-500/50 dark:bg-violet-400/50",
  "bg-violet-500/75 dark:bg-violet-400/75",
  "bg-violet-500 dark:bg-violet-400",
];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["", "M", "", "W", "", "F", ""];

export function ContributionHeatmap() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<DayCell | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayCell | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{ sessions: FocusSession[] }>("/api/focus-session");
        setSessions((data.sessions ?? []).filter((s) => s.type === "focus"));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Sessions for the selected day (for the detail dialog)
  const selectedDaySessions = useMemo(() => {
    if (!selectedDay) return [];
    return sessions
      .filter((s) => {
        try {
          return isSameDay(parseISO(s.date), selectedDay.date);
        } catch {
          return false;
        }
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [selectedDay, sessions]);

  // Build grid: weeks (columns) x 7 days (rows), ending today
  const grid = useMemo<{ weeks: DayCell[][]; totalMinutes: number; activeDays: number; maxDay: DayCell | null }>(() => {
    // Map sessions by date string
    const byDay = new Map<string, { minutes: number; count: number }>();
    for (const s of sessions) {
      try {
        const d = parseISO(s.date);
        const key = format(d, "yyyy-MM-dd");
        const prev = byDay.get(key) ?? { minutes: 0, count: 0 };
        prev.minutes += s.duration;
        prev.count += 1;
        byDay.set(key, prev);
      } catch {
        // ignore bad date
      }
    }

    // Start from the Sunday of (WEEKS-1) weeks ago, end today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const gridStart = startOfWeek(subDays(today, (WEEKS - 1) * 7), { weekStartsOn: 0 });

    const weeks: DayCell[][] = [];
    let totalMinutes = 0;
    let activeDays = 0;
    let maxDay: DayCell | null = null;

    for (let w = 0; w < WEEKS; w++) {
      const week: DayCell[] = [];
      for (let d = 0; d < DAYS_PER_WEEK; d++) {
        const date = addDays(gridStart, w * 7 + d);
        const key = format(date, "yyyy-MM-dd");
        const entry = byDay.get(key);
        const minutes = entry?.minutes ?? 0;
        const count = entry?.count ?? 0;
        const cell: DayCell = { date, minutes, count, level: levelFor(minutes) };
        week.push(cell);
        totalMinutes += minutes;
        if (minutes > 0) activeDays += 1;
        if (!maxDay || minutes > maxDay.minutes) maxDay = cell;
      }
      weeks.push(week);
    }

    return { weeks, totalMinutes, activeDays, maxDay };
  }, [sessions]);

  // Current streak (consecutive days with activity up to today)
  const currentStreak = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let cursor = today;
    for (let i = 0; i < WEEKS * 7; i++) {
      const key = format(cursor, "yyyy-MM-dd");
      const entry = sessions.find((s) => {
        try {
          return isSameDay(parseISO(s.date), cursor);
        } catch {
          return false;
        }
      });
      if (entry) {
        streak += 1;
        cursor = subDays(cursor, 1);
      } else {
        // Allow today to be empty without breaking streak
        if (i === 0) {
          cursor = subDays(cursor, 1);
          continue;
        }
        break;
      }
    }
    return streak;
  }, [sessions]);

  // Month labels positioned above week columns
  const monthLabels = useMemo(() => {
    const labels: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;
    grid.weeks.forEach((week, wi) => {
      const firstDay = week[0]?.date;
      if (!firstDay) return;
      const m = firstDay.getMonth();
      if (m !== lastMonth) {
        labels.push({ weekIndex: wi, label: MONTH_LABELS[m] });
        lastMonth = m;
      }
    });
    return labels;
  }, [grid.weeks]);

  return (
    <GlassCard className="p-5 sm:p-6 relative overflow-hidden">
      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold tracking-tight">Study Activity</h3>
            <p className="text-xs text-muted-foreground">
              Last {WEEKS} weeks of focus sessions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Total focus
            </p>
            <p className="text-sm font-bold tabular-nums">
              {Math.floor(grid.totalMinutes / 60)}h {grid.totalMinutes % 60}m
            </p>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Active days
            </p>
            <p className="text-sm font-bold tabular-nums">{grid.activeDays}</p>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-end">
              <Flame className="h-3 w-3 text-amber-500" />
              Streak
            </p>
            <p className="text-sm font-bold tabular-nums">{currentStreak}d</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="mb-3 text-3xl"
          >
            📈
          </motion.div>
          <p className="text-sm font-medium">No focus sessions yet</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            Complete a Pomodoro focus session to start filling in your activity heatmap.
          </p>
        </div>
      ) : (
        <TooltipProvider delayDuration={0}>
          <div className="relative overflow-x-auto scrollbar-thin">
            {/* Month labels row */}
            <div className="flex pl-7 mb-1.5 relative h-4">
              {monthLabels.map((m) => (
                <span
                  key={`${m.weekIndex}-${m.label}`}
                  className="absolute text-[10px] font-medium text-muted-foreground"
                  style={{ left: `calc(1.75rem + ${m.weekIndex} * 15px)` }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            <div className="flex gap-1">
              {/* Day labels column */}
              <div className="flex flex-col gap-1 pr-1">
                {DAY_LABELS.map((d, i) => (
                  <span
                    key={i}
                    className="h-3 w-4 text-[9px] leading-3 text-muted-foreground/70"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Weeks grid */}
              <div className="flex gap-1">
                {grid.weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1">
                    {week.map((cell, di) => {
                      const isFuture = cell.date.getTime() > Date.now();
                      const isToday = isSameDay(cell.date, new Date());
                      const hasActivity = cell.minutes > 0;
                      return (
                        <Tooltip key={`${wi}-${di}`}>
                          <TooltipTrigger asChild>
                            <motion.button
                              type="button"
                              disabled={isFuture || !hasActivity}
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                duration: 0.2,
                                delay: (wi * 7 + di) * 0.003,
                                ease: "easeOut",
                              }}
                              onMouseEnter={() => setHovered(cell)}
                              onMouseLeave={() => setHovered(null)}
                              onClick={() => hasActivity && setSelectedDay(cell)}
                              aria-label={`${format(cell.date, "EEE, MMM d")}: ${cell.minutes} minutes, ${cell.count} session${cell.count === 1 ? "" : "s"}`}
                              className={cn(
                                "heat-cell h-3 w-3 rounded-sm transition-all",
                                LEVEL_BG[cell.level],
                                hasActivity && !isFuture && "hover:scale-125 hover:ring-2 hover:ring-violet-500/50 cursor-pointer",
                                cell.level === 0 && !isFuture && "hover:bg-violet-500/20",
                                isToday && "heatmap-today ring-1 ring-violet-500 ring-offset-1 ring-offset-background",
                                isFuture && "opacity-30 cursor-not-allowed",
                                !hasActivity && !isFuture && "cursor-default"
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-semibold">
                              {cell.minutes > 0
                                ? `${cell.minutes} min · ${cell.count} session${cell.count === 1 ? "" : "s"}`
                                : "No activity"}
                            </p>
                            <p className="text-muted-foreground">
                              {format(cell.date, "EEE, MMM d, yyyy")}
                            </p>
                            {hasActivity && (
                              <p className="text-violet-400 text-[10px] mt-0.5">
                                Click to view details
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>Less</span>
                {LEVEL_BG.map((bg, i) => (
                  <span
                    key={i}
                    className={cn("h-3 w-3 rounded-sm", bg)}
                  />
                ))}
                <span>More</span>
              </div>
              {hovered && hovered.minutes > 0 && (
                <motion.span
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-muted-foreground"
                >
                  {format(hovered.date, "MMM d")}: {hovered.minutes}m
                </motion.span>
              )}
            </div>
          </div>
        </TooltipProvider>
      )}

      {/* Day detail dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                <Clock className="h-4 w-4" />
              </span>
              {selectedDay && format(selectedDay.date, "EEEE, MMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          {selectedDay && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Minutes</p>
                  <p className="text-lg font-bold tabular-nums text-violet-600 dark:text-violet-400">
                    {selectedDay.minutes}
                  </p>
                </div>
                <div className="text-center border-x border-border/60">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sessions</p>
                  <p className="text-lg font-bold tabular-nums">
                    {selectedDay.count}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg</p>
                  <p className="text-lg font-bold tabular-nums">
                    {selectedDay.count > 0 ? Math.round(selectedDay.minutes / selectedDay.count) : 0}m
                  </p>
                </div>
              </div>

              {/* Session list */}
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                <AnimatePresence mode="popLayout">
                  {selectedDaySessions.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/50 p-2.5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                        <TrendingUp className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">
                          {s.subject || "Focus session"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.duration} min · {(() => {
                            try {
                              return formatDistanceToNow(parseISO(s.createdAt), { addSuffix: true });
                            } catch {
                              return "";
                            }
                          })()}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
                        {s.duration}m
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}
