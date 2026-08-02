"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  Play,
  Pause,
  Coffee,
  Droplets,
  RotateCcw,
  SkipForward,
  Sparkles,
  Brain,
  CalendarDays,
  Flame,
  Clock,
  History,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  Plus,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDistanceToNow, isToday, isThisWeek, isThisMonth, subDays, format, startOfDay } from "date-fns";

import { apiFetch, handleError } from "@/lib/api";
import { readPageCache, writePageCache } from "@/lib/page-cache";
import { FocusSession } from "@/lib/types";
import { type FocusTimerMode, useAppStore } from "@/lib/store";
import {
  PageTransition,
} from "@/components/shared/motion";
import { Skeleton, EmptyState } from "@/components/shared/feedback";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TimerMode = FocusTimerMode;

// === Pomodoro completion bell (Web Audio API, no external files) ===
// Lazily creates an AudioContext on first user interaction (the timer is started by a
// click, which satisfies the browser autoplay policy). All calls are wrapped in
// try/catch so the timer never breaks if AudioContext is unavailable.
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  start: number,
  dur: number,
  ctx: AudioContext,
  type: OscillatorType = "sine",
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + start;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** Play the pomodoro completion bell. `focus-end` = ascending C5–E5–G5 arpeggio; `break-end` = soft A5 chime. */
export function playBell(kind: "focus-end" | "break-end"): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (kind === "focus-end") {
      // Ascending C5–E5–G5 arpeggio
      tone(523.25, 0, 0.5, ctx);
      tone(659.25, 0.12, 0.5, ctx);
      tone(783.99, 0.24, 0.8, ctx);
    } else {
      // Single soft A5 chime
      tone(880, 0, 1.2, ctx, "triangle");
    }
  } catch {
    /* ignore audio errors — never break the timer */
  }
}

/** Play a sample bell (used by the sound toggle to confirm sound is on). */
export function playTestBell(): void {
  playBell("focus-end");
}

// Rotating wellness tips shown during break modes (cycles every ~8s).
const BREAK_TIPS: string[] = [
  "Close your eyes and take 3 deep breaths.",
  "Stand up and walk to a window — look at something far away.",
  "Roll your wrists and stretch your fingers.",
  "Drink a sip of water.",
  "Rest your back against the chair and relax your shoulders.",
];

interface ModeConfig {
  label: string;
  defaultMinutes: number;
  presets: number[];
  accent: string;
  ringFrom: string;
  ringTo: string;
  glow: string;
}

const MODE_CONFIG: Record<TimerMode, ModeConfig> = {
  focus: {
    label: "Focus",
    defaultMinutes: 25,
    presets: [15, 25, 45, 60],
    accent: "#8b5cf6",
    ringFrom: "#8b5cf6",
    ringTo: "#d946ef",
    glow: "shadow-violet-500/30",
  },
  short: {
    label: "Short Break",
    defaultMinutes: 5,
    presets: [3, 5, 10, 15],
    accent: "#06b6d4",
    ringFrom: "#22d3ee",
    ringTo: "#06b6d4",
    glow: "shadow-cyan-500/30",
  },
  long: {
    label: "Long Break",
    defaultMinutes: 15,
    presets: [10, 15, 20, 30],
    accent: "#f43f5e",
    ringFrom: "#fb7185",
    ringTo: "#f43f5e",
    glow: "shadow-rose-500/30",
  },
};

// === Timer ring geometry ===
const RADIUS = 132;
const STROKE = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// === Small chart tooltip ===
interface FocusTooltipPayload {
  name?: string | number;
  value?: number | string;
  color?: string;
}

interface FocusChartTooltipProps {
  active?: boolean;
  payload?: FocusTooltipPayload[];
  label?: string | number;
}

