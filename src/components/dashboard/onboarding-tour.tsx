"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "studyspark:onboarding-completed-v1";

interface TourStep {
  id: string;
  title: string;
  description: string;
  /** Optional CSS selector to highlight; if absent, centers on viewport */
  selector?: string;
  /** Side of the target to anchor the popover */
  side?: "top" | "bottom" | "left" | "right" | "center";
  icon: typeof Sparkles;
  accent: string;
}

const STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to StudySpark ✨",
    description:
      "Your all-in-one student dashboard for tasks, focus sessions, exams, and analytics. Let's take a 60-second tour of what you can do.",
    side: "center",
    icon: Sparkles,
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    id: "sidebar",
    title: "Navigate from the sidebar",
    description:
      "Use the sidebar to switch between your Dashboard, Tasks, Calendar, Subjects, Exams, Focus Timer, Analytics, Achievements, and Settings.",
    selector: 'nav, [data-sidebar="true"], aside',
    side: "right",
    icon: ChevronRight,
    accent: "from-cyan-500 to-blue-500",
  },
  {
    id: "command-palette",
    title: "Press ⌘K for the Command Palette",
    description:
      "Quickly jump to any page, toggle the theme, or run actions from anywhere. Try Cmd+K (or Ctrl+K) on your keyboard.",
    selector: 'button[aria-label*="Search"], button[aria-label*="command" i]',
    side: "bottom",
    icon: Sparkles,
    accent: "from-emerald-500 to-teal-500",
  },
  {
    id: "quick-add",
    title: "Quick-add anything",
    description:
      "Tap the floating + button at the bottom-right to instantly create a task, schedule an event, add an exam, or start a focus session — no matter which page you're on.",
    selector: '[aria-label="Open quick actions"], [aria-label="Close quick actions"]',
    side: "left",
    icon: ChevronRight,
    accent: "from-amber-500 to-orange-500",
  },
  {
    id: "achievements",
    title: "Earn badges as you study",
    description:
      "Complete tasks, hit focus milestones, and maintain streaks to unlock 22 unique badges across Bronze, Silver, Gold, and Platinum tiers. Confetti included! 🎉",
    side: "center",
    icon: CheckCircle2,
    accent: "from-rose-500 to-pink-500",
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const rafRef = useRef<number | null>(null);
  const setView = useAppStore((s) => s.setView);

  // Open on first ever visit
  useEffect(() => {
    try {
      const done = window.localStorage.getItem(STORAGE_KEY);
      if (!done) {
        // Slight delay so the dashboard mounts first
        const t = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const step = STEPS[stepIdx];

  // Track target element position
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const update = () => {
      if (cancelled) return;
      if (!step.selector) {
        setTargetRect(null);
        return;
      }
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (!el) {
        setTargetRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setTargetRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [open, stepIdx, step.selector]);

  const close = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const next = () => {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      close();
    }
  };

  const prev = () => {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  };

  const skipToAchievements = () => {
    setView("achievements");
    close();
  };

  // Compute popover position
  const popoverPos = (() => {
    if (!targetRect || step.side === "center") {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const pw = 360; // approximate popover width
    const ph = 240; // approximate popover height
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = 0;
    let left = 0;
    if (step.side === "right") {
      top = targetRect.top + targetRect.height / 2 - ph / 2;
      left = targetRect.left + targetRect.width + PADDING * 2;
    } else if (step.side === "left") {
      top = targetRect.top + targetRect.height / 2 - ph / 2;
      left = targetRect.left - pw - PADDING * 2;
    } else if (step.side === "bottom") {
      top = targetRect.top + targetRect.height + PADDING * 2;
      left = targetRect.left + targetRect.width / 2 - pw / 2;
    } else {
      top = targetRect.top - ph - PADDING * 2;
      left = targetRect.left + targetRect.width / 2 - pw / 2;
    }
    // Clamp to viewport
    top = Math.max(16, Math.min(top, vh - ph - 16));
    left = Math.max(16, Math.min(left, vw - pw - 16));
    return { top: `${top}px`, left: `${left}px`, transform: "none" };
  })();

  // Cutout box for highlighted target
  const cutout = targetRect
    ? {
        top: targetRect.top - PADDING,
        left: targetRect.left - PADDING,
        width: targetRect.width + PADDING * 2,
        height: targetRect.height + PADDING * 2,
      }
    : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
        >
          {/* Dimmed overlay with cutout */}
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

          {cutout && (
            <motion.div
              initial={false}
              animate={{
                top: cutout.top,
                left: cutout.left,
                width: cutout.width,
                height: cutout.height,
              }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute rounded-xl border-2 border-violet-400 shadow-[0_0_0_4px_rgba(139,92,246,0.25),0_0_30px_rgba(217,70,239,0.4)]"
              style={{
                boxShadow:
                  "0 0 0 9999px rgba(0,0,0,0.55), 0 0 0 4px rgba(139,92,246,0.35), 0 0 30px rgba(217,70,239,0.5)",
              }}
            />
          )}

          {/* Skip button (top-right) */}
          <button
            onClick={close}
            className="absolute right-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-background/20 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md transition-colors hover:bg-background/40 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
            Skip tour
          </button>

          {/* Popover */}
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={popoverPos}
            className="absolute z-[1] w-[88vw] max-w-[360px] overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur-2xl"
          >
            {/* Accent header */}
            <div
              className={cn(
                "relative h-1.5 w-full bg-gradient-to-r",
                step.accent
              )}
            />

            <div className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md",
                    step.accent
                  )}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {stepIdx + 1} / {STEPS.length}
                </span>
              </div>

              <h3
                id="onboarding-title"
                className="text-base font-bold tracking-tight"
              >
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>

              {/* Progress dots */}
              <div className="mt-4 flex items-center gap-1.5">
                {STEPS.map((s, i) => (
                  <span
                    key={s.id}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === stepIdx
                        ? "w-6 bg-gradient-to-r from-violet-500 to-fuchsia-500"
                        : i < stepIdx
                          ? "w-1.5 bg-violet-500"
                          : "w-1.5 bg-muted"
                    )}
                  />
                ))}
              </div>

              {/* Footer buttons */}
              <div className="mt-5 flex items-center justify-between gap-2">
                <div>
                  {stepIdx > 0 && (
                    <button
                      onClick={prev}
                      className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Back
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {step.id === "achievements" && (
                    <button
                      onClick={skipToAchievements}
                      className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-600/25 transition-transform hover:scale-105"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      See badges
                    </button>
                  )}
                  <button
                    onClick={next}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-transform hover:scale-105",
                      step.id === "achievements"
                        ? "bg-foreground/80 hover:bg-foreground"
                        : "bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-violet-600/25"
                    )}
                  >
                    {stepIdx === STEPS.length - 1 ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Got it
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
