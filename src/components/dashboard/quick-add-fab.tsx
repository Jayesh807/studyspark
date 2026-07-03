"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  CheckSquare,
  Calendar,
  GraduationCap,
  Timer,
  X,
  CalendarRange,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type QuickAction = "task" | "event" | "exam" | "focus" | "planner";

interface ActionConfig {
  id: QuickAction;
  label: string;
  description: string;
  icon: typeof Plus;
  gradient: string;
  view: "todos" | "calendar" | "exams" | "focus" | "planner";
}

const ACTIONS: ActionConfig[] = [
  {
    id: "task",
    label: "New Task",
    description: "Add a to-do item",
    icon: CheckSquare,
    gradient: "from-violet-500 to-fuchsia-500",
    view: "todos",
  },
  {
    id: "planner",
    label: "Plan Study",
    description: "Schedule study blocks",
    icon: CalendarRange,
    gradient: "from-cyan-500 to-blue-500",
    view: "planner",
  },
  {
    id: "event",
    label: "New Event",
    description: "Schedule a calendar event",
    icon: Calendar,
    gradient: "from-emerald-500 to-teal-500",
    view: "calendar",
  },
  {
    id: "exam",
    label: "New Exam",
    description: "Track an upcoming exam",
    icon: GraduationCap,
    gradient: "from-amber-500 to-orange-500",
    view: "exams",
  },
  {
    id: "focus",
    label: "Start Focus",
    description: "Begin a Pomodoro session",
    icon: Timer,
    gradient: "from-rose-500 to-pink-500",
    view: "focus",
  },
];

export function QuickAddFAB() {
  const [open, setOpen] = useState(false);
  const setView = useAppStore((s) => s.setView);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = (action: ActionConfig) => {
    setView(action.view);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8"
    >
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop hint (transparent, just to dim things slightly) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none fixed inset-0 z-[-1]"
            />

            {/* Action list */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-2"
            >
              {ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    onClick={() => handleSelect(action)}
                    className="group flex items-center gap-3 rounded-2xl border border-border/40 bg-background/95 p-2 pr-4 text-left shadow-lg backdrop-blur-xl transition-colors hover:bg-muted/60"
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                        action.gradient
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight">
                        {action.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        aria-expanded={open}
        className="fab-gradient relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-600 text-white shadow-xl shadow-violet-600/30 ring-1 ring-white/20"
      >
        {/* Pulsing glow ring */}
        {!open && (
          <motion.span
            animate={{
              scale: [1, 1.5],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className="absolute inset-0 rounded-full bg-violet-500"
            aria-hidden="true"
          />
        )}
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative z-10"
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="plus"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative z-10"
            >
              <Plus className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