function ChartTooltip({ active, payload, label }: FocusChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold mb-0.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">
          {p.name}: <span className="font-medium text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function FocusTimerPage() {
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const userId = useAppStore((s) => s.user?.id);
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const setSoundEnabled = useAppStore((s) => s.setSoundEnabled);
  const mode = useAppStore((s) => s.focusTimerMode);
  const durations = useAppStore((s) => s.focusTimerDurations);
  const remaining = useAppStore((s) => s.focusTimerRemaining);
  const isRunning = useAppStore((s) => s.focusTimerRunning);
  const subject = useAppStore((s) => s.focusTimerSubject);
  const autoBreak = useAppStore((s) => s.focusTimerAutoBreak);
  const completedFocusCount = useAppStore((s) => s.focusTimerCompletedCount);
  const cycleId = useAppStore((s) => s.focusTimerCycleId);
  const handledCycleId = useAppStore((s) => s.focusTimerHandledCycleId);
  const syncFocusTimer = useAppStore((s) => s.syncFocusTimer);
  const startFocusTimer = useAppStore((s) => s.startFocusTimer);
  const pauseFocusTimer = useAppStore((s) => s.pauseFocusTimer);
  const resetFocusTimer = useAppStore((s) => s.resetFocusTimer);
  const skipFocusTimer = useAppStore((s) => s.skipFocusTimer);
  const switchFocusTimerMode = useAppStore((s) => s.switchFocusTimerMode);
  const setFocusTimerDuration = useAppStore((s) => s.setFocusTimerDuration);
  const setFocusTimerSubject = useAppStore((s) => s.setFocusTimerSubject);
  const setFocusTimerAutoBreak = useAppStore((s) => s.setFocusTimerAutoBreak);
  const incrementFocusTimerCompletedCount = useAppStore(
    (s) => s.incrementFocusTimerCompletedCount
  );
  const markFocusTimerCompletionHandled = useAppStore(
    (s) => s.markFocusTimerCompletionHandled
  );

  // === Timer state ===
  const [saving, setSaving] = useState(false);
  const [stretchDismissed, setStretchDismissed] = useState(false);
  const [hydrateDismissed, setHydrateDismissed] = useState(false);

  const [customNudges, setCustomNudges] = useState<{ id: string; title: string; body: string; icon: 'coffee' | 'droplets' | 'eye' | 'sparkles' | 'brain'; dismissed: boolean }[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("custom-nudges");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveCustomNudges = (nudges: typeof customNudges) => {
    setCustomNudges(nudges);
    localStorage.setItem("custom-nudges", JSON.stringify(nudges));
  };

  const handleAddCustomNudge = (title: string, body: string, icon: 'coffee' | 'droplets' | 'eye' | 'sparkles' | 'brain') => {
    const next = [...customNudges, { id: String(Date.now()), title, body, icon, dismissed: false }];
    saveCustomNudges(next);
  };

  const handleDismissCustomNudge = (id: string) => {
    const next = customNudges.map(n => n.id === id ? { ...n, dismissed: true } : n);
    saveCustomNudges(next);
    toast("Custom nudge dismissed");
  };

  const handleDismissAll = () => {
    setStretchDismissed(true);
    setHydrateDismissed(true);
    const next = customNudges.map(n => ({ ...n, dismissed: true }));
    saveCustomNudges(next);
    toast("All wellness nudges dismissed");
  };

  const [addNudgeOpen, setAddNudgeOpen] = useState(false);
  const [newNudgeTitle, setNewNudgeTitle] = useState("");
  const [newNudgeBody, setNewNudgeBody] = useState("");
  const [newNudgeIcon, setNewNudgeIcon] = useState<'coffee' | 'droplets' | 'eye' | 'sparkles' | 'brain'>("coffee");

  const submitNewNudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNudgeTitle.trim() || !newNudgeBody.trim()) {
      toast.error("Please fill in both title and description.");
      return;
    }
    handleAddCustomNudge(newNudgeTitle.trim(), newNudgeBody.trim(), newNudgeIcon);
    setNewNudgeTitle("");
    setNewNudgeBody("");
    setNewNudgeIcon("coffee");
    setAddNudgeOpen(false);
    toast.success("Custom nudge added!");
  };

  // === Data state ===
  const initialCache = useMemo(
    () => readPageCache<{ sessions: FocusSession[] }>("focus-timer", userId),
    [userId]
  );
  const [sessions, setSessions] = useState<FocusSession[]>(
    () => initialCache?.sessions ?? []
  );
  const [loading, setLoading] = useState(() => !initialCache);

  const totalSeconds = durations[mode] * 60;
  const progress = totalSeconds === 0 ? 0 : (totalSeconds - remaining) / totalSeconds;
  const ringOffset = CIRCUMFERENCE * (1 - progress);

  // Ref to track if a session has already been logged for the current cycle
  const loggedRef = useRef(false);

  // === Fetch sessions ===
  const fetchSessions = useCallback(async () => {
    const cached = readPageCache<{ sessions: FocusSession[] }>(
      "focus-timer",
      userId
    );
    if (cached) {
      setSessions(cached.sessions);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const data = await apiFetch<{ sessions: FocusSession[] }>("/api/focus-session");
      setSessions(data.sessions ?? []);
      writePageCache("focus-timer", userId, { sessions: data.sessions ?? [] });
    } catch (err) {
      handleError(err, "Failed to load focus sessions");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!loading) {
      writePageCache("focus-timer", userId, { sessions });
    }
  }, [loading, sessions, userId]);

  useEffect(() => {
    syncFocusTimer();
  }, [syncFocusTimer]);

  // === Tick interval ===
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(syncFocusTimer, 1000);
    return () => clearInterval(id);
  }, [isRunning, syncFocusTimer]);

  // === Handle completion ===
  useEffect(() => {
    if (remaining !== 0) return;
    if (handledCycleId === cycleId || loggedRef.current) return;
    loggedRef.current = true;
    markFocusTimerCompletionHandled();

    const finishedMode = mode;
    const elapsedMinutes = durations[finishedMode];

    // Play completion bell (Web Audio API) when sound is enabled
    if (soundEnabled) {
      playBell(finishedMode === "focus" ? "focus-end" : "break-end");
    }

    // Toast + record
    if (finishedMode === "focus") {
      toast.success("Time's up! Take a well-earned break.", {
        icon: <Coffee className="h-4 w-4" />,
      });

      incrementFocusTimerCompletedCount();
      // POST focus record
      setSaving(true);
      apiFetch<{ session: FocusSession }>("/api/focus-session", {
        method: "POST",
        body: JSON.stringify({
          duration: elapsedMinutes,
          type: "focus",
          subject: subject || "",
          completed: true,
        }),
      })
        .then(() => {
          fetchSessions();
        })
        .catch((err) => handleError(err, "Failed to save focus session"))
        .finally(() => setSaving(false));

      // Auto-break
      if (autoBreak) {
        const nextMode: TimerMode =
          (completedFocusCount + 1) % 4 === 0 ? "long" : "short";
        setTimeout(() => switchMode(nextMode, true), 600);
      }
    } else {
      toast.success("Break over — back to focus!", {
        icon: <Brain className="h-4 w-4" />,
      });

      // Log break session too (optional)
      setSaving(true);
      apiFetch<{ session: FocusSession }>("/api/focus-session", {
        method: "POST",
        body: JSON.stringify({
          duration: elapsedMinutes,
          type: "break",
          subject: subject || "",
          completed: true,
        }),
      })
        .then(() => fetchSessions())
        .catch((err) => handleError(err, "Failed to save break session"))
        .finally(() => setSaving(false));
      setTimeout(() => switchMode("focus", true), 600);
    }
  }, [
    remaining,
    soundEnabled,
    subject,
    autoBreak,
    completedFocusCount,
    cycleId,
    handledCycleId,
    durations,
    mode,
    incrementFocusTimerCompletedCount,
    markFocusTimerCompletionHandled,
  ]);

  // === Mode switching ===
  const switchMode = useCallback(
    (next: TimerMode, autoStart = false) => {
      switchFocusTimerMode(next, autoStart);
      loggedRef.current = false;
    },
    [switchFocusTimerMode]
  );

  // === Set custom duration ===
  const setDuration = (minutes: number) => {
    const safe = Math.max(1, Math.min(180, Math.round(minutes)));
    setFocusTimerDuration(safe);
    loggedRef.current = false;
  };

  // === Controls ===
  const handleStart = () => {
    loggedRef.current = false;
    startFocusTimer();
  };
  const handlePause = () => pauseFocusTimer();
  const handleReset = () => {
    resetFocusTimer();
    loggedRef.current = false;
  };
  const handleSkip = () => {
    skipFocusTimer();
  };

  // === Rotating break tip ===
  const [tipIndex, setTipIndex] = useState(0);
  useEffect(() => {
    if (mode === "focus") return;
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % BREAK_TIPS.length);
    }, 8000);
    return () => clearInterval(id);
  }, [mode]);

  // === Derived stats ===
  const stats = useMemo(() => {
    const focusSessions = sessions.filter((s) => s.type === "focus");
    const todayMin = focusSessions
      .filter((s) => isToday(new Date(s.date)))
      .reduce((sum, s) => sum + s.duration, 0);
    const weekMin = focusSessions
      .filter((s) => isThisWeek(new Date(s.date), { weekStartsOn: 1 }))
      .reduce((sum, s) => sum + s.duration, 0);
    const monthMin = focusSessions
      .filter((s) => isThisMonth(new Date(s.date)))
      .reduce((sum, s) => sum + s.duration, 0);
    return {
      todayMin,
      weekMin,
      monthMin,
      total: focusSessions.length,
    };
  }, [sessions]);

  // Last 7 days bar chart data
  const weeklyChartData = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const day = subDays(today, 6 - i);
      const next = subDays(today, 6 - i - 1);
      const minutes = sessions
        .filter((s) => {
          if (s.type !== "focus") return false;
          const d = new Date(s.date);
          return d >= day && d < next;
        })
        .reduce((sum, s) => sum + s.duration, 0);
      return {
        day: format(day, "EEE"),
        minutes,
      };
    });
  }, [sessions]);

  const recentSessions = useMemo(() => sessions.slice(0, 8), [sessions]);

  const modeCfg = MODE_CONFIG[mode];

  return (
    <PageTransition className="space-y-4">
      {/* === Header === */}
      <div className="dashboard-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="space-y-1">
          <div className="dashboard-chip dashboard-theme-glow-chip dashboard-theme-glow-text">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Deep focus, deep results</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Stay in the zone. Track deep work, take mindful breaks, and build your streak.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playTestBell();
            }}
            aria-label="Toggle sound effects"
            title={soundEnabled ? "Sound on — click to mute" : "Sound off — click to enable"}
            className="h-9 w-9 shrink-0 rounded-lg border border-border/70 bg-background/85 shadow-sm hover:bg-muted/60 dark:border-border/60 dark:bg-background/60"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>

          <Badge
            variant="secondary"
            className="dashboard-chip w-fit gap-1.5 px-3 py-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs">
              {completedFocusCount} completed this sitting
            </span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* === Main timer card === */}
        <div className="space-y-4 lg:col-span-2">
          <div className="dashboard-surface relative overflow-hidden p-5 sm:p-6">
              {/* Ambient glow for break modes (cyan for short, rose for long) */}
              {mode !== "focus" && (
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0",
                    mode === "short" ? "break-ambient" : "long-break-ambient",
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Mode tabs */}
              <div className="flex justify-center mb-3">
                <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background/85 p-1 shadow-sm dark:border-border/60 dark:bg-background/60">
                  {(Object.keys(MODE_CONFIG) as TimerMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => switchMode(m)}
                      className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:px-5 ${mode === m
                        ? "text-white"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {mode === m && (
                        <motion.div
                          layoutId="timer-mode-pill"
                          className="absolute inset-0 rounded-lg"
                          style={{
                            background: `linear-gradient(135deg, ${MODE_CONFIG[m].ringFrom}, ${MODE_CONFIG[m].ringTo})`,
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10">{MODE_CONFIG[m].label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pomodoro cycle dots (4 focus sessions → long break) */}
              <div className="flex flex-col items-center gap-1.5 mb-5">
                <div
                  className="flex items-center gap-1.5"
                  style={{ color: modeCfg.accent }}
                  aria-label={`Pomodoro cycle: ${completedFocusCount % 4 === 0 && completedFocusCount > 0 ? 4 : completedFocusCount % 4} of 4 focus sessions completed`}
                >
                  {[0, 1, 2, 3].map((i) => {
                    const inCycle = completedFocusCount % 4;
                    const allComplete = inCycle === 0 && completedFocusCount > 0;
                    let cls = "cycle-dot";
                    if (allComplete || i < inCycle) {
                      cls = "cycle-dot completed";
                    } else if (i === inCycle && mode === "focus") {
                      cls = "cycle-dot active";
                    }
                    return <span key={i} className={cls} />;
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Pomodoro cycle · Long break after 4 focus sessions
                </p>
              </div>

              {/* Timer ring */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative">
                  <svg
                    width={300}
                    height={300}
                    viewBox="0 0 300 300"
                    className="rotate-[-90deg]"
                  >
                    <defs>
                      <linearGradient
                        id={`grad-${mode}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor={modeCfg.ringFrom} />
                        <stop offset="100%" stopColor={modeCfg.ringTo} />
                      </linearGradient>
                      <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    {/* track */}
                    <circle
                      cx={150}
                      cy={150}
                      r={RADIUS}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={STROKE}
                      className="text-muted/40"
                    />
                    {/* progress */}
                    <motion.circle
                      cx={150}
                      cy={150}
                      r={RADIUS}
                      fill="none"
                      stroke={`url(#grad-${mode})`}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      strokeDasharray={CIRCUMFERENCE}
                      initial={{ strokeDashoffset: CIRCUMFERENCE }}
                      animate={{ strokeDashoffset: ringOffset }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.5,
                        ease: "easeOut",
                      }}
                      filter="url(#ring-glow)"
                    />
                  </svg>

                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                      {modeCfg.label}
                    </span>
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        key={formatTime(remaining)}
                        initial={reduceMotion ? false : { opacity: 0.6, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className="font-mono text-5xl sm:text-6xl font-bold tabular-nums tracking-tight"
                      >
                        {formatTime(remaining)}
                      </motion.div>
                    </AnimatePresence>
                    <span className="mt-2 text-xs text-muted-foreground">
                      Session {completedFocusCount + 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                    className="h-12 w-12 rounded-lg hover:bg-rose-500/10 hover:text-rose-500"
                  aria-label="Reset timer"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>

                {!isRunning ? (
                  <motion.button
                    onClick={handleStart}
                    disabled={saving}
                    className="flex h-16 w-16 items-center justify-center rounded-lg text-white shadow-xl disabled:opacity-70"
                    style={{
                      background: `linear-gradient(135deg, ${modeCfg.ringFrom}, ${modeCfg.ringTo})`,
                      boxShadow: `0 12px 30px -8px ${modeCfg.accent}80`,
                    }}
                    aria-label="Start timer"
                  >
                    <Play className="h-7 w-7 ml-1 fill-white" />
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handlePause}
                    className="flex h-16 w-16 items-center justify-center rounded-lg text-white shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${modeCfg.ringFrom}, ${modeCfg.ringTo})`,
                      boxShadow: `0 12px 30px -8px ${modeCfg.accent}80`,
                    }}
                    aria-label="Pause timer"
                  >
                    <Pause className="h-7 w-7" />
                  </motion.button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkip}
                  className="h-12 w-12 rounded-lg hover:bg-violet-500/10 hover:text-violet-500"
                  aria-label="Skip to next"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              {/* Status line */}
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {isRunning
                  ? `Running · ${subject || "No subject"}`
                  : remaining === totalSeconds
                    ? "Ready to start"
                    : "Paused"}
              </p>

              {/* Divider */}
              <div className="my-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Custom time presets */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 text-center">
                  Duration ({modeCfg.label})
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {modeCfg.presets.map((p) => (
                    <button
                      key={p}
                      onClick={() => setDuration(p)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${durations[mode] === p
                        ? "border-transparent text-white shadow"
                        : "border-border bg-background/60 hover:bg-accent text-muted-foreground"
                        }`}
                      style={
                        durations[mode] === p
                          ? {
                            background: `linear-gradient(135deg, ${modeCfg.ringFrom}, ${modeCfg.ringTo})`,
                          }
                          : undefined
                      }
                    >
                      {p}m
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-1">
                    <Input
                      type="number"
                      min={1}
                      max={180}
                      value={durations[mode]}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v)) setDuration(v);
                      }}
                      className="h-8 w-16 rounded-lg border-border/70 bg-background/85 text-center text-xs shadow-sm dark:border-border/60 dark:bg-background/60"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
              </div>

              {/* Subject + auto break */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Subject tag (optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={subject}
                    onChange={(e) => setFocusTimerSubject(e.target.value)}
                    className="rounded-lg border-border/70 bg-background/85 shadow-sm dark:border-border/60 dark:bg-background/60"
                  />
                </div>
                <div className="flex items-end">
                  <div className="dashboard-row flex w-full items-center justify-between px-3 py-2.5">
                    <div>
                      <p className="text-xs font-medium">Auto start break</p>
                      <p className="text-[11px] text-muted-foreground">
                        Switch automatically when focus ends
                      </p>
                    </div>
                    <Switch
                      checked={autoBreak}
                      onCheckedChange={setFocusTimerAutoBreak}
                    />
                  </div>
                </div>
              </div>
          </div>

          {/* === Break reminders === */}
          {(!stretchDismissed || !hydrateDismissed || customNudges.some(n => !n.dismissed) || mode !== "focus") && (
            <div className="dashboard-surface p-4 sm:p-5">
                {(!stretchDismissed || !hydrateDismissed || customNudges.some(n => !n.dismissed)) && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-500" />
                        <h3 className="text-sm font-semibold">Wellness nudges</h3>
                      </div>
                      <button
                        onClick={handleDismissAll}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {!stretchDismissed && (
                        <ReminderCard
                          icon={Coffee}
                          title="Stretch break"
                          body="Stand up, roll your shoulders, reach for the sky. Hold for 30 seconds."
                          accent="from-amber-400/20 to-orange-400/10"
                          iconColor="text-amber-500"
                          onDismiss={() => {
                            setStretchDismissed(true);
                            toast("Stretch reminder dismissed");
                          }}
                        />
                      )}
                      {!hydrateDismissed && (
                        <ReminderCard
                          icon={Droplets}
                          title="Hydrate"
                          body="Drink a glass of water. Your brain works best when hydrated."
                          accent="from-cyan-400/20 to-sky-400/10"
                          iconColor="text-cyan-500"
                          onDismiss={() => {
                            setHydrateDismissed(true);
                            toast("Hydration reminder dismissed");
                          }}
                        />
                      )}
                      {customNudges.filter(n => !n.dismissed).map(n => {
                        const Icon = n.icon === 'coffee' ? Coffee : n.icon === 'droplets' ? Droplets : n.icon === 'eye' ? Eye : n.icon === 'sparkles' ? Sparkles : Brain;
                        const accent = n.icon === 'coffee' ? "from-amber-400/20 to-orange-400/10" : n.icon === 'droplets' ? "from-cyan-400/20 to-sky-400/10" : n.icon === 'eye' ? "from-emerald-400/20 to-teal-400/10" : n.icon === 'sparkles' ? "from-fuchsia-400/20 to-pink-400/10" : "from-violet-400/20 to-purple-400/10";
                        const iconColor = n.icon === 'coffee' ? "text-amber-500" : n.icon === 'droplets' ? "text-cyan-500" : n.icon === 'eye' ? "text-emerald-500" : n.icon === 'sparkles' ? "text-fuchsia-500" : "text-violet-500";
                        return (
                          <ReminderCard
                            key={n.id}
                            icon={Icon}
                            title={n.title}
                            body={n.body}
                            accent={accent}
                            iconColor={iconColor}
                            onDismiss={() => handleDismissCustomNudge(n.id)}
                          />
                        );
                      })}
                      <button
                        onClick={() => setAddNudgeOpen(true)}
                        className="dashboard-row flex min-h-[96px] flex-col items-center justify-center gap-1.5 border-dashed p-4 transition-colors hover:border-violet-500/40 hover:bg-violet-500/[0.03]"
                      >
                        <Plus className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">Add custom nudge</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Rotating break tip — only shown during break modes */}
                <AnimatePresence>
                  {mode !== "focus" && (
                    <motion.div
                      initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className={cn(!stretchDismissed || !hydrateDismissed ? "mt-3" : "")}
                    >
                      <div className="dashboard-row bg-gradient-to-br from-violet-400/10 to-fuchsia-400/5 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-violet-500" />
                            <p className="text-xs font-semibold">Break tip · rotating</p>
                          </div>
                          <div
                            className="flex items-end gap-0.5 h-4"
                            style={{ color: modeCfg.accent }}
                            aria-hidden="true"
                          >
                            <span className="sound-wave-bar" style={{ animationDelay: "0ms" }} />
                            <span className="sound-wave-bar" style={{ animationDelay: "150ms" }} />
                            <span className="sound-wave-bar" style={{ animationDelay: "300ms" }} />
                            <span className="sound-wave-bar" style={{ animationDelay: "450ms" }} />
                          </div>
                        </div>
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={tipIndex}
                            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                            transition={{ duration: 0.25 }}
                            className="text-sm text-foreground/90 leading-relaxed"
                            aria-live="polite"
                          >
                            {BREAK_TIPS[tipIndex]}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          )}
        </div>

        {/* === Right column: stats + recent === */}
        <div className="space-y-4">
          <div className="dashboard-surface p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-semibold">Focus statistics</h3>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <StatBox
                    label="Today"
                    value={stats.todayMin}
                    suffix="m"
                    icon={Clock}
                    color="text-violet-500"
                  />
                  <StatBox
                    label="This week"
                    value={Math.round(stats.weekMin / 60 * 10) / 10}
                    decimals={1}
                    suffix="h"
                    icon={CalendarDays}
                    color="text-fuchsia-500"
                  />
                  <StatBox
                    label="This month"
                    value={Math.round(stats.monthMin / 60 * 10) / 10}
                    decimals={1}
                    suffix="h"
                    icon={CalendarDays}
                    color="text-rose-500"
                  />
                  <StatBox
                    label="Total sessions"
                    value={stats.total}
                    icon={CheckCircle2}
                    color="text-emerald-500"
                  />
                </div>
              )}

              {/* 7-day chart */}
              <div className="mt-5">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Last 7 days (minutes)
                </p>
                <div className="h-32 -mx-2">
                  {loading ? (
                    <Skeleton className="h-full w-full rounded-xl" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyChartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="barFocus" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#d946ef" stopOpacity={0.5} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                        <XAxis
                          dataKey="day"
                          tickLine={false}
                          axisLine={false}
                          className="text-[10px] fill-muted-foreground"
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(139,92,246,0.08)" }}
                          content={<ChartTooltip />}
                        />
                        <Bar
                          dataKey="minutes"
                          fill="url(#barFocus)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
          </div>

          {/* Recent sessions */}
          <div className="dashboard-surface p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-violet-500" />
                  <h3 className="text-sm font-semibold">Recent sessions</h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  {sessions.length} total
                </span>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : recentSessions.length === 0 ? (
                <EmptyState
                  icon={Timer}
                  title="No sessions yet"
                  description="Start your first focus session to see it here."
                  className="py-8"
                />
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto scrollbar-thin pr-1">
                  {recentSessions.map((s, i) => (
                    <SessionRow key={s.id ?? i} session={s} />
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
      {/* Add Custom Nudge Dialog */}
      <Dialog open={addNudgeOpen} onOpenChange={setAddNudgeOpen}>
        <DialogContent className="dashboard-surface max-w-sm rounded-lg border-border/70 p-0 shadow-2xl shadow-slate-950/20 dark:border-border/45">
          <div className="border-b border-border/60 p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="dashboard-icon-tile dashboard-theme-glow-text">
                <Sparkles className="h-4 w-4" />
              </span>
              Add Wellness Nudge
            </DialogTitle>
            <DialogDescription>
              Create a custom reminder to help you stay mindful and healthy during your studies.
            </DialogDescription>
          </DialogHeader>
          </div>
          <form onSubmit={submitNewNudge} className="space-y-3 p-4 sm:p-5">
            <div className="dashboard-row space-y-1.5 p-3">
              <Label htmlFor="nudge-title">Reminder Title</Label>
              <Input
                id="nudge-title"
                placeholder="e.g. Rest Eyes"
                value={newNudgeTitle}
                onChange={(e) => setNewNudgeTitle(e.target.value)}
                maxLength={40}
              />
            </div>
            <div className="dashboard-row space-y-1.5 p-3">
              <Label htmlFor="nudge-body">Instructions / Details</Label>
              <Input
                id="nudge-body"
                placeholder="e.g. Look at something 20 feet away for 20 seconds."
                value={newNudgeBody}
                onChange={(e) => setNewNudgeBody(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="dashboard-row space-y-1.5 p-3">
              <Label>Icon / Theme</Label>
              <div className="grid grid-cols-5 gap-2 pt-1">
                {(['coffee', 'droplets', 'eye', 'sparkles', 'brain'] as const).map((ic) => {
                  const Icon = ic === 'coffee' ? Coffee : ic === 'droplets' ? Droplets : ic === 'eye' ? Eye : ic === 'sparkles' ? Sparkles : Brain;
                  const activeColor = ic === 'coffee' ? "bg-amber-500/20 text-amber-500 border-amber-500/40" : ic === 'droplets' ? "bg-cyan-500/20 text-cyan-500 border-cyan-500/40" : ic === 'eye' ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/40" : ic === 'sparkles' ? "bg-fuchsia-500/20 text-fuchsia-500 border-fuchsia-500/40" : "bg-violet-500/20 text-violet-500 border-violet-500/40";
                  return (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNewNudgeIcon(ic)}
                      className={cn(
                        "flex items-center justify-center rounded-lg border border-border p-2.5 transition-colors hover:bg-muted",
                        newNudgeIcon === ic ? activeColor : "bg-background"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </button>
                  );
                })}
              </div>
            </div>
            <DialogFooter className="gap-2 border-t border-border/60 bg-background/55 p-4 sm:p-5">
              <Button type="button" variant="outline" onClick={() => setAddNudgeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-lg accent-gradient text-white shadow-md shadow-violet-500/20">
                Add nudge
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

// === Sub-components ===

function ReminderCard({
  icon: Icon,
  title,
  body,
  accent,
  iconColor,
  onDismiss,
}: {
  icon: typeof Coffee;
  title: string;
  body: string;
  accent: string;
  iconColor: string;
  onDismiss: () => void;
}) {
  return (
    <div className={`dashboard-row relative bg-gradient-to-br ${accent} p-4`}>
      <button
        onClick={onDismiss}
        className="absolute right-2 top-2 text-muted-foreground/60 hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/70">
          <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  suffix = "",
  decimals = 0,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  icon: typeof Clock;
  color: string;
}) {
  return (
    <div className="dashboard-row p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${color}`} />
      </div>
      <div className="text-xl font-bold tabular-nums">
        <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
      </div>
    </div>
  );
}

function SessionRow({ session }: { session: FocusSession }) {
  const isFocus = session.type === "focus";
  const Icon = isFocus ? Brain : Coffee;
  const date = new Date(session.createdAt || session.date);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="dashboard-row flex items-center gap-3 p-2 transition-colors hover:border-violet-500/30 hover:bg-violet-500/[0.03]"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isFocus
          ? "bg-violet-500/10 text-violet-500"
          : "bg-cyan-500/10 text-cyan-500"
          }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {session.subject || (isFocus ? "Focus session" : "Break")}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {isFocus ? "Focus" : "Break"} · {formatDistanceToNow(date, { addSuffix: true })}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold tabular-nums">{session.duration}m</p>
        {session.completed && (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-auto" />
        )}
      </div>
    </motion.div>
  );
}
