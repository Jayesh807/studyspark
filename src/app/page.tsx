"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { LandingPage } from "@/components/landing/landing-page";
import { AuthScreen } from "@/components/auth/auth-screen";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
// CommandPalette is now handled inside DashboardShell (dashboard/command-palette.tsx)
// The shared version used Command.Input syntax which is not exported by cmdk — caused Ctrl+K crash
import { PageLoader } from "@/components/shared/feedback";

export default function Home() {
  const { currentView, isAuthenticated, authLoading, setView } = useAppStore();
  const { user, handleSessionExpired } = useAuth();

  // Guard: if not authenticated and trying to view a dashboard page, bounce to landing
  useEffect(() => {
    if (!authLoading && !user) {
      if (
        currentView !== "landing" &&
        currentView !== "login" &&
        currentView !== "signup"
      ) {
        setView("landing");
      }
    }
    if (!authLoading && user) {
      if (currentView === "landing" || currentView === "login" || currentView === "signup") {
        setView("dashboard");
      }
    }
  }, [authLoading, user, currentView, setView]);

  // Global listener: when apiFetch detects a 401 on a protected endpoint,
  // it dispatches this event. We log out and redirect to login.
  useEffect(() => {
    const onSessionExpired = () => {
      handleSessionExpired();
    };
    window.addEventListener("studyspark:session-expired", onSessionExpired);
    return () =>
      window.removeEventListener("studyspark:session-expired", onSessionExpired);
  }, [handleSessionExpired]);

  // Initial session check loading screen
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30"
          >
            <svg
              className="h-7 w-7 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
            </svg>
          </motion.div>
          <p className="text-sm font-medium text-muted-foreground">
            Loading StudySpark…
          </p>
        </motion.div>
      </div>
    );
  }

  const isAuthView = currentView === "login" || currentView === "signup";
  const isDashboardView =
    user &&
    !isAuthView &&
    currentView !== "landing";

  return (
    <AnimatePresence mode="wait">
      {isDashboardView ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DashboardShell />
        </motion.div>
      ) : isAuthView ? (
        <motion.div
          key="auth"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AuthScreen />
        </motion.div>
      ) : (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LandingPage />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
