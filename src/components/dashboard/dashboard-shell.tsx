"use client";

import { Suspense, lazy } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { AnimatedBlobs } from "@/components/shared/animated-blobs";
import { PageLoader } from "@/components/shared/feedback";

// Lazy-load dashboard pages so the initial bundle stays light
const DashboardHome = lazy(() =>
  import("./pages/dashboard-home").then((m) => ({ default: m.DashboardHome }))
);
const TodosPage = lazy(() =>
  import("./pages/todos").then((m) => ({ default: m.TodosPage }))
);
const CalendarPage = lazy(() =>
  import("./pages/calendar").then((m) => ({ default: m.CalendarPage }))
);
const ExamsPage = lazy(() =>
  import("./pages/exams").then((m) => ({ default: m.ExamsPage }))
);
const SubjectsPage = lazy(() =>
  import("./pages/subjects").then((m) => ({ default: m.SubjectsPage }))
);
const FocusTimerPage = lazy(() =>
  import("./pages/focus-timer").then((m) => ({ default: m.FocusTimerPage }))
);
const AnalyticsPage = lazy(() =>
  import("./pages/analytics").then((m) => ({ default: m.AnalyticsPage }))
);
const ProfilePage = lazy(() =>
  import("./pages/profile").then((m) => ({ default: m.ProfilePage }))
);
const SettingsPage = lazy(() =>
  import("./pages/settings").then((m) => ({ default: m.SettingsPage }))
);

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
      case "profile":
        return <ProfilePage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={<PageLoader />}>{renderPage()}</Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

export function DashboardShell() {
  return (
    <div className="relative flex h-screen overflow-hidden">
      <AnimatedBlobs variant="dashboard" />
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Topbar />
        <PageRouter />
      </div>
    </div>
  );
}
