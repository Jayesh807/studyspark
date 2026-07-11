"use client";

import "@/styles/dashboard.css";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { QuickAddFAB } from "./quick-add-fab";
import { OnboardingTour } from "./onboarding-tour";
import { AnimatedBlobs } from "@/components/shared/animated-blobs";
import { PageLoader } from "@/components/shared/feedback";
import { Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { parseISO } from "date-fns";
import { playBell } from "./pages/focus-timer";
import { toast } from "sonner";
import type { Exam } from "@/lib/types";

function NotFoundPage() {
  const setView = useAppStore((s) => s.setView);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="text-[120px] sm:text-[160px] font-black leading-none text-gradient select-none"
        >
          404
        </motion.div>
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30"
        >
          <Sparkles className="h-5 w-5" />
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-6 text-2xl font-bold tracking-tight"
      >
        Page not found
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mt-2 max-w-md text-muted-foreground"
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mt-8"
      >
        <Button
          onClick={() => setView("dashboard")}
          className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-white shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-600/30"
        >
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}

// Lazy-load dashboard pages so the initial bundle stays light
const DashboardHome = dynamic(() => import("./pages/dashboard-home").then((m) => m.DashboardHome), {
  loading: () => <PageLoader />
});
const TodosPage = dynamic(() => import("./pages/todos").then((m) => m.TodosPage), {
  loading: () => <PageLoader />
});
const CalendarPage = dynamic(() => import("./pages/calendar").then((m) => m.CalendarPage), {
  loading: () => <PageLoader />
});
const ExamsPage = dynamic(() => import("./pages/exams").then((m) => m.ExamsPage), {
  loading: () => <PageLoader />
});
const SubjectsPage = dynamic(() => import("./pages/subjects").then((m) => m.SubjectsPage), {
  loading: () => <PageLoader />
});
const FocusTimerPage = dynamic(() => import("./pages/focus-timer").then((m) => m.FocusTimerPage), {
  loading: () => <PageLoader />,
  ssr: false
});
const AnalyticsPage = dynamic(() => import("./pages/analytics").then((m) => m.AnalyticsPage), {
  loading: () => <PageLoader />,
  ssr: false
});
const ProfilePage = dynamic(() => import("./pages/profile").then((m) => m.ProfilePage), {
  loading: () => <PageLoader />
});
const SettingsPage = dynamic(() => import("./pages/settings").then((m) => m.SettingsPage), {
  loading: () => <PageLoader />
});
const PlannerPage = dynamic(() => import("./pages/planner").then((m) => m.PlannerPage), {
  loading: () => <PageLoader />
});

function PageRouter() {
  const currentView = useAppStore((s) => s.currentView);
  const reduceMotion = useAppStore((s) => s.reduceMotion);

  const renderPage = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardHome />;
      case "todos":
        return <TodosPage />;
      case "calendar":
        return <CalendarPage />;
      case "exams":
        return <ExamsPage />;
      case "subjects":
        return <SubjectsPage />;
      case "focus":
        return <FocusTimerPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "planner":
        return <PlannerPage />;
      case "profile":
        return <ProfilePage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <NotFoundPage />;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto scrollbar-thin scroll-smooth">
      <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

export function DashboardShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteSession, setPaletteSession] = useState(0);

  const openPalette = useCallback(() => {
    setPaletteSession((s) => s + 1);
    setPaletteOpen(true);
  }, []);

  // Global Cmd+K / Ctrl+K shortcut to open the command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => {
          if (!o) setPaletteSession((s) => s + 1);
          return !o;
        });
      }
      // Quick shortcuts: N → new task, F → focus (when not typing)
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isTyping || e.metaKey || e.ctrlKey || e.altKey) return;
      if (paletteOpen) return;
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        useAppStore.getState().setView("todos");
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        useAppStore.getState().setView("focus");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [paletteOpen]);

  // Global Upcoming Exams Notification Monitor
  useEffect(() => {
    let examsList: Exam[] = [];
    const notifiedIds = new Set<string>();

    const examDate = (exam: Exam): Date => {
      const base = parseISO(exam.date);
      if (exam.time) {
        const [h, m] = exam.time.split(":").map((v) => Number(v));
        if (!Number.isNaN(h) && !Number.isNaN(m)) {
          base.setHours(h, m, 0, 0);
        }
      }
      return base;
    };

    const fetchExams = async () => {
      try {
        const data = await apiFetch<{ exams: Exam[] }>("/api/exams");
        const now = Date.now();
        // Only keep upcoming/today exams
        examsList = (data.exams ?? []).filter((e) => {
          const target = examDate(e);
          // If already passed, mark as notified so we don't alert
          if (target.getTime() < now) {
            notifiedIds.add(e.id);
            return false;
          }
          return true;
        });
      } catch {
        // ignore fetch errors
      }
    };

    // Request notification permission when dashboard shell mounts
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }

    // Initial fetch
    void fetchExams();

    // Re-fetch exams list every 30 seconds
    const fetchIntervalId = setInterval(fetchExams, 30000);

    // Check timer every second
    const tickIntervalId = setInterval(() => {
      const now = Date.now();
      examsList.forEach((e) => {
        if (notifiedIds.has(e.id)) return;
        const target = examDate(e);
        const diff = target.getTime() - now;
        if (diff <= 0) {
          notifiedIds.add(e.id);
          try {
            // Play sound chime arpeggio
            playBell("focus-end");

            // Trigger desktop notification
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              const n = new Notification("Exam Starting! 📚", {
                body: `Your exam "${e.examName}" is starting now! Good luck! 🚀`,
                icon: "/favicon.ico",
                tag: `exam-start-${e.id}`,
                silent: false,
              });
              n.onclick = () => {
                window.focus();
                n.close();
              };
            } else {
              // Fallback toast inside page
              toast.success(`Exam time! "${e.examName}" starts now! Good luck! 🚀`, {
                duration: 10000,
              });
            }
          } catch {
            // ignore
          }
        }
      });
    }, 1000);

    return () => {
      clearInterval(fetchIntervalId);
      clearInterval(tickIntervalId);
    };
  }, []);

  return (
    <div className="relative flex h-screen overflow-hidden">
      <AnimatedBlobs variant="dashboard" />
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Topbar onOpenPalette={openPalette} />
        <PageRouter />
      </div>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        sessionId={paletteSession}
      />
      <QuickAddFAB />
      <OnboardingTour />
    </div>
  );
}
