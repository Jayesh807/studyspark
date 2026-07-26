"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock, Coffee, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/motion";

type TimerMode = "work" | "shortBreak" | "longBreak";

const MODE_PRESETS: Record<TimerMode, { label: string; duration: number }> = {
  work: { label: "Focus Session", duration: 25 * 60 },
  shortBreak: { label: "Short Break", duration: 5 * 60 },
  longBreak: { label: "Long Break", duration: 15 * 60 },
};

export function PomodoroTimerClient() {
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState<number>(MODE_PRESETS.work.duration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setMode(newMode);
    setTimeLeft(MODE_PRESETS[newMode].duration);
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setIsRunning(false);
            if (mode === "work") {
              setCompletedSessions((c) => c + 1);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODE_PRESETS[mode].duration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentDuration = MODE_PRESETS[mode].duration;
  const progressPercent = ((currentDuration - timeLeft) / currentDuration) * 100;

  return (
    <GlassCard className="p-6 sm:p-10 border-violet-500/15 shadow-2xl max-w-xl mx-auto text-center">
      {/* Mode Selectors */}
      <div className="flex items-center justify-center gap-2 mb-8 bg-muted/40 p-1.5 rounded-2xl border border-border/40 text-xs font-semibold">
        <button
          onClick={() => switchMode("work")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all ${
            mode === "work"
              ? "bg-violet-600 text-white shadow-md font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="size-3.5" />
          Focus (25m)
        </button>
        <button
          onClick={() => switchMode("shortBreak")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all ${
            mode === "shortBreak"
              ? "bg-emerald-600 text-white shadow-md font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Coffee className="size-3.5" />
          Short Break (5m)
        </button>
        <button
          onClick={() => switchMode("longBreak")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all ${
            mode === "longBreak"
              ? "bg-sky-600 text-white shadow-md font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="size-3.5" />
          Long Break (15m)
        </button>
      </div>

      {/* Timer Circle / Display */}
      <div className="relative my-8 flex items-center justify-center">
        <div className="relative flex size-56 sm:size-64 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-purple-500/10 border-4 border-violet-500/20 shadow-inner">
          <div className="flex flex-col items-center">
            <span className="text-5xl sm:text-6xl font-black tracking-tight font-mono text-foreground">
              {formatTime(timeLeft)}
            </span>
            <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {MODE_PRESETS[mode].label}
            </span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <Button
          size="lg"
          onClick={() => setIsRunning(!isRunning)}
          className="h-12 px-8 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg hover:brightness-110 font-bold text-base"
        >
          {isRunning ? (
            <>
              <Pause className="size-5 mr-2" /> Pause
            </>
          ) : (
            <>
              <Play className="size-5 mr-2 fill-current" /> Start Focus
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={resetTimer}
          className="h-12 w-12 rounded-2xl border-border/50 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-5" />
        </Button>
      </div>

      {/* Counter */}
      <div className="mt-8 pt-6 border-t border-border/40 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Completed Focus Sessions Today:</span>
        <span className="font-bold text-foreground bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full text-violet-600 dark:text-violet-300">
          {completedSessions} sessions 🎯
        </span>
      </div>
    </GlassCard>
  );
}
